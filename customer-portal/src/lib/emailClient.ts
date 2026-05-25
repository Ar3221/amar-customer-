// ==================================================
// AMAR INDUSTRIES ERP — EMAIL CLIENT (Frontend → Edge Functions)
// Never sends email directly from the browser.
// ==================================================

import { supabase, isSupabaseConfigured } from '../supabaseClient';
import type { Order, Product } from '../types';

export type WorkflowEmailEvent =
  | 'order_created'
  | 'order_approved'
  | 'order_rejected'
  | 'order_processing'
  | 'order_dispatched'
  | 'inventory_low'
  | 'high_value_order'
  | 'order_escalated';

export function orderToEmailPayload(order: Order) {
  const lastRemark = order.remarks[order.remarks.length - 1];
  return {
    orderId: order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    customerCompany: order.customerCompany,
    customerEmail: order.shippingDetails.email || '',
    totalAmount: order.totalAmount,
    status: order.status,
    items: order.items.map((item) => ({
      productName: item.productName,
      productSku: item.productSku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    remarks: lastRemark?.content,
    shippingAddress: `${order.shippingDetails.address}, ${order.shippingDetails.city}`,
    phone: order.shippingDetails.phone,
    supervisorName: order.supervisorName,
    createdAt: order.createdAt,
  };
}

export function productToInventoryPayload(product: Product) {
  return {
    productId: product.id,
    productName: product.name,
    productSku: product.sku,
    stockLevel: product.stockLevel,
    minThreshold: product.minStockThreshold,
    unitType: product.unitType,
  };
}

export async function triggerWorkflowEmail(
  event: WorkflowEmailEvent,
  order: Order,
  options?: { remarks?: string; product?: Product }
): Promise<void> {
  const payload = {
    event,
    order: { ...orderToEmailPayload(order), remarks: options?.remarks ?? orderToEmailPayload(order).remarks },
    product: options?.product ? productToInventoryPayload(options.product) : undefined,
  };

  if (!isSupabaseConfigured || !supabase) {
    console.info(`[Email — Mock Mode] ${event}`, payload);
    return;
  }

  try {
    const { error } = await supabase.functions.invoke('send-email', { body: payload });
    if (error) console.error(`[Email] Failed to invoke send-email for ${event}:`, error);
  } catch (err) {
    console.error(`[Email] Edge function error (${event}):`, err);
  }
}
