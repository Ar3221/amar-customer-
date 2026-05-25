// ==================================================
// AMAR INDUSTRIES ERP — SEND EMAIL EDGE FUNCTION
// Path: supabase/functions/send-email/index.ts
// Frontend → Edge Function → Resend → PostgreSQL logs
// ==================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { dispatchWorkflowEmails, sendEmail } from '../_shared/email/service.ts';
import type { SendEmailRequest } from '../_shared/email/types.ts';
import { HIGH_VALUE_ORDER_THRESHOLD } from '../_shared/email/config.ts';

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
    const body = await req.json();

    // Workflow batch dispatch (order lifecycle events)
    if (body.event && body.order) {
      const order = body.order;
      await dispatchWorkflowEmails(supabase, body.event, order, {
        remarks: body.remarks,
        product: body.product,
      });

      if (body.event === 'order_created' && order.totalAmount >= HIGH_VALUE_ORDER_THRESHOLD) {
        await dispatchWorkflowEmails(supabase, 'high_value_order', order);
      }

      return new Response(
        JSON.stringify({ success: true, message: `Workflow emails queued for event: ${body.event}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single email dispatch
    const request = body as SendEmailRequest;
    if (!request.type || !request.recipient || !request.payload) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, recipient, payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await sendEmail(supabase, request);

    return new Response(
      JSON.stringify({ success: result.success, error: result.error }),
      {
        status: result.success ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-email] Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
