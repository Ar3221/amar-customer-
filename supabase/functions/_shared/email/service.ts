// ==================================================
// AMAR INDUSTRIES ERP — EMAIL SERVICE LAYER
// ==================================================

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { MAX_EMAIL_RETRIES, EMAIL_RETRY_DELAY_MS } from './config.ts';
import { canSendToUser, logEmail } from './logger.ts';
import { sendWithRetry } from './resend.ts';
import { renderEmailTemplate } from './renderer.tsx';
import type {
  EmailTemplateName,
  EscalationEmailPayload,
  InventoryAlertPayload,
  OrderEmailPayload,
  SendEmailRequest,
} from './types.ts';

const PREFERENCE_MAP: Partial<Record<EmailTemplateName, string>> = {
  customer_order_received: 'order_received',
  customer_order_approved: 'order_status_updates',
  customer_order_rejected: 'order_status_updates',
  customer_order_processing: 'order_status_updates',
  customer_order_dispatched: 'order_status_updates',
  supervisor_new_order: 'supervisor_alerts',
  admin_escalation: 'escalation_alerts',
  admin_low_inventory: 'inventory_alerts',
  admin_high_value_order: 'high_value_alerts',
};

export async function sendEmail(
  supabase: SupabaseClient,
  request: SendEmailRequest
): Promise<{ success: boolean; error?: string }> {
  const prefKey = PREFERENCE_MAP[request.type];
  if (prefKey) {
    const allowed = await canSendToUser(supabase, request.userId, prefKey);
    if (!allowed) {
      console.log(`[Email] Skipped ${request.type} for ${request.recipient} — preferences disabled`);
      return { success: true };
    }
  }

  const rendered = await renderEmailTemplate(request.type, request.payload);

  await logEmail(supabase, {
    recipient: request.recipient,
    subject: rendered.subject,
    templateName: request.type,
    status: 'queued',
    orderId: request.orderId,
    userId: request.userId,
    metadata: { type: request.type },
  });

  const result = await sendWithRetry(
    request.recipient,
    rendered.subject,
    rendered.html,
    MAX_EMAIL_RETRIES,
    EMAIL_RETRY_DELAY_MS
  );

  await logEmail(supabase, {
    recipient: request.recipient,
    subject: rendered.subject,
    templateName: request.type,
    status: result.success ? 'sent' : 'failed',
    errorMessage: result.error,
    orderId: request.orderId,
    userId: request.userId,
    retryCount: MAX_EMAIL_RETRIES,
    metadata: { resendId: result.id },
  });

  return result;
}

// --- Public API functions ---

export async function sendOrderReceivedEmail(
  supabase: SupabaseClient,
  recipient: string,
  order: OrderEmailPayload,
  userId?: string
) {
  return sendEmail(supabase, {
    type: 'customer_order_received',
    recipient,
    orderId: order.orderId,
    userId,
    payload: order,
  });
}

export async function sendApprovalEmail(
  supabase: SupabaseClient,
  recipient: string,
  order: OrderEmailPayload,
  userId?: string
) {
  return sendEmail(supabase, {
    type: 'customer_order_approved',
    recipient,
    orderId: order.orderId,
    userId,
    payload: order,
  });
}

export async function sendRejectionEmail(
  supabase: SupabaseClient,
  recipient: string,
  order: OrderEmailPayload,
  userId?: string
) {
  return sendEmail(supabase, {
    type: 'customer_order_rejected',
    recipient,
    orderId: order.orderId,
    userId,
    payload: order,
  });
}

export async function sendProcessingEmail(
  supabase: SupabaseClient,
  recipient: string,
  order: OrderEmailPayload,
  userId?: string
) {
  return sendEmail(supabase, {
    type: 'customer_order_processing',
    recipient,
    orderId: order.orderId,
    userId,
    payload: order,
  });
}

export async function sendDispatchEmail(
  supabase: SupabaseClient,
  recipient: string,
  order: OrderEmailPayload,
  userId?: string
) {
  return sendEmail(supabase, {
    type: 'customer_order_dispatched',
    recipient,
    orderId: order.orderId,
    userId,
    payload: order,
  });
}

export async function sendNewOrderAlertEmail(
  supabase: SupabaseClient,
  recipient: string,
  order: OrderEmailPayload,
  userId?: string
) {
  return sendEmail(supabase, {
    type: 'supervisor_new_order',
    recipient,
    orderId: order.orderId,
    userId,
    payload: order,
  });
}

export async function sendEscalationEmail(
  supabase: SupabaseClient,
  recipient: string,
  order: EscalationEmailPayload,
  userId?: string
) {
  return sendEmail(supabase, {
    type: 'admin_escalation',
    recipient,
    orderId: order.orderId,
    userId,
    payload: order,
  });
}

export async function sendInventoryAlertEmail(
  supabase: SupabaseClient,
  recipient: string,
  product: InventoryAlertPayload,
  userId?: string
) {
  return sendEmail(supabase, {
    type: 'admin_low_inventory',
    recipient,
    userId,
    payload: product,
  });
}

export async function sendHighValueOrderAlertEmail(
  supabase: SupabaseClient,
  recipient: string,
  order: OrderEmailPayload,
  userId?: string
) {
  return sendEmail(supabase, {
    type: 'admin_high_value_order',
    recipient,
    orderId: order.orderId,
    userId,
    payload: order,
  });
}

export async function dispatchWorkflowEmails(
  supabase: SupabaseClient,
  event: string,
  order: OrderEmailPayload,
  options?: { remarks?: string; product?: InventoryAlertPayload }
) {
  const orderPayload: OrderEmailPayload = {
    ...order,
    remarks: options?.remarks ?? order.remarks,
  };

  const { data: staff } = await supabase
    .from('users')
    .select('id, email, role_role, full_name')
    .in('role_role', ['supervisor', 'admin']);

  const supervisors = (staff || []).filter((u) => u.role_role === 'supervisor');
  const admins = (staff || []).filter((u) => u.role_role === 'admin');

  const customerEmail = order.customerEmail;
  if (!customerEmail) return;

  switch (event) {
    case 'order_created': {
      await sendOrderReceivedEmail(supabase, customerEmail, orderPayload, order.customerId);
      for (const supervisor of supervisors) {
        await sendNewOrderAlertEmail(supabase, supervisor.email, orderPayload, supervisor.id);
      }
      break;
    }
    case 'order_approved':
      await sendApprovalEmail(supabase, customerEmail, orderPayload, order.customerId);
      break;
    case 'order_rejected':
      await sendRejectionEmail(supabase, customerEmail, orderPayload, order.customerId);
      break;
    case 'order_processing':
      await sendProcessingEmail(supabase, customerEmail, orderPayload, order.customerId);
      break;
    case 'order_dispatched':
      await sendDispatchEmail(supabase, customerEmail, orderPayload, order.customerId);
      break;
    case 'inventory_low':
      if (options?.product) {
        for (const admin of admins) {
          await sendInventoryAlertEmail(supabase, admin.email, options.product, admin.id);
        }
      }
      break;
    case 'high_value_order':
      for (const admin of admins) {
        await sendHighValueOrderAlertEmail(supabase, admin.email, orderPayload, admin.id);
      }
      break;
    case 'order_escalated': {
      const escalation: EscalationEmailPayload = {
        ...orderPayload,
        pendingDays: order.pendingDays ?? 7,
        supervisorName: order.supervisorName,
      };
      for (const admin of admins) {
        await sendEscalationEmail(supabase, admin.email, escalation, admin.id);
      }
      break;
    }
  }
}
