import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { SUPPORT_EMAIL } from '../../config.ts';
import type { OrderEmailPayload } from '../../types.ts';
import { DetailRow, EmailLayout, OrderItemsTable, StatusBadge } from '../components/EmailLayout.tsx';

export function OrderReceivedEmail({ order }: { order: OrderEmailPayload }) {
  return (
    <EmailLayout
      preview={`Order ${order.orderId} received — pending approval`}
      title="Your Order Request Has Been Received"
    >
      <StatusBadge label="Pending Approval" variant="pending" />
      <Text style={p}>Dear {order.customerName},</Text>
      <Text style={p}>
        Thank you for submitting your order inquiry to <strong>Amar Industries</strong>.
        Our operations team is reviewing your request and will respond shortly.
      </Text>
      <DetailRow label="Order ID" value={order.orderId} />
      <DetailRow label="Company" value={order.customerCompany} />
      <DetailRow label="Total Value" value={`₹${order.totalAmount.toLocaleString('en-IN')}`} />
      <OrderItemsTable items={order.items} />
      <Section style={{ marginTop: '20px', padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #6ee7b7' }}>
        <Text style={{ ...p, margin: 0, color: '#065f46' }}>
          Your order is <strong>pending supervisor approval</strong>. You will receive an email once a decision is made.
        </Text>
      </Section>
      <Text style={p}>
        Questions? Contact our support team at {SUPPORT_EMAIL}.
      </Text>
    </EmailLayout>
  );
}

const p = { color: '#374151', fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px' };

export const orderReceivedSubject = 'Your Amar Industries Order Request Has Been Received';
