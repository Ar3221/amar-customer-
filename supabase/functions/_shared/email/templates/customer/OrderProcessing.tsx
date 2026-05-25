import { Text } from '@react-email/components';
import * as React from 'react';
import { CUSTOMER_PORTAL_URL } from '../../config.ts';
import type { OrderEmailPayload } from '../../types.ts';
import { ActionButton, DetailRow, EmailLayout, OrderItemsTable, StatusBadge } from '../components/EmailLayout.tsx';

export function OrderProcessingEmail({ order }: { order: OrderEmailPayload }) {
  return (
    <EmailLayout preview={`Order ${order.orderId} is now processing`} title="Your Order Is Now Being Processed" accent="cyan">
      <StatusBadge label="Processing" variant="info" />
      <Text style={p}>Dear {order.customerName},</Text>
      <Text style={p}>
        Your approved order <strong>{order.orderId}</strong> has entered our manufacturing and fulfillment pipeline.
      </Text>
      <DetailRow label="Order ID" value={order.orderId} />
      <DetailRow label="Total Value" value={`₹${order.totalAmount.toLocaleString('en-IN')}`} />
      <OrderItemsTable items={order.items} />
      <Text style={p}>We will notify you when your order is dispatched from our facility.</Text>
      <ActionButton href={`${CUSTOMER_PORTAL_URL}/?tab=inquiries`} label="Track Order" />
    </EmailLayout>
  );
}

const p = { color: '#374151', fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px' };

export const orderProcessingSubject = 'Your Order Is Now Being Processed';
