import { Text } from '@react-email/components';
import * as React from 'react';
import { CUSTOMER_PORTAL_URL, SUPPORT_PHONE } from '../../config.ts';
import type { OrderEmailPayload } from '../../types.ts';
import { ActionButton, DetailRow, EmailLayout, OrderItemsTable, StatusBadge } from '../components/EmailLayout.tsx';

export function OrderDispatchedEmail({ order }: { order: OrderEmailPayload }) {
  return (
    <EmailLayout preview={`Order ${order.orderId} dispatched`} title="Your Order Has Been Dispatched">
      <StatusBadge label="Dispatched" variant="success" />
      <Text style={p}>Dear {order.customerName},</Text>
      <Text style={p}>
        Your Amar Industries order <strong>{order.orderId}</strong> has been dispatched from our production facility.
      </Text>
      <DetailRow label="Order ID" value={order.orderId} />
      <DetailRow label="Delivery Address" value={order.shippingAddress || 'As per order record'} />
      <DetailRow label="Contact" value={order.phone || 'On file'} />
      <OrderItemsTable items={order.items} />
      <Text style={p}>For logistics coordination, call {SUPPORT_PHONE}.</Text>
      <ActionButton href={`${CUSTOMER_PORTAL_URL}/?tab=inquiries`} label="View Order Details" />
    </EmailLayout>
  );
}

const p = { color: '#374151', fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px' };

export const orderDispatchedSubject = 'Your Amar Industries Order Has Been Dispatched';
