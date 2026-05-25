// ==================================================
// AMAR INDUSTRIES ERP — PERSISTENT MOCK DATABASE ENGINE
// Path: admin/src/mockData.ts
// ==================================================

import type { Category, Product, Order, User, OrderStatus, RemarkType } from './types';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { triggerWorkflowEmail } from './lib/emailClient';
import { INITIAL_PRODUCTS } from './data/demoProducts';
import { DEMO_ANALYTICS_ORDERS } from './data/demoOrders';

// 1. RAW STATIC CATEGORIES DATA (8 REQUIRED INDUSTRIAL LINES)
export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Ice Cream Cups',
    slug: 'ice-cream-cups',
    description: 'Premium plastic & paper thermoformed cups with custom brand print compatibility.',
    imageUrl: 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?q=80&w=600'
  },
  {
    id: 'cat-2',
    name: 'Dairy Cups',
    slug: 'dairy-cups',
    description: 'Industrial grade packaging for Butter, Curd, Cheese Spread, and Yogurt lines.',
    imageUrl: 'https://images.unsplash.com/photo-1528750951167-a2f47e0c10a4?q=80&w=600'
  },
  {
    id: 'cat-3',
    name: 'IML Containers',
    slug: 'iml-containers',
    description: 'High-definition In-Mold Labelling containers offering photographic graphics and deep freeze stability.',
    imageUrl: 'https://images.unsplash.com/photo-1549476464-37392f719c28?q=80&w=600'
  },
  {
    id: 'cat-4',
    name: 'Paper Cups',
    slug: 'paper-cups',
    description: 'Eco-friendly biodegradable single and double wall paper cups for hot & cold FMCG beverages.',
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?q=80&w=600'
  },
  {
    id: 'cat-5',
    name: 'Wooden Products',
    slug: 'wooden-products',
    description: 'Food-safe polished wooden ice cream spoons, flat sticks, and birchwood plates.',
    imageUrl: 'https://images.unsplash.com/photo-1582281227099-7f4574488fb6?q=80&w=600'
  },
  {
    id: 'cat-6',
    name: 'Ice Cream Sticks',
    slug: 'ice-cream-sticks',
    description: 'Double-polished organic white birchwood sticks formulated for high-speed automatic freezer inserters.',
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=600'
  },
  {
    id: 'cat-7',
    name: 'Match Products',
    slug: 'match-products',
    description: 'Wax and wooden safety matches manufactured for premium retail and massive global export runs.',
    imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=600'
  },
  {
    id: 'cat-8',
    name: 'Packaging Products',
    slug: 'packaging-products',
    description: 'Industrial shrink wrap, high-tensile stretch film, and automated strapping seals.',
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?q=80&w=600'
  }
];

export { INITIAL_PRODUCTS } from './data/demoProducts';

// 3. SAMPLE REGISTERED USERS
export const SAMPLE_USERS: User[] = [
  {
    id: 'usr-customer-1',
    email: 'buyer@nestle.com',
    role: 'customer',
    fullName: 'David Thorne (Nestle Global Procurement)',
    password: 'customer123',
    phoneNumber: '+91 98765 43210',
    companyName: 'Nestlé India Private Limited',
    gstNumber: '07AAACN0279L1Z5',
    shippingAddress: 'Plot No. 2, Industrial Focal Point, Moga, Punjab, 142001',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-supervisor-1',
    email: 'supervisor@amarsplints.com',
    role: 'supervisor',
    fullName: 'Rahul Sharma (Operations Lead)',
    password: 'super123',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr-admin-1',
    email: 'admin@amarsplints.com',
    role: 'admin',
    fullName: 'Amarjit Singh (Managing Director)',
    password: 'admin123',
    createdAt: '2026-01-01T00:00:00Z'
  }
];

