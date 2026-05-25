import { Text } from '@react-email/components';
import * as React from 'react';
import { ADMIN_DASHBOARD_URL } from '../../config.ts';
import type { OrderEmailPayload } from '../../types.ts';
import { ActionButton, DetailRow, EmailLayout, OrderItemsTable, StatusBadge } from '../components/EmailLayout.tsx';

export function HighValueOrderAlertEmail({ order }: { order: OrderEmailPayload }) {
  const orderUrl = `${ADMIN_DASHBOARD_URL}/?menu=orders&order=${encodeURIComponent(order.orderId)}`;

  return (
    <EmailLayout preview={`High value order ${order.orderId}`} title="High Value Order Alert" accent="cyan">
      <StatusBadge label="High Value" variant="warning" />
      <Text style={p}>
        A new order inquiry exceeds the configured high-value threshold and may require executive review.
      </Text>
      <DetailRow label="Order ID" value={order.orderId} />
      <DetailRow label="Customer" value={order.customerCompany} />
      <DetailRow label="Total Value" value={`₹${order.totalAmount.toLocaleString('en-IN')}`} />
      <OrderItemsTable items={order.items} />
      <ActionButton href={orderUrl} label="View Order" />
      <ActionButton href={`${ADMIN_DASHBOARD_URL}/?menu=orders`} label="Open Dashboard" variant="secondary" />
    </EmailLayout>
  );
}

const p = { color: '#374151', fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px' };

export const highValueOrderSubject = 'High Value Order Alert';
