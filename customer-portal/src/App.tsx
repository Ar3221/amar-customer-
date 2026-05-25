// ==================================================
// AMAR INDUSTRIES ERP — CUSTOMER PORTAL MAIN MODULE
// Path: customer-portal/src/App.tsx
// ==================================================

import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Search, Filter, ShoppingCart, FileText, AlertTriangle, 
  TrendingUp, Box, ChevronRight, ArrowLeft, 
  User, Plus, Minus, Bell, Award, Globe, ShieldAlert,
  Briefcase, Check, FileCheck, Layers, Star, Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, initializeMockDB } from './mockData';
import type { Product, Order, CartItem, User as SystemUser, OrderStatus } from './types';
import { EmailPreferences } from './components/EmailPreferences';
import { WhatsAppFAB } from './components/WhatsAppFAB';
import { PDFViewer } from './components/PDFViewer';
import { generateWhatsAppLink, getProductInquiryMessage } from './utils/whatsapp';
import { MessageCircle } from 'lucide-react';

// Cart Context Definition
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'cart' | 'inquiries'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<SystemUser>(SAMPLE_CUSTOMER);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pdfUrl, setPdfUrl] = useState<{url: string, title: string} | null>(null);

  // Sample static profiles for demo switching
  const profiles = [
    SAMPLE_CUSTOMER,
    SAMPLE_SUPERVISOR,
    SAMPLE_ADMIN
  ];

  useEffect(() => {
    initializeMockDB();
    setCurrentUser(db.getCurrentUser());
    setNotifications(db.getNotifications());
    setOrders(db.getOrders());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'amar_orders') {
        setOrders(db.getOrders());
      }
    };
    
    window.addEventListener('storage', handleStorage);
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'AMAR_ORDER_SYNC_RESPONSE') {
        const newOrders = event.data.orders;
        if (newOrders && Array.isArray(newOrders)) {
          localStorage.setItem('amar_orders', JSON.stringify(newOrders));
          setOrders(newOrders);
        }
      }
    });

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const refreshState = () => {
    setNotifications(db.getNotifications());
    setOrders(db.getOrders());
  };

  const handleRoleChange = (roleName: string) => {
    const target = profiles.find(p => p.role === roleName) || SAMPLE_CUSTOMER;
    db.setCurrentUser(target);
    setCurrentUser(target);
    refreshState();
  };

  // Cart operations
  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      let calculatedPrice = product.basePrice;
      
      // Calculate tiered pricing
      const tiers = [...product.volumePricing].sort((a, b) => b.qty - a.qty);
      const matchingTier = tiers.find(t => quantity >= t.qty);
      if (matchingTier) calculatedPrice = matchingTier.price;

      if (existing) {
        const newQty = existing.quantity + quantity;
        const newMatchingTier = tiers.find(t => newQty >= t.qty);
        const finalPrice = newMatchingTier ? newMatchingTier.price : product.basePrice;

        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: newQty, selectedPrice: finalPrice } 
            : item
        );
      }
      return [...prev, { product, quantity, selectedPrice: calculatedPrice }];
    });
    
    // Quick notification trigger
    const notifs = db.getNotifications();
    notifs.unshift({
      id: `notif-cart-${Date.now()}`,
      title: 'Item Added to Request Cart',
      message: `${product.name} (${quantity.toLocaleString()} units) is added to your request drafting cart.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    db.markNotificationsRead(); // mock update
    refreshState();
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        let calculatedPrice = item.product.basePrice;
        const tiers = [...item.product.volumePricing].sort((a, b) => b.qty - a.qty);
        const matchingTier = tiers.find(t => quantity >= t.qty);
        if (matchingTier) calculatedPrice = matchingTier.price;

        return { ...item, quantity, selectedPrice: calculatedPrice };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * item.selectedPrice), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      <div className="min-h-screen bg-grid-glow bg-slate-50 text-slate-900 flex flex-col relative">
        
        {/* TOP STATUS BAR & SWITCHER */}
        <div className="bg-white border-b border-slate-200 py-1.5 px-4 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-brand-green animate-spin-slow" />
            <span>Amar Systems — Global Industrial Portal v2026.5</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-slate-500">Demo Role Quick Switcher:</span>
            <div className="flex bg-slate-100 rounded border border-slate-200 p-0.5">
              <button 
                onClick={() => handleRoleChange('customer')}
                className={`px-2 py-0.5 rounded transition ${currentUser.role === 'customer' ? 'bg-brand-green/20 text-brand-green font-bold' : 'hover:text-slate-700'}`}
              >
                Customer
              </button>
              <button 
                onClick={() => handleRoleChange('supervisor')}
                className={`px-2 py-0.5 rounded transition ${currentUser.role === 'supervisor' ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'hover:text-slate-700'}`}
              >
                Supervisor
              </button>
              <button 
                onClick={() => handleRoleChange('admin')}
                className={`px-2 py-0.5 rounded transition ${currentUser.role === 'admin' ? 'bg-amber-500/20 text-amber-600 font-bold' : 'hover:text-slate-700'}`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        {/* MAIN NAVIGATION HEADER */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('home'); setSelectedProduct(null); }}>
            <div className="bg-brand-green text-white p-2 rounded-lg font-bold shadow-md">
              AM
            </div>
            <div>
              <h1 className="font-extrabold tracking-tight text-lg leading-none text-slate-900">
                AMAR SYSTEMS
              </h1>
              <span className="text-[10px] tracking-widest text-brand-green uppercase font-bold">
                Amar Systems Enterprise
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <button 
              onClick={() => { setActiveTab('home'); setSelectedProduct(null); }}
              className={`transition ${activeTab === 'home' ? 'text-brand-green border-b-2 border-brand-green pb-1' : 'text-slate-500 hover:text-slate-900 pb-1'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => { setActiveTab('catalog'); setSelectedProduct(null); }}
              className={`transition ${activeTab === 'catalog' ? 'text-brand-green border-b-2 border-brand-green pb-1' : 'text-slate-500 hover:text-slate-900 pb-1'}`}
            >
              Products
            </button>
            <button 
              onClick={() => { setActiveTab('inquiries'); setSelectedProduct(null); }}
              className={`transition ${activeTab === 'inquiries' ? 'text-brand-green border-b-2 border-brand-green pb-1' : 'text-slate-500 hover:text-slate-900 pb-1'}`}
            >
              Invoices
            </button>
            <button 
              className={`transition text-slate-500 hover:text-slate-900 pb-1`}
            >
              Support
            </button>
          </nav>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) db.markNotificationsRead();
                }}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 shadow-2xl rounded-xl p-4 z-50">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                    <span className="font-bold text-xs text-brand-green uppercase tracking-wider">System Broadcasts</span>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] text-slate-400 hover:text-slate-600">Close</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No recent messages.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-2 bg-slate-50 rounded border border-slate-100 text-xs">
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="font-bold text-slate-800">{n.title}</span>
                            <span className="text-[9px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-slate-500 leading-normal">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Icon / New Request */}
            <button 
              onClick={() => { setActiveTab('cart'); setSelectedProduct(null); }}
              className="relative flex items-center gap-2 bg-brand-green hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md shadow-brand-green/20 transition"
            >
              <span>New Request</span>
              {cart.length > 0 && (
                <span className="bg-white text-brand-green text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-inner animate-bounce">
                  {cart.length}
                </span>
              )}
            </button>

            {/* User Logged in Badge */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-slate-800 leading-none">{currentUser.fullName.split(' ')[0]}</p>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{currentUser.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY LAYOUT */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 relative">
          {selectedProduct ? (
            <ProductDetailView 
              product={selectedProduct} 
              onBack={() => setSelectedProduct(null)} 
              onAddToCart={addToCart}
              onViewPdf={setPdfUrl}
            />
          ) : (
            <>
              {activeTab === 'home' && <HomeView onExplore={() => setActiveTab('catalog')} onProductClick={setSelectedProduct} onViewPdf={setPdfUrl} />}
              {activeTab === 'catalog' && <CatalogView onProductClick={setSelectedProduct} onViewPdf={setPdfUrl} />}
              {activeTab === 'cart' && <CartView onInquirySuccess={() => { setActiveTab('inquiries'); refreshState(); }} />}
              {activeTab === 'inquiries' && <InquiriesView orders={orders} currentUser={currentUser} />}
            </>
          )}
        </main>

        {/* SYSTEM FOOTER */}
        <footer className="bg-white border-t border-slate-200 py-10 px-6 mt-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-brand-green font-extrabold text-xl">
                AM
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  AMAR SYSTEMS ENTERPRISE
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-8 text-xs text-slate-500 font-semibold">
              <a href="#" className="hover:text-brand-green">Privacy Policy</a>
              <a href="#" className="hover:text-brand-green">Terms of Service</a>
              <a href="#" className="hover:text-brand-green">Security Audit</a>
              <a href="#" className="hover:text-brand-green">Status</a>
            </div>

            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Amar Systems Enterprise. All rights reserved.
            </p>
          </div>
        </footer>

        {/* GLOBAL WHATSAPP FLOATING ACTION BUTTON */}
        <WhatsAppFAB />
        {pdfUrl && <PDFViewer url={pdfUrl.url} title={pdfUrl.title} onClose={() => setPdfUrl(null)} />}

      </div>
    </CartContext.Provider>
  );
}

