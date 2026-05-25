// ==================================================
// AMAR INDUSTRIES ERP — REACT EMAIL RENDERER
// ==================================================

import { render } from '@react-email/render';
import * as React from 'react';
import type {
  EmailTemplateName,
  EscalationEmailPayload,
  InventoryAlertPayload,
  OrderEmailPayload,
  RenderedEmail,
} from './types.ts';
import { OrderReceivedEmail, orderReceivedSubject } from './templates/customer/OrderReceived.tsx';
import { OrderApprovedEmail, orderApprovedSubject } from './templates/customer/OrderApproved.tsx';
import { OrderRejectedEmail, orderRejectedSubject } from './templates/customer/OrderRejected.tsx';
import { OrderProcessingEmail, orderProcessingSubject } from './templates/customer/OrderProcessing.tsx';
import { OrderDispatchedEmail, orderDispatchedSubject } from './templates/customer/OrderDispatched.tsx';
import { NewOrderAlertEmail, newOrderAlertSubject } from './templates/supervisor/NewOrderAlert.tsx';
import { EscalationAlertEmail, escalationAlertSubject } from './templates/admin/EscalationAlert.tsx';
import { LowInventoryAlertEmail, lowInventorySubject } from './templates/admin/LowInventoryAlert.tsx';
import { HighValueOrderAlertEmail, highValueOrderSubject } from './templates/admin/HighValueOrderAlert.tsx';

export async function renderEmailTemplate(
  type: EmailTemplateName,
  payload: OrderEmailPayload | InventoryAlertPayload | EscalationEmailPayload
): Promise<RenderedEmail> {
  switch (type) {
    case 'customer_order_received': {
      const order = payload as OrderEmailPayload;
      return {
        templateName: type,
        subject: orderReceivedSubject,
        html: await render(<OrderReceivedEmail order={order} />),
      };
    }
    case 'customer_order_approved': {
      const order = payload as OrderEmailPayload;
      return {
        templateName: type,
        subject: orderApprovedSubject,
        html: await render(<OrderApprovedEmail order={order} />),
      };
    }
    case 'customer_order_rejected': {
      const order = payload as OrderEmailPayload;
      return {
        templateName: type,
        subject: orderRejectedSubject,
        html: await render(<OrderRejectedEmail order={order} />),
      };
    }
    case 'customer_order_processing': {
      const order = payload as OrderEmailPayload;
      return {
        templateName: type,
        subject: orderProcessingSubject,
        html: await render(<OrderProcessingEmail order={order} />),
      };
    }
    case 'customer_order_dispatched': {
      const order = payload as OrderEmailPayload;
      return {
        templateName: type,
        subject: orderDispatchedSubject,
        html: await render(<OrderDispatchedEmail order={order} />),
      };
    }
    case 'supervisor_new_order': {
      const order = payload as OrderEmailPayload;
      return {
        templateName: type,
        subject: newOrderAlertSubject,
        html: await render(<NewOrderAlertEmail order={order} />),
      };
    }
    case 'admin_escalation': {
      const order = payload as EscalationEmailPayload;
      return {
        templateName: type,
        subject: escalationAlertSubject,
        html: await render(<EscalationAlertEmail order={order} />),
      };
    }
    case 'admin_low_inventory': {
      const product = payload as InventoryAlertPayload;
      return {
        templateName: type,
        subject: lowInventorySubject,
        html: await render(<LowInventoryAlertEmail product={product} />),
      };
    }
    case 'admin_high_value_order': {
      const order = payload as OrderEmailPayload;
      return {
        templateName: type,
        subject: highValueOrderSubject,
        html: await render(<HighValueOrderAlertEmail order={order} />),
      };
    }
    default:
      throw new Error(`Unknown email template: ${type}`);
  }
}
