// ==================================================
// AMAR INDUSTRIES ERP — EMAIL SYSTEM TYPES
// ==================================================

export type EmailTemplateName =
  | 'customer_order_received'
  | 'customer_order_approved'
  | 'customer_order_rejected'
  | 'customer_order_processing'
  | 'customer_order_dispatched'
  | 'supervisor_new_order'
  | 'admin_escalation'
  | 'admin_low_inventory'
  | 'admin_high_value_order';

export type EmailLogStatus = 'queued' | 'sent' | 'failed' | 'retrying';

export interface OrderItemPayload {
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderEmailPayload {
  orderId: string;
  customerId?: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  items: OrderItemPayload[];
  remarks?: string;
  shippingAddress?: string;
  phone?: string;
  createdAt?: string;
  supervisorName?: string;
  pendingDays?: number;
}

export interface InventoryAlertPayload {
  productId: string;
  productName: string;
  productSku: string;
  stockLevel: number;
  minThreshold: number;
  unitType?: string;
}

export interface EscalationEmailPayload extends OrderEmailPayload {
  supervisorName?: string;
  supervisorEmail?: string;
  pendingDays: number;
}

export interface SendEmailRequest {
  type: EmailTemplateName;
  recipient: string;
  userId?: string;
  orderId?: string;
  payload: OrderEmailPayload | InventoryAlertPayload | EscalationEmailPayload;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  templateName: EmailTemplateName;
}
