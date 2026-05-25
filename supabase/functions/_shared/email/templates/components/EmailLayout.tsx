import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { COMPANY_WEBSITE, SUPPORT_EMAIL, SUPPORT_PHONE } from '../../config.ts';

const emerald = '#047857';
const emeraldDark = '#065f46';
const graphite = '#1f2937';
const graphiteLight = '#374151';
const cyan = '#06b6d4';
const silver = '#94a3b8';
const white = '#fafafa';

interface EmailLayoutProps {
  preview: string;
  title: string;
  children: React.ReactNode;
  accent?: 'emerald' | 'cyan' | 'alert';
}

export function EmailLayout({ preview, title, children, accent = 'emerald' }: EmailLayoutProps) {
  const headerGradient =
    accent === 'alert'
      ? `linear-gradient(135deg, #7f1d1d 0%, ${graphite} 100%)`
      : accent === 'cyan'
        ? `linear-gradient(135deg, ${emeraldDark} 0%, #0e7490 100%)`
        : `linear-gradient(135deg, ${emeraldDark} 0%, ${emerald} 100%)`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ ...header, background: headerGradient }}>
            <Text style={logoMark}>AMAR INDUSTRIES</Text>
            <Text style={logoSub}>Industrial Packaging ERP</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>{title}</Heading>
            {children}
          </Section>

          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerBrand}>Amar Industries</Text>
            <Text style={footerText}>
              Premium industrial packaging · Ice cream cups · Dairy tubs · IML containers
            </Text>
            <Text style={footerText}>
              <Link href={`mailto:${SUPPORT_EMAIL}`} style={link}>{SUPPORT_EMAIL}</Link>
              {' · '}{SUPPORT_PHONE}
            </Text>
            <Text style={footerText}>
              <Link href={COMPANY_WEBSITE} style={link}>{COMPANY_WEBSITE}</Link>
            </Text>
            <Text style={footerMuted}>
              This is an automated workflow message from the Amar Industries ERP platform.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function StatusBadge({ label, variant }: { label: string; variant: 'pending' | 'success' | 'warning' | 'danger' | 'info' }) {
  const colors = {
    pending: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    success: { bg: '#d1fae5', text: emeraldDark, border: '#6ee7b7' },
    warning: { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
    danger: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
    info: { bg: '#cffafe', text: '#155e75', border: cyan },
  };
  const c = colors[variant];
  return (
    <Text style={{
      display: 'inline-block',
      backgroundColor: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: '6px',
      padding: '4px 12px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      margin: '8px 0 16px',
    }}>
      {label}
    </Text>
  );
}

export function OrderItemsTable({ items }: { items: { productName: string; productSku: string; quantity: number; unitPrice: number }[] }) {
  return (
    <Section style={tableWrap}>
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Product</th>
            <th style={th}>SKU</th>
            <th style={thRight}>Qty</th>
            <th style={thRight}>Unit</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={i % 2 === 0 ? rowEven : rowOdd}>
              <td style={td}>{item.productName}</td>
              <td style={tdMuted}>{item.productSku}</td>
              <td style={tdRight}>{item.quantity.toLocaleString()}</td>
              <td style={tdRight}>₹{item.unitPrice.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

export function ActionButton({ href, label, variant = 'primary' }: { href: string; label: string; variant?: 'primary' | 'danger' | 'secondary' }) {
  const bg = variant === 'danger' ? '#dc2626' : variant === 'secondary' ? graphiteLight : emerald;
  return (
    <Button href={href} style={{ ...button, backgroundColor: bg }}>
      {label}
    </Button>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Text style={detailRow}>
      <span style={detailLabel}>{label}</span>
      <span style={detailValue}>{value}</span>
    </Text>
  );
}

const main = { backgroundColor: '#e5e7eb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: '24px 0' };
const container = { backgroundColor: white, margin: '0 auto', maxWidth: '600px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${silver}` };
const header = { padding: '28px 32px', textAlign: 'center' as const };
const logoMark = { color: white, fontSize: '22px', fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 4px' };
const logoSub = { color: cyan, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' as const, margin: 0 };
const content = { padding: '32px' };
const h1 = { color: graphite, fontSize: '20px', fontWeight: 700, margin: '0 0 16px', lineHeight: 1.3 };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const footer = { padding: '0 32px 32px', textAlign: 'center' as const };
const footerBrand = { color: emeraldDark, fontSize: '14px', fontWeight: 700, margin: '0 0 8px' };
const footerText = { color: graphiteLight, fontSize: '12px', lineHeight: 1.6, margin: '4px 0' };
const footerMuted = { color: silver, fontSize: '10px', margin: '12px 0 0' };
const link = { color: emerald, textDecoration: 'underline' };
const tableWrap = { margin: '16px 0' };
const table = { width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px' };
const th = { textAlign: 'left' as const, padding: '10px 8px', color: silver, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: `2px solid ${emerald}` };
const thRight = { ...th, textAlign: 'right' as const };
const td = { padding: '10px 8px', color: graphite, borderBottom: '1px solid #e5e7eb' };
const tdMuted = { ...td, color: graphiteLight, fontFamily: 'monospace' };
const tdRight = { ...td, textAlign: 'right' as const };
const rowEven = { backgroundColor: '#f9fafb' };
const rowOdd = { backgroundColor: white };
const button = { color: white, fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block', margin: '8px 8px 8px 0' };
const detailRow = { fontSize: '13px', lineHeight: 1.8, margin: '4px 0', color: graphiteLight };
const detailLabel = { fontWeight: 600, color: graphite, display: 'inline-block', minWidth: '140px' };
const detailValue = { color: graphiteLight };
