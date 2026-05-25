import { Text } from '@react-email/components';
import * as React from 'react';
import { ADMIN_DASHBOARD_URL } from '../../config.ts';
import type { InventoryAlertPayload } from '../../types.ts';
import { ActionButton, DetailRow, EmailLayout, StatusBadge } from '../components/EmailLayout.tsx';

export function LowInventoryAlertEmail({ product }: { product: InventoryAlertPayload }) {
  return (
    <EmailLayout preview={`Low stock: ${product.productName}`} title="Inventory Warning" accent="alert">
      <StatusBadge label="Low Stock" variant="warning" />
      <Text style={p}>Factory inventory has fallen below the configured reorder threshold.</Text>
      <DetailRow label="Product" value={product.productName} />
      <DetailRow label="SKU" value={product.productSku} />
      <DetailRow label="Current Stock" value={`${product.stockLevel.toLocaleString()} ${product.unitType || 'units'}`} />
      <DetailRow label="Reorder Point" value={`${product.minThreshold.toLocaleString()} ${product.unitType || 'units'}`} />
      <Text style={p}>Please initiate replenishment or adjust production scheduling in the ERP dashboard.</Text>
      <ActionButton href={`${ADMIN_DASHBOARD_URL}/?menu=inventory`} label="Open Dashboard" />
      <ActionButton href={`${ADMIN_DASHBOARD_URL}/?menu=products`} label="View Product" variant="secondary" />
    </EmailLayout>
  );
}

const p = { color: '#374151', fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px' };

export const lowInventorySubject = 'Inventory Warning — Stock Running Low';
