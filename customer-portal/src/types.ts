// ==================================================
// AMAR INDUSTRIES ERP — SYSTEM TYPE DEFINITIONS
// Path: customer-portal/src/types.ts
// ==================================================

export type UserRole = 'customer' | 'supervisor' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  password?: string;
  phoneNumber?: string;
  companyName?: string;
  gstNumber?: string;
  shippingAddress?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

export interface VolumePriceTier {
  qty: number;
  price: number;
}

export interface ProductDimensions {
  height?: string;
  top_diameter?: string;
  bottom_diameter?: string;
  weight?: string;
  length?: string;
  width?: string;
  thickness?: string;
  sticks?: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  sku: string;
  description: string;
  dimensions: ProductDimensions;
  material: string;
  moq: number;
  basePrice: number;
  volumePricing: VolumePriceTier[];
  imageUrls: string[];
  isAvailable: boolean;
  stockLevel: number;
  minStockThreshold: number;
  unitType: string;
  status: 'active' | 'hidden' | 'out_of_stock';
  tags: string[];
  featured: boolean;
  trending: boolean;
  customPrinting: boolean;
  packagingDetails?: string;
  exportSpecifications?: string;
  views: number;
  ordersCount: number;
  createdAt: string;
}

export type OrderStatus = 
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'dispatched'
  | 'delivered'
  | 'escalated';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
}

export type RemarkType = 'approval' | 'rejection' | 'operational' | 'escalation';

export interface Remark {
  id: string;
  orderId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  type: RemarkType;
  createdAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  status: OrderStatus;
  totalAmount: number;
  shippingDetails: {
    fullName: string;
    address: string;
    city: string;
    phone: string;
    email?: string;
  };
  gstNumber?: string;
  notes?: string;
  supervisorId?: string;
  supervisorName?: string;
  escalatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  remarks: Remark[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedPrice: number;
}