// 4. MOCK SYSTEM ORDERS HISTORY
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-2026-001',
    customerId: 'usr-customer-1',
    customerName: 'David Thorne',
    customerCompany: 'Nestlé India Private Limited',
    status: 'under_review',
    totalAmount: 80000.00,
    shippingDetails: {
      fullName: 'David Thorne',
      address: 'Plot No. 2, Industrial Focal Point',
      city: 'Moga, Punjab',
      phone: '+91 98765 43210',
      email: 'buyer@nestle.com'
    },
    gstNumber: '07AAACN0279L1Z5',
    notes: 'Required matching branding colors on lids. Please confirm printing plate costs.',
    supervisorId: 'usr-supervisor-1',
    supervisorName: 'Rahul Sharma',
    createdAt: '2026-05-18T10:00:00Z', // 7 days ago! This triggers escalation automatically
    updatedAt: '2026-05-18T10:00:00Z',
    items: [
      {
        id: 'item-1',
        orderId: 'ORD-2026-001',
        productId: 'prod-1',
        productName: 'Classic 100ml Ice Cream Cup',
        productSku: 'AMAR-IC-100',
        quantity: 100000,
        unitPrice: 0.8000
      }
    ],
    remarks: [
      {
        id: 'rem-1',
        orderId: 'ORD-2026-001',
        authorId: 'usr-supervisor-1',
        authorName: 'Rahul Sharma',
        authorRole: 'supervisor',
        content: 'Verification complete. Client confirmed printing artwork specs. Pending admin final approval.',
        type: 'operational',
        createdAt: '2026-05-19T11:00:00Z'
      }
    ]
  },
  {
    id: 'ORD-2026-002',
    customerId: 'usr-customer-1',
    customerName: 'David Thorne',
    customerCompany: 'Nestlé India Private Limited',
    status: 'pending',
    totalAmount: 110000.00,
    shippingDetails: {
      fullName: 'David Thorne',
      address: 'Plot No. 2, Industrial Focal Point',
      city: 'Moga, Punjab',
      phone: '+91 98765 43210',
      email: 'buyer@nestle.com'
    },
    gstNumber: '07AAACN0279L1Z5',
    notes: 'Shipment needed before middle of next month.',
    createdAt: '2026-05-24T15:30:00Z', // Fresh order
    updatedAt: '2026-05-24T15:30:00Z',
    items: [
      {
        id: 'item-2',
        orderId: 'ORD-2026-002',
        productId: 'prod-6',
        productName: 'Single Wall Hot Cup 8oz',
        productSku: 'AMAR-PA-08H',
        quantity: 100000,
        unitPrice: 1.1000
      }
    ],
    remarks: []
  },
  {
    id: 'ORD-2026-003',
    customerId: 'usr-customer-1',
    customerName: 'David Thorne',
    customerCompany: 'Nestlé India Private Limited',
    status: 'approved',
    totalAmount: 150000.00,
    shippingDetails: {
      fullName: 'David Thorne',
      address: 'Plot No. 2, Industrial Focal Point',
      city: 'Moga, Punjab',
      phone: '+91 98765 43210',
      email: 'buyer@nestle.com'
    },
    gstNumber: '07AAACN0279L1Z5',
    notes: 'Urgent procurement run.',
    supervisorId: 'usr-supervisor-1',
    supervisorName: 'Rahul Sharma',
    approvedAt: '2026-05-22T14:00:00Z',
    createdAt: '2026-05-21T09:15:00Z',
    updatedAt: '2026-05-22T14:00:00Z',
    items: [
      {
        id: 'item-3',
        orderId: 'ORD-2026-003',
        productId: 'prod-5',
        productName: 'IML Round Tub 1 Litre',
        productSku: 'AMAR-IML-1000',
        quantity: 20000,
        unitPrice: 7.5000
      }
    ],
    remarks: [
      {
        id: 'rem-2',
        orderId: 'ORD-2026-003',
        authorId: 'usr-admin-1',
        authorName: 'Amarjit Singh',
        authorRole: 'admin',
        content: 'Approved for manufacturing queue #3. Stock levels verified.',
        type: 'approval',
        createdAt: '2026-05-22T14:00:00Z'
      }
    ]
  }
];

