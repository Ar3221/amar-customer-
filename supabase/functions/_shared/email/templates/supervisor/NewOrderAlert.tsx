import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { ADMIN_DASHBOARD_URL } from '../../config.ts';
import type { OrderEmailPayload } from '../../types.ts';
import { ActionButton, DetailRow, EmailLayout, OrderItemsTable, StatusBadge } from '../components/EmailLayout.tsx';

export function NewOrderAlertEmail({ order }: { order: OrderEmailPayload }) {
  const base = ADMIN_DASHBOARD_URL;
  const orderUrl = `${base}/?menu=orders&order=${encodeURIComponent(order.orderId)}`;

  return (
    <EmailLayout preview={`New order ${order.orderId} from ${order.customerCompany}`} title="New Order Request Received" accent="cyan">
      <StatusBadge label="Action Required" variant="warning" />
      <Text style={p}>A new customer order inquiry requires your review.</Text>
      <DetailRow label="Order ID" value={order.orderId} />
      <DetailRow label="Customer" value={order.customerName} />
      <DetailRow label="Company" value={order.customerCompany} />
      <DetailRow label="Email" value={order.customerEmail} />
      <DetailRow label="Total Value" value={`₹${order.totalAmount.toLocaleString('en-IN')}`} />
      <OrderItemsTable items={order.items} />
      <Section style={{ marginTop: '24px' }}>
        <ActionButton href={`${orderUrl}&action=approve`} label="Approve Order" />
        <ActionButton href={`${orderUrl}&action=reject`} label="Reject Order" variant="danger" />
        <ActionButton href={orderUrl} label="Open Dashboard" variant="secondary" />
      </Section>
    </EmailLayout>
  );
}

const p = { color: '#374151', fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px' };

export const newOrderAlertSubject = 'New Order Request Received';
