// ==================================================
// AMAR INDUSTRIES ERP — 56 DEMO PRODUCTS CATALOGUE
// ==================================================

import type { Product } from '../types';

const CATEGORY_IMAGES: Record<string, string> = {
  'cat-1': 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?q=80&w=600',
  'cat-2': 'https://images.unsplash.com/photo-1528750951167-a2f47e0c10a4?q=80&w=600',
  'cat-3': 'https://images.unsplash.com/photo-1549476464-37392f719c28?q=80&w=600',
  'cat-4': 'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?q=80&w=600',
  'cat-5': 'https://images.unsplash.com/photo-1582281227099-7f4574488fb6?q=80&w=600',
  'cat-6': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=600',
  'cat-7': 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=600',
  'cat-8': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?q=80&w=600',
};

type CatalogLine = {
  categoryId: string;
  prefix: string;
  unitType: string;
  material: string;
  names: string[];
};

const CATALOG: CatalogLine[] = [
  {
    categoryId: 'cat-1',
    prefix: 'IC',
    unitType: 'Thousand',
    material: 'Food Grade Polypropylene (PP)',
    names: [
      'Classic 100ml Ice Cream Cup',
      'Premium 250ml Dessert Tub',
      'Economy 80ml Single Serve Cup',
      'Gelato 150ml Rounded Cup',
      'Family Pack 500ml Tub',
      'Mini 60ml Sampling Cup',
      'Export 200ml High-Clarity Cup',
    ],
  },
  {
    categoryId: 'cat-2',
    prefix: 'DY',
    unitType: 'Thousand',
    material: 'High-Density Polyethylene (HDPE)',
    names: [
      'Ghee/Butter Tub 500g',
      'Yogurt Container 200ml',
      'Curd Bowl 400g Snap-Lid',
      'Cheese Spread Tub 250g',
      'Paneer Tray 1kg Industrial',
      'Lassi Cup 300ml Stackable',
      'Cream Cheese Tub 150g Retail',
    ],
  },
  {
    categoryId: 'cat-3',
    prefix: 'IML',
    unitType: 'Thousand',
    material: 'Premium Co-Polymer PP (Deep Freeze Grade)',
    names: [
      'IML Round Tub 1 Litre',
      'IML Square 750ml Dessert',
      'IML Oval 450ml Family Tub',
      'IML 2L Party Pack Container',
      'IML 125ml Premium Gelato',
      'IML 600ml Export Grade Tub',
      'IML 350ml Retail Display Tub',
    ],
  },
  {
    categoryId: 'cat-4',
    prefix: 'PA',
    unitType: 'Thousand',
    material: 'PLA-Coated Premium Bleached Kraft Paper',
    names: [
      'Single Wall Hot Cup 8oz',
      'Double Wall Insulated 12oz',
      'Cold Drink Paper Cup 16oz',
      'Ripple Wall Coffee Cup 10oz',
      'Biodegradable Soup Bowl 500ml',
      'Branded Event Cup 6oz',
      'Export Kraft Cup 20oz',
    ],
  },
  {
    categoryId: 'cat-5',
    prefix: 'WD',
    unitType: 'Thousand',
    material: '100% Organic White Birchwood',
    names: [
      'Wooden Ice Cream Spoon 140mm',
      'Birchwood Tasting Spoon 95mm',
      'Flat Wooden Spatula 120mm',
      'Premium Stirrer 178mm',
      'Eco Fork 160mm Food-Safe',
      'Disposable Wooden Plate 6in',
      'Birchwood Cutlery Kit 3pc',
    ],
  },
  {
    categoryId: 'cat-6',
    prefix: 'ST',
    unitType: 'Million',
    material: '100% Organic White Birchwood',
    names: [
      'Wooden Ice Cream Stick 93mm',
      'Round Edge Stick 114mm',
      'Flat Paddle Stick 75mm',
      'Jumbo Stick 125mm Export',
      'Mini Stick 65mm Kids Line',
      'High-Speed Line Stick 100mm',
      'Sterile Bundle Stick 93mm',
    ],
  },
  {
    categoryId: 'cat-7',
    prefix: 'MA',
    unitType: 'Thousand',
    material: 'Phosphorized Wax Splint / Coated Board',
    names: [
      'Premium Wax Matchbox Export-40',
      'Safety Matchbox Retail-30',
      'Long Stick Kitchen Match 50',
      'Hotel Matchbook 20 Strike',
      'Windproof Storm Match 15',
      'Bulk Carton Match 100pc',
      'Custom Print Matchbox 35',
    ],
  },
  {
    categoryId: 'cat-8',
    prefix: 'PK',
    unitType: 'Roll',
    material: 'Industrial Grade Polyethylene Film',
    names: [
      'Stretch Wrap Film 23 Micron',
      'Shrink Wrap Sleeve 40 Micron',
      'Pallet Strapping Roll Heavy',
      'LDPE Layflat Tubing 100m',
      'Bubble Wrap Roll 1.2m',
      'Tamper Evident Band Roll',
      'Export Carton Sealing Tape 48mm',
    ],
  },
];