// Helper to write to local storage
const setStorage = (key: string, data: any) => {
  localStorage.setItem(`amar_${key}`, JSON.stringify(data));
};

// Helper to read from local storage
const getStorage = (key: string, defaultData: any) => {
  const item = localStorage.getItem(`amar_${key}`);
  return item ? JSON.parse(item) : defaultData;
};

const mergeOrdersById = (storedOrders: Order[], seedOrders: Order[]) => {
  const seen = new Set<string>();
  return [...storedOrders, ...seedOrders].filter((order) => {
    if (seen.has(order.id)) return false;
    seen.add(order.id);
    return true;
  });
};

// Initialize mock DB
export const initializeMockDB = () => {
  if (!localStorage.getItem('amar_categories')) {
    setStorage('categories', INITIAL_CATEGORIES);
  }
  const storedProducts = getStorage('products', [] as Product[]);
  if (!localStorage.getItem('amar_products') || storedProducts.length < 56) {
    setStorage('products', INITIAL_PRODUCTS);
    localStorage.setItem('amar_catalog_version', '56');
  }
  const allSeedOrders = [...INITIAL_ORDERS, ...DEMO_ANALYTICS_ORDERS];
  const storedOrders = getStorage('orders', [] as Order[]);
  if (!localStorage.getItem('amar_orders')) {
    setStorage('orders', allSeedOrders);
    localStorage.setItem('amar_orders_version', 'analytics-v1');
  } else {
    const mergedOrders = mergeOrdersById(storedOrders, allSeedOrders);
    if (mergedOrders.length !== storedOrders.length) {
      setStorage('orders', mergedOrders);
      localStorage.setItem('amar_orders_version', 'analytics-v1');
    }
  }
  if (!localStorage.getItem('amar_users')) {
    setStorage('users', SAMPLE_USERS);
  }
  if (!localStorage.getItem('amar_currentUser')) {
    setStorage('currentUser', SAMPLE_USERS[1]); // default Supervisor for Admin panel
  }
  if (!localStorage.getItem('amar_notifications')) {
    setStorage('notifications', [
      {
        id: 'notif-1',
        title: 'Welcome to AMAR Industries ERP',
        message: 'Your industrial buyer portal is fully synchronized.',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ]);
  }
  
  // Run SLA Check on initialization!
  runSlaEscalationCheck();

  // Async pull from Supabase if configured (Local-First Sync Strategy)
  if (isSupabaseConfigured && supabase) {
    pullDatabaseFromSupabase();
  }
};

// Asynchronous Local-First Live Pull from Supabase
const pullDatabaseFromSupabase = async () => {
  try {
    const { data: dbCats } = await supabase!.from('categories').select('*');
    if (dbCats && dbCats.length > 0) setStorage('categories', dbCats);

    const { data: dbProds } = await supabase!.from('products').select('*');
    if (dbProds && dbProds.length > 0) setStorage('products', dbProds);

    const { data: dbOrders } = await supabase!.from('orders').select('*, order_items(*), remarks(*)');
    if (dbOrders && dbOrders.length > 0) {
      const formatted = dbOrders.map(o => ({
        ...o,
        items: o.order_items || [],
        remarks: o.remarks || []
      }));
      setStorage('orders', formatted);
    }
  } catch (err) {
    console.error('⚠️ [Supabase Pull Error]: Failed background sync.', err);
  }
};

// Trigger Automatic SLA Escalations locally
export const runSlaEscalationCheck = () => {
  const orders = getStorage('orders', INITIAL_ORDERS) as Order[];
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 7);
  let updated = false;

  const updatedOrders = orders.map(order => {
    if ((order.status === 'pending' || order.status === 'under_review') && new Date(order.createdAt) < thresholdDate) {
      order.status = 'escalated';
      order.escalatedAt = new Date().toISOString();
      updated = true;

      // Add escalation remark if not already added
      const hasEscRemark = order.remarks.some(r => r.type === 'escalation');
      if (!hasEscRemark) {
        order.remarks.push({
          id: `rem-esc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          orderId: order.id,
          authorId: 'system',
          authorName: 'SLA Engine',
          authorRole: 'admin',
          content: 'SLA BREACH DETECTED: Order pending for over 7 days. Escalated automatically to Executive Director.',
          type: 'escalation',
          createdAt: new Date().toISOString()
        });
      }
    }
    return order;
  });

  if (updated) {
    setStorage('orders', updatedOrders);
    
    // Add alert notification
    const notifications = getStorage('notifications', []);
    notifications.unshift({
      id: `notif-esc-${Date.now()}`,
      title: '⚠️ SLA Breach: Escalations Triggered',
      message: 'One or more pending inquiries have breached processing limits and have been escalated.',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    setStorage('notifications', notifications);
  }
};

// EXPORTED OPERATIONS
export const db = {
  getCategories: (): Category[] => getStorage('categories', INITIAL_CATEGORIES),
  
  getProducts: (): Product[] => getStorage('products', INITIAL_PRODUCTS),
  
  getProductById: (id: string): Product | undefined => {
    return db.getProducts().find(p => p.id === id);
  },
  
  getOrders: (): Order[] => getStorage('orders', [...INITIAL_ORDERS, ...DEMO_ANALYTICS_ORDERS]),
  
  getOrderById: (id: string): Order | undefined => {
    return db.getOrders().find(o => o.id === id);
  },

  getCurrentUser: (): User => getStorage('currentUser', SAMPLE_USERS[1]),
  
  setCurrentUser: (user: User) => setStorage('currentUser', user),
  
  getNotifications: () => getStorage('notifications', []),
  
  markNotificationsRead: () => {
    const list = db.getNotifications().map((n: any) => ({ ...n, isRead: true }));
    setStorage('notifications', list);
  },

  // DATABASE WRAPPERS

  createProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'views' | 'ordersCount'>) => {
    const products = db.getProducts();
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      views: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString()
    };

    products.unshift(newProduct);
    setStorage('products', products);

    // Live Supabase Sync if configured
    if (isSupabaseConfigured && supabase) {
      supabase!.from('products').insert([
        {
          id: newId,
          category_id: productData.categoryId,
          name: productData.name,
          sku: productData.sku,
          description: productData.description,
          dimensions: productData.dimensions,
          material: productData.material,
          moq: productData.moq,
          base_price: productData.basePrice,
          volume_pricing: productData.volumePricing,
          image_urls: productData.imageUrls,
          is_available: productData.isAvailable,
          stock_level: productData.stockLevel,
          min_stock_threshold: productData.minStockThreshold,
          status: productData.status,
          unit_type: productData.unitType,
          featured: productData.featured,
          trending: productData.trending,
          custom_printing: productData.customPrinting,
          packaging_details: productData.packagingDetails,
          export_specifications: productData.exportSpecifications,
          tags: productData.tags
        }
      ]).then(({ error }) => {
        if (error) console.error('⚠️ [Supabase Sync Error]: Failed to create product.', error);
      });
    }

    return newProduct;
  },

  updateProduct: (productId: string, productData: Partial<Product>) => {
    const products = db.getProducts();
    const updated = products.map(p => {
      if (p.id === productId) {
        return { ...p, ...productData };
      }
      return p;
    });

    setStorage('products', updated);

    // Live Supabase Sync if configured
    if (isSupabaseConfigured && supabase) {
      supabase!.from('products').update({
        category_id: productData.categoryId,
        name: productData.name,
        sku: productData.sku,
        description: productData.description,
        dimensions: productData.dimensions,
        material: productData.material,
        moq: productData.moq,
        base_price: productData.basePrice,
        volume_pricing: productData.volumePricing,
        image_urls: productData.imageUrls,
        is_available: productData.isAvailable,
        stock_level: productData.stockLevel,
        min_stock_threshold: productData.minStockThreshold,
        status: productData.status,
        unit_type: productData.unitType,
        featured: productData.featured,
        trending: productData.trending,
        custom_printing: productData.customPrinting,
        packaging_details: productData.packagingDetails,
        export_specifications: productData.exportSpecifications,
        tags: productData.tags
      }).eq('id', productId).then(({ error }) => {
        if (error) console.error('⚠️ [Supabase Sync Error]: Failed to update product.', error);
      });
    }
  },

  deleteProduct: (productId: string, actor: User): boolean => {
    // Supervisor Permission Check: cannot delete critical factory products
    if (actor.role === 'supervisor' && productId.startsWith('prod-') && Number(productId.split('-')[1]) < 100) {
      return false; // Permission denied!
    }

    const products = db.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    setStorage('products', filtered);

    // Live Supabase Sync if configured
    if (isSupabaseConfigured && supabase) {
      supabase!.from('products').delete().eq('id', productId).then(({ error }) => {
        if (error) console.error('⚠️ [Supabase Sync Error]: Failed to delete product.', error);
      });
    }

    return true;
  },
  
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'remarks' | 'status'>) => {
    const orders = db.getOrders();
    const prefix = `ORD-${new Date().getFullYear()}-`;
    const sequence = String(orders.length + 1).padStart(3, '0');
    const newOrderId = `${prefix}${sequence}`;

    const newOrder: Order = {
      ...orderData,
      id: newOrderId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      remarks: []
    };

    orders.unshift(newOrder);
    setStorage('orders', orders);

    // Create system notification for operations team
    const notifs = db.getNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      title: '📦 Order Inquiry Submitted',
      message: `Inquiry ${newOrderId} from ${orderData.customerCompany} is under initial verification.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    setStorage('notifications', notifs);

    triggerWorkflowEmail('order_created', newOrder).catch(console.error);

    return newOrder;
  },

  updateOrderStatus: (orderId: string, status: OrderStatus, actor: User, remarkText?: string) => {
    const orders = db.getOrders();
    const updated = orders.map(order => {
      if (order.id === orderId) {
        order.status = status;
        order.updatedAt = new Date().toISOString();

        if (status === 'approved') {
          order.approvedAt = new Date().toISOString();

          // AUTOMATIC INVENTORY DECREMENTING TRIGGER
          order.items.forEach(item => {
            const product = db.getProductById(item.productId);
            if (product) {
              const newStock = Math.max(0, product.stockLevel - item.quantity);
              
              // Increment analytics ordered count
              const newOrdersCount = (product.ordersCount || 0) + 1;

              // Automatic out of stock status triggers
              const updatedStatus = newStock === 0 ? 'out_of_stock' : product.status;
              const isAvailable = newStock > 0;

              db.updateProduct(product.id, { 
                stockLevel: newStock, 
                status: updatedStatus,
                isAvailable: isAvailable,
                ordersCount: newOrdersCount
              });

              // LOW STOCK / OUT OF STOCK AUTOMATED LOGISTICS NOTIFICATION
              if (newStock <= product.minStockThreshold) {
                const isOos = newStock === 0;
                const notifs = db.getNotifications();
                notifs.unshift({
                  id: `notif-stock-${Date.now()}-${item.productId}`,
                  title: isOos ? '🚨 Out of Stock Critical Alert' : '⚠️ Low Stock Warning Alert',
                  message: isOos 
                    ? `Factory catalog item ${product.name} (${product.sku}) is completely OUT OF STOCK after order run ${order.id}.` 
                    : `Catalog item ${product.name} (${product.sku}) stock levels have reached critical threshold: ${newStock} units left.`,
                  isRead: false,
                  createdAt: new Date().toISOString()
                });
                setStorage('notifications', notifs);
                const updatedProduct = db.getProductById(item.productId);
                if (updatedProduct) {
                  triggerWorkflowEmail('inventory_low', order, { product: updatedProduct }).catch(console.error);
                }
              }
            }
          });
        }
        
        if (status === 'rejected') order.rejectedAt = new Date().toISOString();

        // Assign supervisor on first workflow pull
        if (actor.role === 'supervisor' && !order.supervisorId) {
          order.supervisorId = actor.id;
          order.supervisorName = actor.fullName;
        }

        if (remarkText) {
          let remarkType: RemarkType = 'operational';
          if (status === 'approved') remarkType = 'approval';
          if (status === 'rejected') remarkType = 'rejection';
          if (status === 'escalated') remarkType = 'escalation';

          order.remarks.push({
            id: `rem-${Date.now()}`,
            orderId,
            authorId: actor.id,
            authorName: actor.fullName,
            authorRole: actor.role,
            content: remarkText,
            type: remarkType,
            createdAt: new Date().toISOString()
          });
        }
      }
      return order;
    });

    setStorage('orders', updated);

    // Create customer notification + workflow emails
    const order = updated.find(o => o.id === orderId);
    if (order) {
      const notifs = db.getNotifications();
      notifs.unshift({
        id: `notif-status-${Date.now()}`,
        title: `🔄 Status Update: ${order.id}`,
        message: `Your inquiry status is now: ${status.replace('_', ' ').toUpperCase()}.`,
        isRead: false,
        createdAt: new Date().toISOString()
      });
      setStorage('notifications', notifs);

      const emailEventMap: Partial<Record<OrderStatus, Parameters<typeof triggerWorkflowEmail>[0]>> = {
        approved: 'order_approved',
        rejected: 'order_rejected',
        processing: 'order_processing',
        dispatched: 'order_dispatched',
        escalated: 'order_escalated',
      };
      const emailEvent = emailEventMap[status];
      if (emailEvent) {
        triggerWorkflowEmail(emailEvent, order, { remarks: remarkText }).catch(console.error);
      }
    }
  },

  addRemark: (orderId: string, author: User, content: string, type: RemarkType = 'operational') => {
    const orders = db.getOrders();
    const updated = orders.map(order => {
      if (order.id === orderId) {
        order.remarks.push({
          id: `rem-${Date.now()}`,
          orderId,
          authorId: author.id,
          authorName: author.fullName,
          authorRole: author.role,
          content,
          type,
          createdAt: new Date().toISOString()
        });
        order.updatedAt = new Date().toISOString();
      }
      return order;
    });
    setStorage('orders', updated);
  },

  updateProductStock: (productId: string, newStock: number) => {
    const product = db.getProductById(productId);
    if (product) {
      const updatedStatus = newStock === 0 ? 'out_of_stock' : 'active';
      const isAvailable = newStock > 0;
      db.updateProduct(productId, { 
        stockLevel: newStock, 
        status: updatedStatus,
        isAvailable: isAvailable
      });
    }
  },

  incrementProductViews: (productId: string) => {
    const product = db.getProductById(productId);
    if (product) {
      const newViews = (product.views || 0) + 1;
      db.updateProduct(productId, { views: newViews });
    }
  },

  authenticateUser: (email: string, password: string): User | null => {
    const list = getStorage('users', SAMPLE_USERS) as User[];
    const found = list.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    return found || null;
  },

  getUsers: (): User[] => getStorage('users', SAMPLE_USERS),

  createStaff: (staffData: Omit<User, 'id' | 'createdAt'>): User => {
    const list = db.getUsers();
    const newId = `usr-${Date.now()}`;
    const newStaff: User = {
      ...staffData,
      id: newId,
      createdAt: new Date().toISOString()
    };
    list.push(newStaff);
    setStorage('users', list);
    return newStaff;
  },

  deleteStaff: (userId: string, actorId: string): boolean => {
    if (userId === actorId) {
      return false; // prevent self-deletion
    }
    const list = db.getUsers();
    const filtered = list.filter(u => u.id !== userId);
    setStorage('users', filtered);
    return true;
  },

  promoteToAdmin: (userId: string): boolean => {
    const list = db.getUsers();
    let found = false;
    const updated = list.map(u => {
      if (u.id === userId) {
        found = true;
        return { ...u, role: 'admin' as const };
      }
      return u;
    });
    if (found) {
      setStorage('users', updated);
    }
    return found;
  }
};
