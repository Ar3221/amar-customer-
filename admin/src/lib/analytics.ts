// ==================================================
// AMAR INDUSTRIES ERP — ANALYTICS ENGINE
// ==================================================

import type { Order, Product, Category } from '../types';

export type AnalyticsViewMode = 'state' | 'company' | 'sales' | 'quantity';

export type AnalyticsMeasure = 'revenue' | 'quantity' | 'orders';

export interface AnalyticsPreferences {
  viewMode: AnalyticsViewMode;
  measure: AnalyticsMeasure;
  includePending: boolean;
}

export const DEFAULT_ANALYTICS_PREFS: AnalyticsPreferences = {
  viewMode: 'state',
  measure: 'revenue',
  includePending: true,
};

export interface ChartDatum {
  name: string;
  value: number;
  revenue?: number;
  quantity?: number;
  orders?: number;
}

const STORAGE_KEY = 'amar_analytics_preferences';

export function loadAnalyticsPreferences(): AnalyticsPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_ANALYTICS_PREFS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_ANALYTICS_PREFS;
}

export function saveAnalyticsPreferences(prefs: AnalyticsPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/** Parse state from "City, State" shipping format */
export function extractState(city: string): string {
  const parts = city.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1];
  const known = ['Punjab', 'Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Haryana', 'Rajasthan', 'West Bengal', 'Uttar Pradesh'];
  const hit = known.find((s) => city.includes(s));
  return hit || parts[0] || 'Other';
}

export function filterOrdersForAnalytics(orders: Order[], includePending: boolean): Order[] {
  if (includePending) return orders;
  return orders.filter((o) => !['pending', 'rejected'].includes(o.status));
}

export function orderQuantity(order: Order): number {
  return order.items.reduce((sum, i) => sum + i.quantity, 0);
}

function aggregateMap(
  orders: Order[],
  keyFn: (o: Order) => string
): ChartDatum[] {
  const map = new Map<string, { revenue: number; quantity: number; orders: number }>();

  for (const o of orders) {
    const key = keyFn(o) || 'Unknown';
    const cur = map.get(key) || { revenue: 0, quantity: 0, orders: 0 };
    cur.revenue += o.totalAmount;
    cur.quantity += orderQuantity(o);
    cur.orders += 1;
    map.set(key, cur);
  }

  return Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      value: 0,
      revenue: v.revenue,
      quantity: v.quantity,
      orders: v.orders,
    }))
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
}

export function getMeasureValue(d: ChartDatum, measure: AnalyticsMeasure): number {
  if (measure === 'revenue') return d.revenue || 0;
  if (measure === 'quantity') return d.quantity || 0;
  return d.orders || 0;
}

export function withMeasureValues(data: ChartDatum[], measure: AnalyticsMeasure): ChartDatum[] {
  return data.map((d) => ({ ...d, value: getMeasureValue(d, measure) }));
}

export function aggregateByState(orders: Order[]): ChartDatum[] {
  return aggregateMap(orders, (o) => extractState(o.shippingDetails.city));
}

export function aggregateByCompany(orders: Order[]): ChartDatum[] {
  return aggregateMap(orders, (o) => o.customerCompany || o.customerName);
}

export function aggregateSalesTimeline(orders: Order[]): ChartDatum[] {
  const map = new Map<string, { value: number; sort: number }>();
  for (const o of orders) {
    const d = new Date(o.createdAt);
    const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    const sort = d.getFullYear() * 12 + d.getMonth();
    const cur = map.get(key) || { value: 0, sort };
    cur.value += o.totalAmount;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, value: v.value, revenue: v.value, orders: v.sort }))
    .sort((a, b) => (a.orders || 0) - (b.orders || 0));
}

export function aggregateQuantityByCategory(
  orders: Order[],
  products: Product[],
  categories: Category[]
): ChartDatum[] {
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const prodCat = new Map(products.map((p) => [p.id, p.categoryId]));
  const map = new Map<string, number>();

  for (const o of orders) {
    for (const item of o.items) {
      const catId = prodCat.get(item.productId);
      const label = catName.get(catId || '') || 'Uncategorized';
      map.set(label, (map.get(label) || 0) + item.quantity);
    }
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, quantity: value }))
    .sort((a, b) => b.value - a.value);
}

export function buildChartData(
  orders: Order[],
  products: Product[],
  categories: Category[],
  prefs: AnalyticsPreferences
): ChartDatum[] {
  const filtered = filterOrdersForAnalytics(orders, prefs.includePending);

  switch (prefs.viewMode) {
    case 'state':
      return withMeasureValues(aggregateByState(filtered), prefs.measure);
    case 'company':
      return withMeasureValues(aggregateByCompany(filtered), prefs.measure);
    case 'sales':
      return aggregateSalesTimeline(filtered);
    case 'quantity':
      return aggregateQuantityByCategory(filtered, products, categories);
    default:
      return [];
  }
}

export function measureLabel(measure: AnalyticsMeasure): string {
  switch (measure) {
    case 'revenue':
      return 'Sales (₹)';
    case 'quantity':
      return 'Quantity (units)';
    case 'orders':
      return 'Order count';
  }
}

export function viewModeTitle(mode: AnalyticsViewMode): string {
  switch (mode) {
    case 'state':
      return 'State-wise Performance';
    case 'company':
      return 'Company-wise Performance';
    case 'sales':
      return 'Sales Timeline';
    case 'quantity':
      return 'Quantity by Category';
  }
}

/** Full metrics table for any view mode */
export function getAnalyticsTableRows(
  orders: Order[],
  products: Product[],
  categories: Category[],
  prefs: AnalyticsPreferences
): ChartDatum[] {
  const filtered = filterOrdersForAnalytics(orders, prefs.includePending);
  switch (prefs.viewMode) {
    case 'state':
      return aggregateByState(filtered);
    case 'company':
      return aggregateByCompany(filtered);
    case 'quantity':
      return aggregateQuantityByCategory(filtered, products, categories).map((d) => ({
        ...d,
        revenue: 0,
        orders: 0,
      }));
    case 'sales':
      return aggregateSalesTimeline(filtered).map((d) => ({
        ...d,
        quantity: 0,
        orders: 0,
      }));
    default:
      return [];
  }
}

export function formatMeasureValue(value: number, measure: AnalyticsMeasure): string {
  if (measure === 'revenue' || measure === undefined) {
    return `₹${value.toLocaleString('en-IN')}`;
  }
  if (measure === 'quantity') {
    return value.toLocaleString('en-IN');
  }
  return String(value);
}
