import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { CUSTOMER_PORTAL_URL, SUPPORT_EMAIL } from '../../config.ts';
import type { OrderEmailPayload } from '../../types.ts';
import { ActionButton, DetailRow, EmailLayout, OrderItemsTable, StatusBadge } from '../components/EmailLayout.tsx';

export function OrderApprovedEmail({ order }: { order: OrderEmailPayload }) {
  return (
    <EmailLayout preview={`Order ${order.orderId} approved`} title="Your Order Has Been Approved" accent="cyan">
      <StatusBadge label="Approved" variant="success" />
      <Text style={p}>Dear {order.customerName},</Text>
      <Text style={p}>
        Great news — your Amar Industries order inquiry has been <strong>approved</strong> and is entering our production workflow.
      </Text>
      <DetailRow label="Order ID" value={order.orderId} />
      <DetailRow label="Total Value" value={`₹${order.totalAmount.toLocaleString('en-IN')}`} />
      <OrderItemsTable items={order.items} />
      {order.remarks && (
        <Section style={remarksBox}>
          <Text style={remarksLabel}>Approval Remarks</Text>
          <Text style={remarksText}>{order.remarks}</Text>
        </Section>
      )}
      <Text style={p}><strong>Next steps:</strong> Our logistics team will coordinate production scheduling and dispatch updates via email.</Text>
      <ActionButton href={`${CUSTOMER_PORTAL_URL}/?tab=inquiries`} label="View Order Status" />
      <Text style={p}>Support: {SUPPORT_EMAIL}</Text>
    </EmailLayout>
  );
}

const p = { color: '#374151', fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px' };
const remarksBox = { margin: '16px 0', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', borderLeft: '4px solid #047857' };
const remarksLabel = { fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#6b7280', margin: '0 0 8px', fontWeight: 700 };
const remarksText = { fontSize: '13px', color: '#1f2937', margin: 0, lineHeight: 1.6 };

export const orderApprovedSubject = 'Your Amar Industries Order Has Been Approved';