function buildProduct(index: number, line: CatalogLine, name: string, variant: number): Product {
  const id = `prod-${index}`;
  const sku = `AMAR-${line.prefix}-${String(variant).padStart(3, '0')}`;
  const basePrice = Number((0.15 + (index % 17) * 0.35 + variant * 0.08).toFixed(4));
  const moq = [10000, 25000, 50000, 100000][index % 4];
  const stockLevel = 20000 + (index * 13700) % 500000;
  const minStock = Math.floor(stockLevel * 0.35);
  const tier1 = basePrice;
  const tier2 = Number((basePrice * 0.94).toFixed(4));
  const tier3 = Number((basePrice * 0.88).toFixed(4));

  return {
    id,
    categoryId: line.categoryId,
    name,
    sku,
    description: `Industrial-grade ${name} engineered for high-volume FMCG and export manufacturing lines. MOQ optimized for contract packaging partners.`,
    dimensions: {
      height: `${40 + (index % 8) * 10}mm`,
      top_diameter: `${60 + (index % 6) * 8}mm`,
      bottom_diameter: `${45 + (index % 5) * 6}mm`,
      weight: `${(1.5 + (index % 10) * 0.7).toFixed(1)}g`,
    },
    material: line.material,
    moq,
    basePrice,
    volumePricing: [
      { qty: moq, price: tier1 },
      { qty: moq * 2, price: tier2 },
      { qty: moq * 5, price: tier3 },
    ],
    imageUrls: [CATEGORY_IMAGES[line.categoryId]],
    isAvailable: index % 11 !== 0,
    stockLevel,
    minStockThreshold: minStock,
    unitType: line.unitType,
    status: index % 11 === 0 ? 'out_of_stock' : index % 13 === 0 ? 'hidden' : 'active',
    tags: [line.prefix.toLowerCase(), 'demo', 'export', name.split(' ')[0].toLowerCase()],
    featured: index % 7 === 0,
    trending: index % 5 === 0,
    customPrinting: line.categoryId !== 'cat-6' && line.categoryId !== 'cat-7',
    packagingDetails: 'Export-grade master cartons with batch traceability labels',
    exportSpecifications: `HS Code: 3923${1000 + (index % 900)} — ISO 22000 compliant`,
    views: 200 + (index * 47) % 3000,
    ordersCount: 5 + (index * 3) % 120,
    createdAt: `2026-${String(1 + (index % 5)).padStart(2, '0')}-${String(1 + (index % 28)).padStart(2, '0')}T12:00:00Z`,
    brochureUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  };
}

/** Exactly 56 demo products — 7 per category across 8 industrial lines */
export const DEMO_PRODUCTS: Product[] = (() => {
  const products: Product[] = [];
  let index = 1;
  for (const line of CATALOG) {
    line.names.forEach((name, variant) => {
      products.push(buildProduct(index, line, name, variant + 1));
      index += 1;
    });
  }
  return products;
})();

export const INITIAL_PRODUCTS: Product[] = DEMO_PRODUCTS;
