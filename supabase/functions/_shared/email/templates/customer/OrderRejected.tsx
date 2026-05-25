import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { CUSTOMER_PORTAL_URL, SUPPORT_EMAIL } from '../../config.ts';
import type { OrderEmailPayload } from '../../types.ts';
import { ActionButton, DetailRow, EmailLayout, StatusBadge } from '../components/EmailLayout.tsx';

export function OrderRejectedEmail({ order }: { order: OrderEmailPayload }) {
  return (
    <EmailLayout preview={`Update on order ${order.orderId}`} title="Update Regarding Your Order" accent="alert">
      <StatusBadge label="Not Approved" variant="danger" />
      <Text style={p}>Dear {order.customerName},</Text>
      <Text style={p}>
        We have reviewed your order inquiry <strong>{order.orderId}</strong> and are unable to proceed at this time.
      </Text>
      {order.remarks && (
        <Section style={remarksBox}>
          <Text style={remarksLabel}>Rejection Remarks</Text>
          <Text style={remarksText}>{order.remarks}</Text>
        </Section>
      )}
      <DetailRow label="Order ID" value={order.orderId} />
      <DetailRow label="Company" value={order.customerCompany} />
      <Text style={p}>
        You may submit a revised inquiry or contact our commercial team to discuss alternatives.
      </Text>
      <ActionButton href={`${CUSTOMER_PORTAL_URL}/?tab=catalog`} label="Browse Catalog" variant="secondary" />
      <ActionButton href={`mailto:${SUPPORT_EMAIL}`} label="Contact Support" />
    </EmailLayout>
  );
}

const p = { color: '#374151', fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px' };
const remarksBox = { margin: '16px 0', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', borderLeft: '4px solid #dc2626' };
const remarksLabel = { fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#991b1b', margin: '0 0 8px', fontWeight: 700 };
const remarksText = { fontSize: '13px', color: '#1f2937', margin: 0, lineHeight: 1.6 };

export const orderRejectedSubject = 'Update Regarding Your Amar Industries Order';
