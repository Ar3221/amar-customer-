import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { ADMIN_DASHBOARD_URL } from '../../config.ts';
import type { EscalationEmailPayload } from '../../types.ts';
import { ActionButton, DetailRow, EmailLayout, OrderItemsTable, StatusBadge } from '../components/EmailLayout.tsx';

export function EscalationAlertEmail({ order }: { order: EscalationEmailPayload }) {
  const orderUrl = `${ADMIN_DASHBOARD_URL}/?menu=orders&order=${encodeURIComponent(order.orderId)}`;

  return (
    <EmailLayout
      preview={`Critical escalation: ${order.orderId}`}
      title="Critical Escalation Alert"
      accent="alert"
    >
      <StatusBadge label="SLA Breached — Escalated" variant="danger" />
      <Text style={p}>
        An order has exceeded the 7-day approval SLA and requires executive attention immediately.
      </Text>
      <DetailRow label="Order ID" value={order.orderId} />
      <DetailRow label="Customer" value={`${order.customerName} (${order.customerCompany})`} />
      <DetailRow label="Pending Duration" value={`${order.pendingDays} days`} />
      <DetailRow label="Assigned Supervisor" value={order.supervisorName || 'Unassigned'} />
      <DetailRow label="Priority" value="CRITICAL" />
      <DetailRow label="Order Value" value={`₹${order.totalAmount.toLocaleString('en-IN')}`} />
      <OrderItemsTable items={order.items} />
      <Section style={{ marginTop: '24px' }}>
        <ActionButton href={orderUrl} label="Review Order" variant="danger" />
        <ActionButton href={`${ADMIN_DASHBOARD_URL}/?menu=orders`} label="Open Dashboard" variant="secondary" />
      </Section>
    </EmailLayout>
  );
}

const p = { color: '#374151', fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px' };

export const escalationAlertSubject = 'Critical Escalation Alert — Pending Order Requires Attention';