// ==================================================
// VIEW COMPONENTS
// ==================================================



// 1. HOME / CORPORATE OVERVIEW
function HomeView({ onExplore, onProductClick, onViewPdf }: { onExplore: () => void; onProductClick: (p: Product) => void; onViewPdf: (pdf: {url: string, title: string}) => void }) {
  const categories = db.getCategories();
  const products = db.getProducts();

  // Get active Featured and Trending products dynamically
  const featuredProducts = products.filter(p => p.featured && p.status === 'active');
  const trendingProducts = products.filter(p => p.trending && p.status === 'active');
  
  return (
    <div className="space-y-12 animate-fade-in">
      {/* HERO HERO HERO */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white p-8 md:p-12 flex flex-col lg:flex-row items-center gap-8 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-green/5 via-transparent to-brand-green/5 pointer-events-none" />
        
        <div className="space-y-6 flex-1 relative z-10">
          <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/20 px-3 py-1 rounded-full text-xs font-bold text-brand-green uppercase tracking-widest">
            <Award className="w-3.5 h-3.5" /> High Precision Industrial Manufacturing
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Seamless global ordering for <span className="bg-gradient-to-r from-brand-green to-emerald-400 bg-clip-text text-transparent">FMCG packaging</span> & export safety match lines.
          </h2>
          
          <p className="text-slate-600 max-w-xl text-sm md:text-base leading-relaxed font-medium">
            Supplying premium Ice Cream Tubs, In-Mold Labeling containers, Double Wall Paper products, Organic Birchwood spoons, and Safety Matches directly to global food processors and bulk distributors.
          </p>

          <div className="flex gap-4 flex-wrap">
            <button 
              onClick={onExplore}
              className="bg-brand-green hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-brand-green/20 transition duration-300 cursor-pointer"
            >
              Browse Bulk Catalog <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              className="bg-white hover:bg-slate-50 border border-slate-200 font-bold px-6 py-3 rounded-lg text-slate-700 text-sm flex items-center justify-center transition shadow-sm gap-2"
              onClick={() => onViewPdf({url: categories[0]?.catalogUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', title: 'Amar Industries Product Catalogue'})}
            >
              <FileText className="w-4 h-4 text-brand-green" /> Download Catalogue
            </button>
          </div>
        </div>

        <div className="flex-1 relative w-full flex justify-center">
          <div className="w-72 h-72 md:w-80 md:h-80 rounded-3xl bg-white border border-slate-200 p-4 shadow-xl relative">
            <div className="absolute inset-0 bg-gradient-to-t from-brand-green/5 to-transparent rounded-3xl pointer-events-none" />
            <img 
              src="https://images.unsplash.com/photo-1549476464-37392f719c28?q=80&w=600" 
              alt="Industrial Production Tub" 
              className="w-full h-full object-cover rounded-2xl opacity-100"
            />
            <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/95 backdrop-blur border border-slate-100 rounded-xl text-xs flex justify-between items-center shadow-md">
              <div>
                <p className="font-bold text-slate-900 leading-tight">IML Round Tub 1L</p>
                <span className="text-[10px] text-brand-green uppercase tracking-widest font-bold font-mono-custom">AMAR-IML-1000</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block font-bold">MOQ: 20k Units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC FEATURED PRODUCTS SHOWCASE */}
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-current animate-pulse" /> Featured B2B Products
            </h3>
            <p className="text-xs text-slate-500 font-medium">Our flagship premium packaging and export lines recommended for maximum brand visibility.</p>
          </div>
          <button onClick={onExplore} className="text-xs text-brand-green font-bold hover:underline">Explore Full Directory &gt;</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 4).map(p => (
            <div 
              key={p.id} 
              onClick={() => onProductClick(p)}
              className="portal-card overflow-hidden cursor-pointer flex flex-col group h-full"
            >
              <div className="h-40 relative overflow-hidden bg-slate-100">
                <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition duration-300" />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-yellow-600 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm border border-yellow-200">
                  <Star className="w-2.5 h-2.5 fill-current" /> Featured
                </span>
                <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-[9px] text-slate-600 px-2 py-0.5 rounded shadow-sm border border-slate-200 font-mono-custom font-bold">
                  {p.sku}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs leading-snug group-hover:text-brand-green transition line-clamp-1">{p.name}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mt-1 font-medium">{p.description}</p>
                </div>
                <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">MOQ: <span className="font-mono-custom font-bold text-slate-900">{p.moq.toLocaleString()}</span></span>
                  <span className="font-bold text-brand-green">View Specs &gt;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DYNAMIC TRENDING PROCUREMENT LINES */}
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 fill-current animate-bounce" /> Trending Procurements
            </h3>
            <p className="text-xs text-slate-500 font-medium">Fast-moving industrial and manufacturing lines experiencing massive seasonal volume demand.</p>
          </div>
          <button onClick={onExplore} className="text-xs text-brand-green font-bold hover:underline">Explore Full Directory &gt;</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingProducts.slice(0, 4).map(p => (
            <div 
              key={p.id} 
              onClick={() => onProductClick(p)}
              className="portal-card overflow-hidden cursor-pointer flex flex-col group h-full"
            >
              <div className="h-40 relative overflow-hidden bg-slate-100">
                <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition duration-300" />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-orange-600 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm border border-orange-200">
                  <Flame className="w-2.5 h-2.5 fill-current" /> High Demand
                </span>
                <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-[9px] text-slate-600 px-2 py-0.5 rounded shadow-sm border border-slate-200 font-mono-custom font-bold">
                  {p.sku}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs leading-snug group-hover:text-brand-green transition line-clamp-1">{p.name}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mt-1 font-medium">{p.description}</p>
                </div>
                <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">MOQ: <span className="font-mono-custom font-bold text-slate-900">{p.moq.toLocaleString()}</span></span>
                  <span className="font-bold text-brand-green">View Specs &gt;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STATS MATRIX */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-brand-green/10 rounded-lg text-brand-green">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-2xl font-bold font-mono-custom text-slate-900 leading-none">50+</h4>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Countries Exported</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-bold font-mono-custom text-slate-900 leading-none">1.2B</h4>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Annual Production</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-bold font-mono-custom text-slate-900 leading-none">₹85.4Cr</h4>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Export Volume</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-bold font-mono-custom text-slate-900 leading-none">100%</h4>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">SLA Compliance</span>
          </div>
        </div>
      </div>

      {/* CATEGORIES PREVIEW SECTION */}
      <div id="about" className="space-y-6">
        <div>
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 uppercase">Primary Manufacturing Ranges</h3>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Select an industrial division to explore engineered dimensions, spec matrices, and MOQ pricing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => (
            <div key={c.id} className="portal-card rounded-xl overflow-hidden cursor-pointer group" onClick={onExplore}>
              <div className="h-44 overflow-hidden relative">
                <img 
                  src={c.imageUrl} 
                  alt={c.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              </div>
              <div className="p-5 space-y-3 bg-white">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 text-base group-hover:text-brand-green transition">{c.name}</h4>
                  <button 
                    className="p-1.5 bg-slate-100 hover:bg-brand-green hover:text-white text-slate-500 rounded-lg transition"
                    onClick={(e) => { e.stopPropagation(); alert(`Downloading brochure for ${c.name}`); }}
                    title="Download Division Brochure"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. PRODUCT CATALOG VIEW
function CatalogView({ onProductClick, onViewPdf }: { onProductClick: (p: Product) => void; onViewPdf: (pdf: {url: string, title: string}) => void }) {
  const products = db.getProducts();
  const categories = db.getCategories();
  
  // Filter and search states
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [moqFilter, setMoqFilter] = useState<'all' | 'under25k' | '25k-100k' | 'over100k'>('all');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'lowstock'>('all');

  // Smart suggestions states
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (search.trim().length >= 2) {
      const matches = products.filter(p => 
        p.status === 'active' && 
        (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [search, products]);

  const handleSelectSuggestion = (name: string) => {
    setSearch(name);
    setShowSuggestions(false);
  };

  const handleReset = () => {
    setSearch('');
    setSelectedCat(null);
    setMoqFilter('all');
    setMaterialFilter('all');
    setStockFilter('all');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const filtered = products.filter(p => {
    // Search match
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    
    // Category match
    const matchesCat = selectedCat ? p.categoryId === selectedCat : true;

    // MOQ Scale filter
    let matchesMoq = true;
    if (moqFilter === 'under25k') matchesMoq = p.moq < 25000;
    else if (moqFilter === '25k-100k') matchesMoq = p.moq >= 25000 && p.moq <= 100000;
    else if (moqFilter === 'over100k') matchesMoq = p.moq > 100000;

    // Material composition filter
    let matchesMaterial = true;
    if (materialFilter !== 'all') {
      matchesMaterial = p.material.toLowerCase().includes(materialFilter.toLowerCase());
    }

    // Stock level filter
    let matchesStock = true;
    if (stockFilter === 'instock') {
      matchesStock = p.stockLevel > p.minStockThreshold;
    } else if (stockFilter === 'lowstock') {
      matchesStock = p.stockLevel <= p.minStockThreshold && p.stockLevel > 0;
    }

    // Active visible products only
    const matchesStatus = p.status === 'active';

    return matchesSearch && matchesCat && matchesMoq && matchesMaterial && matchesStock && matchesStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* FILTER PANEL */}
      <div className="lg:col-span-1 space-y-6 bg-white border border-slate-200 p-6 rounded-xl h-fit shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 font-bold text-sm tracking-wider uppercase text-slate-800">
            <Filter className="w-4 h-4 text-brand-green" /> Filter Directory
          </div>
          {(selectedCat || search || moqFilter !== 'all' || materialFilter !== 'all' || stockFilter !== 'all') && (
            <button 
              onClick={handleReset}
              className="text-[10px] text-brand-green font-bold hover:underline"
            >
              Reset All
            </button>
          )}
        </div>

        {/* SEARCH bar with dynamic suggestions drop down */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search SKU or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => { if (search.trim().length >= 2) setShowSuggestions(true); }}
            className="w-full text-xs py-2.5 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />

          {/* Suggestions absolute dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-slate-100">
              <div className="px-3 py-1 bg-slate-50 text-[9px] text-slate-500 uppercase tracking-widest font-bold">Catalog Suggestions</div>
              {suggestions.map(s => (
                <button 
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(s.name)}
                  className="w-full px-3 py-2 text-left text-[11px] text-slate-700 hover:bg-brand-green/10 hover:text-brand-green font-bold transition flex items-center justify-between"
                >
                  <span className="truncate pr-2">{s.name}</span>
                  <span className="text-[9px] font-mono-custom text-slate-400 flex-shrink-0">{s.sku}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CATEGORY SELECTOR */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Industry Divisions</span>
          <div className="space-y-1.5">
            <button 
              onClick={() => setSelectedCat(null)}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg transition ${!selectedCat ? 'bg-brand-green/10 text-brand-green font-bold' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'}`}
            >
              All Product Divisions
            </button>
            {categories.map(c => (
              <button 
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg transition ${selectedCat === c.id ? 'bg-brand-green/10 text-brand-green font-bold border-l-2 border-brand-green' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* ADVANCED ACCORDION TRIGGER */}
        <div className="border-t border-slate-200 pt-4 space-y-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-[10px] uppercase tracking-wider font-extrabold text-slate-700 rounded-lg flex items-center justify-between border border-slate-200 transition"
          >
            <span>Advanced Filters</span>
            <span>{showAdvanced ? '▼' : '►'}</span>
          </button>

          {showAdvanced && (
            <div className="space-y-4 animate-fade-in text-xs border border-slate-200 p-4 rounded-xl bg-slate-50">
              
              {/* MOQ Scale filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">MOQ Scale Threshold</label>
                <select 
                  value={moqFilter}
                  onChange={(e: any) => setMoqFilter(e.target.value)}
                  className="w-full text-[11px] p-2 rounded bg-white border border-slate-200 text-slate-700 outline-none"
                >
                  <option value="all">All MOQ Volumes</option>
                  <option value="under25k">Below 25,000 units</option>
                  <option value="25k-100k">25,000 - 100,000 units</option>
                  <option value="over100k">Above 100,000 units</option>
                </select>
              </div>

              {/* Material Composition filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Material Base</label>
                <select 
                  value={materialFilter}
                  onChange={(e: any) => setMaterialFilter(e.target.value)}
                  className="w-full text-[11px] p-2 rounded bg-white border border-slate-200 text-slate-700 outline-none"
                >
                  <option value="all">All Materials</option>
                  <option value="pp">Polypropylene (PP)</option>
                  <option value="hdpe">Polyethylene (HDPE)</option>
                  <option value="hips">Polystyrene (HIPS)</option>
                  <option value="kraft">Kraft Paper</option>
                  <option value="birchwood">White Birchwood</option>
                  <option value="wax">Wax match base</option>
                </select>
              </div>

              {/* Inventory availability filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Warehouse Stocks</label>
                <select 
                  value={stockFilter}
                  onChange={(e: any) => setStockFilter(e.target.value)}
                  className="w-full text-[11px] p-2 rounded bg-white border border-slate-200 text-slate-700 outline-none"
                >
                  <option value="all">All Stocks Levels</option>
                  <option value="instock">In-Stock Secure levels</option>
                  <option value="lowstock">Critical low-stock refill tags</option>
                </select>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* PRODUCTS DISPLAY GRID */}
      <div className="lg:col-span-3 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500 font-medium">
            Found <span className="font-bold text-brand-green font-mono-custom">{filtered.length}</span> industrial lines matching criteria.
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500 space-y-4">
            <Box className="w-10 h-10 mx-auto text-slate-400 animate-bounce" />
            <p className="text-sm font-bold">No items found matching the search matrix.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => {
              return (
                <div 
                  key={p.id} 
                  className="portal-card rounded-xl overflow-hidden flex flex-col cursor-pointer bg-white border border-slate-100 shadow-sm hover:shadow-md transition"
                  onClick={() => onProductClick(p)}
                >
                  <div className="h-40 relative bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover opacity-100" />

                    <span className="absolute bottom-3 right-3 bg-white/90 text-slate-600 text-[9px] font-mono-custom px-2 py-0.5 rounded border border-slate-200 font-bold">
                      {p.sku}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-slate-900 text-sm hover:text-brand-green transition leading-tight">{p.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">{p.description}</p>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-slate-100">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-bold">Material Composition</span>
                        <span className="font-bold text-slate-800 text-right max-w-[120px] truncate">{p.material}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-bold">Min Inquiry Threshold</span>
                        <span className="font-bold text-amber-600">{p.moq.toLocaleString()} units</span>
                      </div>

                      <div className="flex justify-between items-end pt-1">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">Supply Status</span>
                          <span className="text-xs font-bold text-brand-green">Available for Inquiry</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onViewPdf({url: p.brochureUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', title: `${p.name} Specs`}); }}
                          className="text-xs text-brand-green font-bold flex items-center gap-1 hover:underline"
                        >
                          View Specs <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// 3. DETAILED PRODUCT VIEW WITH MOQ PRICE CALCULATOR
function ProductDetailView({ 
  product, 
  onBack, 
  onAddToCart,
  onViewPdf
}: { 
  product: Product; 
  onBack: () => void; 
  onAddToCart: (p: Product, q: number) => void;
  onViewPdf: (pdf: {url: string, title: string}) => void;
}) {
  const [quantity, setQuantity] = useState(product.moq);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleQuantityInput = (val: string) => {
    const num = parseInt(val.replace(/,/g, ''));
    if (!isNaN(num)) {
      setQuantity(num);
      if (num < product.moq) {
        setAlertMsg(`Requested count is below strict factory MOQ threshold (${product.moq.toLocaleString()}).`);
      } else {
        setAlertMsg(null);
      }
    } else {
      setQuantity(0);
    }
  };

  const handleAddSubmit = () => {
    if (quantity < product.moq) {
      setAlertMsg(`You cannot add to cart. Factory processing mandates a minimum order of ${product.moq.toLocaleString()} units.`);
      return;
    }
    onAddToCart(product, quantity);
    onBack();
  };

  return (
    <div className="space-y-6 animate-fade-in bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-md">
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs text-brand-green font-bold hover:underline mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SPEC SHEET IMAGE */}
        <div className="lg:col-span-5 space-y-4">
          <div className="h-64 md:h-80 w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden relative">
            <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover opacity-100" />
            <div className="absolute top-4 right-4 bg-white/90 text-[10px] text-slate-700 px-3 py-1 rounded border border-slate-200 font-bold font-mono-custom shadow-sm">
              SKU: {product.sku}
            </div>
          </div>
          
          {/* Engineering Dimensions Table */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h5 className="font-bold text-xs uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-brand-green" /> Engineering Specifications
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Material Composition</span>
                <span className="font-bold text-slate-900">{product.material}</span>
              </div>
              {Object.entries(product.dimensions).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1.5 border-b border-slate-200 capitalize">
                  <span className="text-slate-500 font-bold">{key.replace('_', ' ')}</span>
                  <span className="font-bold text-slate-900">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WORKFLOW ORDER BUILDER */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">{product.name}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">{product.description}</p>
          </div>



          {/* CALCULATOR PANEL */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="w-full space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Configure Inquiry Quantity</label>
                <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-1 w-full max-w-[280px]">
                  <button 
                    onClick={() => {
                      const newQty = Math.max(product.moq, quantity - 5000);
                      setQuantity(newQty);
                      setAlertMsg(null);
                    }}
                    className="p-2 bg-white hover:bg-slate-50 text-slate-600 rounded border border-slate-200 transition shadow-sm"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input 
                    type="text" 
                    value={quantity.toLocaleString()}
                    onChange={(e) => handleQuantityInput(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-center font-bold font-mono-custom text-sm text-slate-900 focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      setQuantity(prev => prev + 5000);
                      setAlertMsg(null);
                    }}
                    className="p-2 bg-white hover:bg-slate-50 text-slate-600 rounded border border-slate-200 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="w-full text-center md:text-right space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Order Scaling Status</span>
                <span className="text-lg font-bold text-brand-green">Custom B2B Contract</span>
                <span className="text-[10px] text-slate-500 block font-medium">Pricing generated dynamically upon dispatch</span>
              </div>
            </div>

            {/* Error prompt */}
            {alertMsg && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-3 text-xs text-amber-600 animate-shake font-bold">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p>{alertMsg}</p>
              </div>
            )}

            {/* ACTION TRIGGERS */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-slate-200">
              <button 
                onClick={handleAddSubmit}
                disabled={quantity < product.moq}
                className={`flex-1 py-3 px-6 rounded-lg font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition duration-300 ${quantity < product.moq ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-brand-green hover:bg-emerald-600 text-white shadow-brand-green/20'}`}
              >
                <ShoppingCart className="w-4 h-4" /> Add to Request Cart
              </button>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => onViewPdf({url: product.brochureUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', title: `${product.name} Brochure`})}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm border border-slate-200 transition flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-brand-green" /> View Brochure
                </button>
                <button 
                  onClick={() => window.open(generateWhatsAppLink('919876543210', getProductInquiryMessage(product.name, product.sku, quantity)), '_blank')}
                  className="px-4 py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 rounded-lg font-bold text-sm transition flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Quick Inquiry
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// 4. CART & RFQ INQUIRY PROCESS VIEW
function CartView({ onInquirySuccess }: { onInquirySuccess: () => void }) {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const [formData, setFormData] = useState({
    fullName: SAMPLE_CUSTOMER.fullName,
    phone: SAMPLE_CUSTOMER.phoneNumber || '',
    email: SAMPLE_CUSTOMER.email,
    company: SAMPLE_CUSTOMER.companyName || '',
    gstNumber: SAMPLE_CUSTOMER.gstNumber || '',
    address: SAMPLE_CUSTOMER.shippingAddress || '',
    city: 'Moga, Punjab',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<string | null>(null);

  // Validate if all items meet strict MOQ limits
  const hasMoqBreach = cart.some(item => item.quantity < item.product.moq);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (hasMoqBreach) {
      setFormErrors("Inquiry rejected. One or more items are below factory minimum order quantity limits.");
      return;
    }

    if (!formData.company || !formData.address) {
      setFormErrors("Essential commercial data missing. Company Name and Delivery address are required.");
      return;
    }

    // Submit Order inquiry into db
    db.createOrder({
      customerId: SAMPLE_CUSTOMER.id,
      customerName: formData.fullName,
      customerCompany: formData.company,
      totalAmount: cartTotal,
      shippingDetails: {
        fullName: formData.fullName,
        address: formData.address,
        city: formData.city,
        phone: formData.phone,
        email: formData.email
      },
      gstNumber: formData.gstNumber,
      notes: formData.notes,
      items: cart.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        orderId: '', // assigned inside database client
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.selectedPrice
      }))
    });

    // Trigger premium confetti celebration splash
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });

    clearCart();
    onInquirySuccess();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* CART DRAFT ITEMS (LEFT) */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-wider">Request Drafting Cart</h3>
          <p className="text-xs text-slate-500 font-medium">Review your commercial packaging inquiry draft before dispatching to sales desk.</p>
        </div>

        {cart.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500 space-y-4">
            <ShoppingCart className="w-12 h-12 mx-auto text-slate-400" />
            <p className="text-sm font-bold">Inquiry cart is currently empty.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item, idx) => {
              const isBreaching = item.quantity < item.product.moq;
              
              return (
                <div key={idx} className="portal-card rounded-xl p-4 flex gap-4 bg-white border border-slate-100 shadow-sm">
                  <img src={item.product.imageUrls[0]} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg bg-slate-100 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm truncate leading-tight">{item.product.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono-custom font-bold">{item.product.sku}</span>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-xs text-slate-500 hover:text-red-500 font-bold"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex flex-wrap justify-between items-end gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-bold">Inquiry Units:</span>
                        <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                          <button 
                            onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 5000))}
                            className="p-1 bg-white text-slate-600 hover:text-slate-900 rounded transition shadow-sm"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input 
                            type="text" 
                            value={item.quantity}
                            onChange={(e) => {
                              const v = parseInt(e.target.value) || 0;
                              updateQuantity(item.product.id, v);
                            }}
                            className="w-16 bg-transparent text-center font-bold text-xs text-slate-900 focus:outline-none font-mono-custom"
                          />
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 5000)}
                            className="p-1 bg-white text-slate-600 hover:text-slate-900 rounded transition shadow-sm"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-brand-green">Quote Pending</span>
                        <span className="text-[10px] text-slate-500 block font-mono-custom font-bold">{item.quantity.toLocaleString()} units requested</span>
                      </div>
                    </div>

                    {isBreaching && (
                      <div className="mt-3 bg-red-50 border border-red-200 p-2.5 rounded flex items-center gap-2 text-[10px] text-red-600 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>SLA Warning: Quantity below MOQ threshold ({item.product.moq.toLocaleString()}). Submit is blocked.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Total count block */}
            <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl flex justify-between items-center text-xs">
              <span className="text-slate-500 uppercase tracking-widest font-bold">Draft Status</span>
              <span className="text-xs font-bold text-brand-green">Ready for Quotation Review</span>
            </div>
          </div>
        )}
      </div>

      {/* CHECKOUT COMMERCIALS DETAILS (RIGHT) */}
      <div className="lg:col-span-5">
        <form onSubmit={handleCheckout} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-5 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-green" /> Commercial Logistics Sheet
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">Provide verified industrial billing details for contract generation.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Contact Full Name</label>
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Contact Phone</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Contact Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Company Name (FMCG / Retail)</label>
              <input 
                type="text" 
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">GSTIN Registration Number (Optional)</label>
              <input 
                type="text" 
                value={formData.gstNumber}
                onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                placeholder="e.g. 07AAACN0279L1Z5"
                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition font-mono-custom"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Warehouse Shipping Address</label>
              <textarea 
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Special Manufacturing Instructions (Optional)</label>
              <textarea 
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="e.g., custom branding colors, double shrink wrapping requirements..."
                className="w-full text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition"
              />
            </div>
          </div>

          {formErrors && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-3 text-xs text-red-600 font-bold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <p>{formErrors}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={cart.length === 0 || hasMoqBreach}
            className={`w-full py-3.5 rounded-xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 uppercase tracking-wider transition duration-300 ${cart.length === 0 || hasMoqBreach ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-brand-green hover:bg-emerald-600 text-white shadow-brand-green/20'}`}
          >
            <FileCheck className="w-4 h-4" /> Request Order Inquiry
          </button>
          
          <div className="text-center">
            <span className="text-[9px] text-slate-500 leading-normal block max-w-[280px] mx-auto font-medium">
              Submission triggers a formal RFP record. No immediate payment takes place. Terms verified within 24 hours.
            </span>
          </div>
        </form>
      </div>

    </div>
  );
}

// 5. CLIENT MY INQUIRIES & SLA WORKFLOW VIEW
function InquiriesView({ orders, currentUser }: { orders: Order[]; currentUser: SystemUser }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter orders matching Nestle Customer
  const myOrders = orders.filter(o => o.customerId === SAMPLE_CUSTOMER.id);

  const getStatusColor = (s: OrderStatus) => {
    switch (s) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'under_review': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'approved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'dispatched': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'escalated': return 'bg-red-500/30 text-red-400 border-red-500/50 animate-pulse';
    }
  };

  const getStepActiveIndex = (s: OrderStatus) => {
    switch (s) {
      case 'pending': return 1;
      case 'under_review': return 2;
      case 'approved': return 3;
      case 'processing': return 4;
      case 'dispatched': return 5;
      case 'delivered': return 6;
      case 'escalated': return 2; // escalated halts at review phase
      default: return 1;
    }
  };

  const steps = [
    { title: 'Submitted', desc: 'Inquiry Drafted' },
    { title: 'Under Review', desc: 'SLA Desk Check' },
    { title: 'Approved', desc: 'Contract Cleared' },
    { title: 'Manufacturing', desc: 'Active Queue Run' },
    { title: 'Dispatched', desc: 'Transit Hub Lock' },
    { title: 'Delivered', desc: 'Logistics Handover' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div>
        <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-wider">Inquiries & SLA Tracking</h3>
        <p className="text-xs text-slate-500 font-medium">Track industrial inquiries, SLA compliance, and reviewer logs in real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INQUIRY SELECTION MATRIX (LEFT) */}
        <div className="lg:col-span-5 space-y-4">
          {myOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 text-center text-slate-500">
              <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold">No active contract inquiries found.</p>
            </div>
          ) : (
            myOrders.map(order => (
              <div 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 rounded-xl border cursor-pointer transition flex justify-between items-center ${selectedOrder?.id === order.id ? 'bg-brand-green/10 border-brand-green/40 shadow-md' : 'bg-slate-50 border-slate-200 hover:border-brand-green hover:bg-white hover:shadow-sm'}`}
              >
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-900 font-mono-custom leading-none">{order.id}</h4>
                  <span className="text-[10px] text-slate-500 font-mono-custom block font-medium">Inquiry Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="text-[10px] text-brand-green block font-bold">Quote Requested</span>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* TIMELINE REVIEW DETAILS (RIGHT) */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
              
              {/* Header overview */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900 font-mono-custom leading-tight">{selectedOrder.id}</h4>
                  <span className="text-xs text-slate-500 font-medium">Logistics Destination: {selectedOrder.shippingDetails.address}, {selectedOrder.shippingDetails.city}</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded border ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </div>

              {/* TIMELINE TIMELINE TIMELINE */}
              {selectedOrder.status !== 'rejected' && (
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest block">SLA Logistics Progress Tracker</span>
                  <div className="relative flex justify-between items-start pt-2">
                    {/* Line behind steps */}
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 z-0" />
                    
                    {steps.map((st, idx) => {
                      const activeIndex = getStepActiveIndex(selectedOrder.status);
                      const isCompleted = idx + 1 < activeIndex;
                      const isActive = idx + 1 === activeIndex;

                      return (
                        <div key={idx} className="relative z-10 flex flex-col items-center text-center max-w-[70px] space-y-1.5">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition duration-300 ${isCompleted ? 'bg-brand-green border-brand-green text-white' : isActive ? 'bg-amber-500 border-amber-600 text-white scale-110 shadow-lg shadow-amber-500/20' : 'bg-white border-slate-300 text-slate-400'}`}>
                            {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : idx + 1}
                          </div>
                          <div className="space-y-0.5">
                            <p className={`text-[9px] font-bold ${isActive ? 'text-amber-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{st.title}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items Inquiry breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Inquiry Products Spec List</span>
                <div className="space-y-1.5">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-2 px-3 bg-slate-50 rounded border border-slate-200">
                      <div>
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        <span className="text-[10px] text-slate-500 font-mono-custom font-bold">{item.productSku} × {item.quantity.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">Standard Pack</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviewer Remarks system */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Workflow Remarks Audit Ledger</span>
                
                {selectedOrder.remarks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2 font-medium">No verification comments recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedOrder.remarks.map((rem, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{rem.authorName} <span className="text-[10px] text-slate-500 uppercase font-bold font-sans">({rem.authorRole})</span></span>
                          <span className="text-[9px] text-slate-500 font-mono-custom font-bold">{new Date(rem.createdAt).toLocaleDateString()} {new Date(rem.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-medium">{rem.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-500 space-y-4">
              <FileText className="w-12 h-12 mx-auto text-slate-400" />
              <p className="text-sm font-bold">Select an inquiry to view timeline updates, pricing compliance, and operational verification logs.</p>
            </div>
          )}
        </div>

      </div>

      <EmailPreferences currentUser={currentUser} />
    </div>
  );
}

// ==================================================
// DEMO ACCOUNTS STATIC METADATA
// ==================================================

const SAMPLE_CUSTOMER: SystemUser = {
  id: 'usr-customer-1',
  email: 'buyer@nestle.com',
  role: 'customer',
  fullName: 'David Thorne (Nestle Global Procurement)',
  phoneNumber: '+91 98765 43210',
  companyName: 'Nestlé India Private Limited',
  gstNumber: '07AAACN0279L1Z5',
  shippingAddress: 'Plot No. 2, Industrial Focal Point, Moga, Punjab, 142001',
  createdAt: '2026-01-01T00:00:00Z'
};

const SAMPLE_SUPERVISOR: SystemUser = {
  id: 'usr-supervisor-1',
  email: 'supervisor@amarsplints.com',
  role: 'supervisor',
  fullName: 'Rahul Sharma (Operations Lead)',
  createdAt: '2026-01-01T00:00:00Z'
};

const SAMPLE_ADMIN: SystemUser = {
  id: 'usr-admin-1',
  email: 'admin@amarsplints.com',
  role: 'admin',
  fullName: 'Amarjit Singh (Managing Director)',
  createdAt: '2026-01-01T00:00:00Z'
};
