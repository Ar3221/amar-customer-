// ==================================================
// AMAR INDUSTRIES ERP — AUTOMATED SLA ESCALATION ENGINE
// Path: supabase/functions/escalate-orders/index.ts
// ==================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { dispatchWorkflowEmails } from '../_shared/email/service.ts';
import type { OrderEmailPayload } from '../_shared/email/types.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 7);
    const thresholdISO = thresholdDate.toISOString();

    const { data: stagnantOrders, error: fetchError } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        created_at,
        status,
        customer_id,
        supervisor_id,
        customer:customer_id (full_name, email, company_name),
        supervisor:supervisor_id (full_name, email)
      `)
      .in('status', ['pending', 'under_review'])
      .lt('created_at', thresholdISO);

    if (fetchError) throw fetchError;

    if (!stagnantOrders || stagnantOrders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No stagnant orders found. Escalation engine idle.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const order of stagnantOrders) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'escalated', escalated_at: new Date().toISOString() })
        .eq('id', order.id);

      if (updateError) {
        console.error(`Failed to escalate order ${order.id}:`, updateError);
        continue;
      }

      await supabase.from('remarks').insert({
        order_id: order.id,
        author_id: order.supervisor_id || order.customer_id,
        content: 'SLA Breached: Order pending approval for over 7 days. Escalated automatically to Executive Board.',
        type: 'escalation',
      });

      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role_role', 'admin');

      if (admins) {
        for (const admin of admins) {
          await supabase.from('notifications').insert({
            user_id: admin.id,
            title: `SLA CRITICAL ESCALATION: Order ${String(order.id).slice(0, 8)}`,
            message: `Order from ${order.customer?.company_name} (Total: ₹${order.total_amount}) has breached the 7-day workflow SLA.`,
            type: 'escalation',
          });
        }
      }

      const { data: items } = await supabase
        .from('order_items')
        .select('quantity, unit_price, product:product_id (name, sku)')
        .eq('order_id', order.id);

      const pendingDays = Math.floor(
        (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const emailPayload: OrderEmailPayload = {
        orderId: order.id,
        customerId: order.customer_id,
        customerName: order.customer?.full_name || 'Customer',
        customerCompany: order.customer?.company_name || 'N/A',
        customerEmail: order.customer?.email || '',
        totalAmount: Number(order.total_amount),
        status: 'escalated',
        items: (items || []).map((i: Record<string, unknown>) => ({
          productName: (i.product as { name: string })?.name || 'Product',
          productSku: (i.product as { sku: string })?.sku || 'N/A',
          quantity: i.quantity as number,
          unitPrice: Number(i.unit_price),
        })),
        supervisorName: order.supervisor?.full_name,
        pendingDays,
        createdAt: order.created_at,
      };

      await dispatchWorkflowEmails(supabase, 'order_escalated', emailPayload);

      await supabase.from('activity_logs').insert({
        action: 'order_escalated',
        metadata: {
          order_id: order.id,
          total_amount: order.total_amount,
          customer: order.customer?.company_name,
        },
      });

      results.push({ order_id: order.id, status: 'escalated' });
    }

    return new Response(
      JSON.stringify({ message: 'Escalation completed.', results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Escalation Engine error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
