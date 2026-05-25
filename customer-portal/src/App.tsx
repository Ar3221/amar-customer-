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
      <div className="min-h-screen bg-grid-glow bg-slate-900 text-slate-100 flex flex-col">
        
        {/* TOP STATUS BAR & SWITCHER */}
        <div className="bg-slate-950 border-b border-slate-800 py-1.5 px-4 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-sky-400 animate-spin-slow" />
            <span>Amar Splints Private Limited — Global Industrial Portal v2026.5</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-slate-500">Demo Role Quick Switcher:</span>
            <div className="flex bg-slate-900 rounded border border-slate-800 p-0.5">
              <button 
                onClick={() => handleRoleChange('customer')}
                className={`px-2 py-0.5 rounded transition ${currentUser.role === 'customer' ? 'bg-sky-500/20 text-sky-400 font-medium' : 'hover:text-slate-200'}`}
              >
                Customer
              </button>
              <button 
                onClick={() => handleRoleChange('supervisor')}
                className={`px-2 py-0.5 rounded transition ${currentUser.role === 'supervisor' ? 'bg-emerald-500/20 text-emerald-400 font-medium' : 'hover:text-slate-200'}`}
              >
                Supervisor
              </button>
              <button 
                onClick={() => handleRoleChange('admin')}
                className={`px-2 py-0.5 rounded transition ${currentUser.role === 'admin' ? 'bg-amber-500/20 text-amber-400 font-medium' : 'hover:text-slate-200'}`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        {/* MAIN NAVIGATION HEADER */}
        <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('home'); setSelectedProduct(null); }}>
            <div className="bg-gradient-to-tr from-sky-500 to-sky-400 p-2 rounded-lg text-slate-950 font-bold shadow-lg shadow-sky-500/10">
              AM
            </div>
            <div>
              <h1 className="font-extrabold tracking-tight text-lg leading-none bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                AMAR INDUSTRIES
              </h1>
              <span className="text-[10px] tracking-widest text-sky-400 uppercase font-semibold">
                Amar Splints Pvt. Ltd.
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button 
              onClick={() => { setActiveTab('home'); setSelectedProduct(null); }}
              className={`transition ${activeTab === 'home' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Enterprise Overview
            </button>
            <button 
              onClick={() => { setActiveTab('catalog'); setSelectedProduct(null); }}
              className={`transition ${activeTab === 'catalog' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Industrial Catalog
            </button>
            <button 
              onClick={() => { setActiveTab('inquiries'); setSelectedProduct(null); }}
              className={`transition ${activeTab === 'inquiries' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              My Inquiries & SLA Tracks
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
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 transition"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 shadow-2xl rounded-xl p-4 z-50">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-2">
                    <span className="font-semibold text-xs text-sky-400 uppercase tracking-wider">System Broadcasts</span>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] text-slate-500 hover:text-slate-300">Close</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No recent messages.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-2 bg-slate-950 rounded border border-slate-800/80 text-xs">
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="font-medium text-slate-300">{n.title}</span>
                            <span className="text-[9px] text-slate-600">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-slate-400 leading-normal">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Icon */}
            <button 
              onClick={() => { setActiveTab('cart'); setSelectedProduct(null); }}
              className="relative flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-4 py-2 rounded-lg font-medium text-sm transition"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {cart.length > 0 && (
                <span className="bg-sky-500 text-slate-950 text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                  {cart.length}
                </span>
              )}
            </button>

            {/* User Logged in Badge */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left text-xs">
                <p className="font-medium text-slate-300 leading-none">{currentUser.fullName.split(' ')[0]}</p>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">{currentUser.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY LAYOUT */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          {selectedProduct ? (
            <ProductDetailView 
              product={selectedProduct} 
              onBack={() => setSelectedProduct(null)} 
              onAddToCart={addToCart}
            />
          ) : (
            <>
              {activeTab === 'home' && <HomeView onExplore={() => setActiveTab('catalog')} onProductClick={setSelectedProduct} />}
              {activeTab === 'catalog' && <CatalogView onProductClick={setSelectedProduct} />}
              {activeTab === 'cart' && <CartView onInquirySuccess={() => { setActiveTab('inquiries'); refreshState(); }} />}
              {activeTab === 'inquiries' && <InquiriesView orders={orders} currentUser={currentUser} />}
            </>
          )}
        </main>

        {/* SYSTEM FOOTER */}
        <footer className="bg-slate-950 border-t border-slate-850 py-10 px-6 mt-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 p-2 rounded-lg text-slate-400 font-bold border border-slate-700">
                AM
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-300 uppercase tracking-wider">
                  AMAR INDUSTRIES / AMAR SPLINTS PVT. LTD.
                </p>
                <p className="text-xs text-slate-500">
                  Global Manufacturing Hub of FMCG Tubs, IML Packaging, Birchwood Sticks, & Match Exports.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-8 text-xs text-slate-500 font-medium">
              <a href="#" className="hover:text-sky-400">Specifications Compliance</a>
              <a href="#" className="hover:text-sky-400">Export Regulations</a>
              <a href="#" className="hover:text-sky-400">ISO 9001 Compliance</a>
              <a href="#" className="hover:text-sky-400">Contact Corporate</a>
            </div>

            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} Amar Splints Pvt. Ltd. All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </CartContext.Provider>
  );
}

// ==================================================
// VIEW COMPONENTS
// ==================================================



// 1. HOME / CORPORATE OVERVIEW
function HomeView({ onExplore, onProductClick }: { onExplore: () => void; onProductClick: (p: Product) => void }) {
  const categories = db.getCategories();
  const products = db.getProducts();

  // Get active Featured and Trending products dynamically
  const featuredProducts = products.filter(p => p.featured && p.status === 'active');
  const trendingProducts = products.filter(p => p.trending && p.status === 'active');
  
  return (
    <div className="space-y-12 animate-fade-in">
      {/* HERO HERO HERO */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/80 p-8 md:p-12 flex flex-col lg:flex-row items-center gap-8">
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <div className="space-y-6 flex-1">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full text-xs font-semibold text-sky-400 uppercase tracking-widest">
            <Award className="w-3.5 h-3.5" /> High Precision Industrial Manufacturing
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Seamless global ordering for <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">FMCG packaging</span> & export safety match lines.
          </h2>
          
          <p className="text-slate-400 max-w-xl text-sm md:text-base leading-relaxed">
            Supplying premium Ice Cream Tubs, In-Mold Labeling containers, Double Wall Paper products, Organic Birchwood spoons, and Safety Matches directly to global food processors and bulk distributors in 2026.
          </p>

          <div className="flex gap-4">
            <button 
              onClick={onExplore}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-sky-500/15 transition duration-300 cursor-pointer"
            >
              Browse Bulk Catalog <ChevronRight className="w-4 h-4" />
            </button>
            <a 
              href="#about" 
              className="bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 font-bold px-6 py-3 rounded-lg text-slate-300 text-sm flex items-center justify-center transition"
            >
              Technical Standards
            </a>
          </div>
        </div>

        <div className="flex-1 relative w-full flex justify-center">
          <div className="w-72 h-72 md:w-80 md:h-80 rounded-3xl bg-slate-900 border border-slate-800 p-4 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-t from-sky-500/10 to-transparent rounded-3xl pointer-events-none" />
            <img 
              src="https://images.unsplash.com/photo-1549476464-37392f719c28?q=80&w=600" 
              alt="Industrial Production Tub" 
              className="w-full h-full object-cover rounded-2xl opacity-90"
            />
            <div className="absolute bottom-6 left-6 right-6 p-4 bg-slate-950/85 backdrop-blur border border-slate-850 rounded-xl text-xs flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-300 leading-tight">IML Round Tub 1L</p>
                <span className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold font-mono-custom">AMAR-IML-1000</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-300 block font-semibold">MOQ: 20k Units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC FEATURED PRODUCTS SHOWCASE */}
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-white uppercase flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current animate-pulse" /> Featured B2B Products
            </h3>
            <p className="text-xs text-slate-400">Our flagship premium packaging and export lines recommended for maximum brand visibility.</p>
          </div>
          <button onClick={onExplore} className="text-xs text-sky-400 font-bold hover:underline">Explore Full Directory &gt;</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 4).map(p => (
            <div 
              key={p.id} 
              onClick={() => onProductClick(p)}
              className="portal-card rounded-xl overflow-hidden cursor-pointer flex flex-col group h-full bg-slate-900/40"
            >
              <div className="h-40 relative overflow-hidden bg-slate-950">
                <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition duration-300" />
                <span className="absolute top-3 left-3 bg-yellow-400/90 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-md">
                  <Star className="w-2.5 h-2.5 fill-current" /> Featured
                </span>
                <span className="absolute bottom-3 right-3 bg-slate-950/80 text-[9px] text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono-custom">
                  {p.sku}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-extrabold text-white text-xs leading-snug group-hover:text-sky-400 transition line-clamp-1">{p.name}</h4>
                  <p className="text-[10px] text-slate-450 line-clamp-2 leading-relaxed mt-1">{p.description}</p>
                </div>
                <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-850">
                  <span className="text-slate-500">MOQ: <span className="font-mono-custom font-bold text-slate-300">{p.moq.toLocaleString()}</span></span>
                  <span className="font-bold text-sky-400">View Specs &gt;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DYNAMIC TRENDING PROCUREMENT LINES */}
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-white uppercase flex items-center gap-2">
              <Flame className="w-5 h-5 text-brand-orange fill-current animate-bounce" /> Trending Procurements
            </h3>
            <p className="text-xs text-slate-400">Fast-moving industrial and manufacturing lines experiencing massive seasonal volume demand.</p>
          </div>
          <button onClick={onExplore} className="text-xs text-sky-400 font-bold hover:underline">Explore Full Directory &gt;</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingProducts.slice(0, 4).map(p => (
            <div 
              key={p.id} 
              onClick={() => onProductClick(p)}
              className="portal-card rounded-xl overflow-hidden cursor-pointer flex flex-col group h-full bg-slate-900/40"
            >
              <div className="h-40 relative overflow-hidden bg-slate-950">
                <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition duration-300" />
                <span className="absolute top-3 left-3 bg-brand-orange/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-md">
                  <Flame className="w-2.5 h-2.5 fill-current" /> High Demand
                </span>
                <span className="absolute bottom-3 right-3 bg-slate-950/80 text-[9px] text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono-custom">
                  {p.sku}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-extrabold text-white text-xs leading-snug group-hover:text-sky-400 transition line-clamp-1">{p.name}</h4>
                  <p className="text-[10px] text-slate-450 line-clamp-2 leading-relaxed mt-1">{p.description}</p>
                </div>
                <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-850">
                  <span className="text-slate-500">MOQ: <span className="font-mono-custom font-bold text-slate-300">{p.moq.toLocaleString()}</span></span>
                  <span className="font-bold text-sky-400">View Specs &gt;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STATS MATRIX */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 rounded-lg text-sky-400">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-2xl font-bold font-mono-custom text-white leading-none">50+</h4>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Countries Exported</span>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-bold font-mono-custom text-white leading-none">1.2B</h4>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Annual Production</span>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-bold font-mono-custom text-white leading-none">₹85.4Cr</h4>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Export Volume</span>
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-bold font-mono-custom text-white leading-none">100%</h4>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">SLA Compliance</span>
          </div>
        </div>
      </div>

      {/* CATEGORIES PREVIEW SECTION */}
      <div id="about" className="space-y-6">
        <div>
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white uppercase">Primary Manufacturing Ranges</h3>
          <p className="text-xs md:text-sm text-slate-400">Select an industrial division to explore engineered dimensions, spec matrices, and MOQ pricing.</p>
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
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
              </div>
              <div className="p-5 space-y-2">
                <h4 className="font-bold text-white text-base group-hover:text-sky-400 transition">{c.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. PRODUCT CATALOG VIEW
function CatalogView({ onProductClick }: { onProductClick: (p: Product) => void }) {
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
      <div className="lg:col-span-1 space-y-6 bg-slate-900/50 border border-slate-850 p-6 rounded-xl h-fit">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-sm tracking-wider uppercase text-slate-300">
            <Filter className="w-4 h-4 text-sky-400" /> Filter Directory
          </div>
          {(selectedCat || search || moqFilter !== 'all' || materialFilter !== 'all' || stockFilter !== 'all') && (
            <button 
              onClick={handleReset}
              className="text-[10px] text-sky-400 font-bold hover:underline"
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
            className="w-full text-xs py-2.5 pl-9 pr-4 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />

          {/* Suggestions absolute dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-slate-900">
              <div className="px-3 py-1 bg-slate-900 text-[9px] text-slate-500 uppercase tracking-widest font-bold">Catalog Suggestions</div>
              {suggestions.map(s => (
                <button 
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(s.name)}
                  className="w-full px-3 py-2 text-left text-[11px] text-slate-300 hover:bg-sky-500/10 hover:text-sky-400 transition flex items-center justify-between"
                >
                  <span className="truncate pr-2">{s.name}</span>
                  <span className="text-[9px] font-mono-custom text-slate-500 flex-shrink-0">{s.sku}</span>
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
              className={`w-full text-left text-xs px-3 py-2 rounded-lg transition ${!selectedCat ? 'bg-sky-500/10 text-sky-400 font-semibold' : 'hover:bg-slate-850/50 text-slate-400 hover:text-slate-200'}`}
            >
              All Product Divisions
            </button>
            {categories.map(c => (
              <button 
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg transition ${selectedCat === c.id ? 'bg-sky-500/10 text-sky-400 font-semibold border-l-2 border-sky-400' : 'hover:bg-slate-850/50 text-slate-400 hover:text-slate-200'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* ADVANCED ACCORDION TRIGGER */}
        <div className="border-t border-slate-850 pt-4 space-y-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-1.5 px-3 bg-slate-850 hover:bg-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-350 rounded-lg flex items-center justify-between border border-slate-800 transition"
          >
            <span>Advanced Filters</span>
            <span>{showAdvanced ? '▼' : '►'}</span>
          </button>

          {showAdvanced && (
            <div className="space-y-4 animate-fade-in text-xs border border-slate-850 p-4 rounded-xl bg-slate-950/40">
              
              {/* MOQ Scale filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">MOQ Scale Threshold</label>
                <select 
                  value={moqFilter}
                  onChange={(e: any) => setMoqFilter(e.target.value)}
                  className="w-full text-[11px] p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 outline-none"
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
                  className="w-full text-[11px] p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 outline-none"
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
                  className="w-full text-[11px] p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 outline-none"
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
          <p className="text-xs text-slate-400 font-medium">
            Found <span className="font-bold text-sky-400 font-mono-custom">{filtered.length}</span> industrial lines matching criteria.
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500 space-y-4">
            <Box className="w-10 h-10 mx-auto text-slate-700 animate-bounce" />
            <p className="text-sm">No items found matching the search matrix.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => {
              return (
                <div 
                  key={p.id} 
                  className="portal-card rounded-xl overflow-hidden flex flex-col cursor-pointer"
                  onClick={() => onProductClick(p)}
                >
                  <div className="h-40 relative bg-slate-950 flex items-center justify-center overflow-hidden">
                    <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover opacity-80" />

                    <span className="absolute bottom-3 right-3 bg-slate-900/90 text-slate-400 text-[9px] font-mono-custom px-2 py-0.5 rounded border border-slate-850">
                      {p.sku}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-slate-900/40">
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-white text-sm hover:text-sky-400 transition leading-tight">{p.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-slate-850">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Material Composition</span>
                        <span className="font-semibold text-slate-300 text-right max-w-[120px] truncate">{p.material}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Min Inquiry Threshold</span>
                        <span className="font-bold text-amber-500">{p.moq.toLocaleString()} units</span>
                      </div>

                      <div className="flex justify-between items-end pt-1">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold">Supply Status</span>
                          <span className="text-xs font-bold text-sky-400">Available for Inquiry</span>
                        </div>
                        <button className="text-xs text-sky-400 font-bold flex items-center gap-1 hover:underline">
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
  onAddToCart 
}: { 
  product: Product; 
  onBack: () => void; 
  onAddToCart: (p: Product, q: number) => void;
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
    <div className="space-y-6 animate-fade-in bg-slate-950/60 p-6 md:p-8 rounded-2xl border border-slate-850">
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs text-sky-400 font-bold hover:underline mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SPEC SHEET IMAGE */}
        <div className="lg:col-span-5 space-y-4">
          <div className="h-64 md:h-80 w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative">
            <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover opacity-90" />
            <div className="absolute top-4 right-4 bg-slate-950/90 text-[10px] text-slate-400 px-3 py-1 rounded border border-slate-850 font-semibold font-mono-custom">
              SKU: {product.sku}
            </div>
          </div>
          
          {/* Engineering Dimensions Table */}
          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 space-y-3">
            <h5 className="font-bold text-xs uppercase text-slate-300 tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-sky-400" /> Engineering Specifications
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-500">Material Composition</span>
                <span className="font-medium text-slate-200">{product.material}</span>
              </div>
              {Object.entries(product.dimensions).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1.5 border-b border-slate-800 capitalize">
                  <span className="text-slate-500">{key.replace('_', ' ')}</span>
                  <span className="font-medium text-slate-200">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WORKFLOW ORDER BUILDER */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-white leading-tight">{product.name}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{product.description}</p>
          </div>



          {/* CALCULATOR PANEL */}
          <div className="bg-slate-900/80 border border-slate-850 p-6 rounded-xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="w-full space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Configure Inquiry Quantity</label>
                <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1 w-full max-w-[280px]">
                  <button 
                    onClick={() => {
                      const newQty = Math.max(product.moq, quantity - 5000);
                      setQuantity(newQty);
                      setAlertMsg(null);
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded border border-slate-800 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input 
                    type="text" 
                    value={quantity.toLocaleString()}
                    onChange={(e) => handleQuantityInput(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-center font-bold font-mono-custom text-sm text-white focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      setQuantity(prev => prev + 5000);
                      setAlertMsg(null);
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded border border-slate-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="w-full text-center md:text-right space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Order Scaling Status</span>
                <span className="text-lg font-bold text-sky-400">Custom B2B Contract</span>
                <span className="text-[10px] text-slate-400 block">Pricing generated dynamically upon dispatch</span>
              </div>
            </div>

            {/* Error prompt */}
            {alertMsg && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-3 text-xs text-amber-400 animate-shake">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p>{alertMsg}</p>
              </div>
            )}

            {/* ACTION TRIGGERS */}
            <div className="flex gap-4 pt-2 border-t border-slate-800">
              <button 
                onClick={handleAddSubmit}
                disabled={quantity < product.moq}
                className={`flex-1 py-3 px-6 rounded-lg font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition duration-300 ${quantity < product.moq ? 'bg-slate-800 text-slate-600 border border-slate-850 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/10'}`}
              >
                <ShoppingCart className="w-4 h-4" /> Add to Request drafting Cart
              </button>
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
          <h3 className="text-xl font-extrabold text-white uppercase tracking-wider">Request Drafting Cart</h3>
          <p className="text-xs text-slate-400">Review your commercial packaging inquiry draft before dispatching to sales desk.</p>
        </div>

        {cart.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500 space-y-4">
            <ShoppingCart className="w-12 h-12 mx-auto text-slate-700" />
            <p className="text-sm">Inquiry cart is currently empty.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item, idx) => {
              const isBreaching = item.quantity < item.product.moq;
              
              return (
                <div key={idx} className="portal-card rounded-xl p-4 flex gap-4 bg-slate-900/30">
                  <img src={item.product.imageUrls[0]} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg bg-slate-950 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm truncate leading-tight">{item.product.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono-custom">{item.product.sku}</span>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-xs text-slate-500 hover:text-red-400 font-bold"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex flex-wrap justify-between items-end gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">Inquiry Units:</span>
                        <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                          <button 
                            onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 5000))}
                            className="p-1 bg-slate-900 text-slate-400 hover:text-slate-200 rounded transition"
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
                            className="w-16 bg-transparent text-center font-bold text-xs focus:outline-none font-mono-custom"
                          />
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 5000)}
                            className="p-1 bg-slate-900 text-slate-400 hover:text-slate-200 rounded transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-sky-400">Quote Pending</span>
                        <span className="text-[10px] text-slate-500 block font-mono-custom">{item.quantity.toLocaleString()} units requested</span>
                      </div>
                    </div>

                    {isBreaching && (
                      <div className="mt-3 bg-red-500/10 border border-red-500/20 p-2.5 rounded flex items-center gap-2 text-[10px] text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>SLA Warning: Quantity below MOQ threshold ({item.product.moq.toLocaleString()}). Submit is blocked.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Total count block */}
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
              <span className="text-slate-500 uppercase tracking-widest font-semibold">Draft Status</span>
              <span className="text-xs font-bold text-sky-400">Ready for Quotation Review</span>
            </div>
          </div>
        )}
      </div>

      {/* CHECKOUT COMMERCIALS DETAILS (RIGHT) */}
      <div className="lg:col-span-5">
        <form onSubmit={handleCheckout} className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sky-400" /> Commercial Logistics Sheet
            </h4>
            <p className="text-[10px] text-slate-500">Provide verified industrial billing details for contract generation.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Contact Full Name</label>
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Contact Phone</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Contact Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Company Name (FMCG / Retail)</label>
              <input 
                type="text" 
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">GSTIN Registration Number (Optional)</label>
              <input 
                type="text" 
                value={formData.gstNumber}
                onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                placeholder="e.g. 07AAACN0279L1Z5"
                className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition font-mono-custom"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Warehouse Shipping Address</label>
              <textarea 
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Special Manufacturing Instructions (Optional)</label>
              <textarea 
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="e.g., custom branding colors, double shrink wrapping requirements..."
                className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
              />
            </div>
          </div>

          {formErrors && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-3 text-xs text-red-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <p>{formErrors}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={cart.length === 0 || hasMoqBreach}
            className={`w-full py-3.5 rounded-xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 uppercase tracking-wider transition duration-300 ${cart.length === 0 || hasMoqBreach ? 'bg-slate-800 text-slate-600 border border-slate-850 cursor-not-allowed' : 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 shadow-sky-500/10'}`}
          >
            <FileCheck className="w-4 h-4" /> Request Order Inquiry
          </button>
          
          <div className="text-center">
            <span className="text-[9px] text-slate-500 leading-normal block max-w-[280px] mx-auto">
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
        <h3 className="text-xl font-extrabold text-white uppercase tracking-wider">Inquiries & SLA Tracking</h3>
        <p className="text-xs text-slate-400">Track industrial inquiries, SLA compliance, and reviewer logs in real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* INQUIRY SELECTION MATRIX (LEFT) */}
        <div className="lg:col-span-5 space-y-4">
          {myOrders.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
              <FileText className="w-8 h-8 mx-auto text-slate-700 mb-2" />
              <p className="text-xs">No active contract inquiries found.</p>
            </div>
          ) : (
            myOrders.map(order => (
              <div 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 rounded-xl border cursor-pointer transition flex justify-between items-center ${selectedOrder?.id === order.id ? 'bg-sky-500/10 border-sky-500/40 shadow-lg' : 'bg-slate-900/40 border-slate-850 hover:border-slate-800 hover:bg-slate-900/70'}`}
              >
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-white font-mono-custom leading-none">{order.id}</h4>
                  <span className="text-[10px] text-slate-500 font-mono-custom block">Inquiry Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="text-[10px] text-sky-400 block font-bold">Quote Requested</span>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* TIMELINE REVIEW DETAILS (RIGHT) */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl space-y-6">
              
              {/* Header overview */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-lg font-extrabold text-white font-mono-custom leading-tight">{selectedOrder.id}</h4>
                  <span className="text-xs text-slate-500">Logistics Destination: {selectedOrder.shippingDetails.address}, {selectedOrder.shippingDetails.city}</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded border ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </div>

              {/* TIMELINE TIMELINE TIMELINE */}
              {selectedOrder.status !== 'rejected' && (
                <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block">SLA Logistics Progress Tracker</span>
                  <div className="relative flex justify-between items-start pt-2">
                    {/* Line behind steps */}
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-800 z-0" />
                    
                    {steps.map((st, idx) => {
                      const activeIndex = getStepActiveIndex(selectedOrder.status);
                      const isCompleted = idx + 1 < activeIndex;
                      const isActive = idx + 1 === activeIndex;

                      return (
                        <div key={idx} className="relative z-10 flex flex-col items-center text-center max-w-[70px] space-y-1.5">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition duration-300 ${isCompleted ? 'bg-emerald-500 border-emerald-600 text-slate-950' : isActive ? 'bg-sky-500 border-sky-600 text-slate-950 scale-110 shadow-lg shadow-sky-500/20' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                            {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : idx + 1}
                          </div>
                          <div className="space-y-0.5">
                            <p className={`text-[9px] font-bold ${isActive ? 'text-sky-400' : isCompleted ? 'text-slate-300' : 'text-slate-650 text-slate-500'}`}>{st.title}</p>
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
                    <div key={idx} className="flex justify-between items-center text-xs py-2 px-3 bg-slate-950 rounded border border-slate-850">
                      <div>
                        <p className="font-semibold text-slate-300">{item.productName}</p>
                        <span className="text-[10px] text-slate-500 font-mono-custom">{item.productSku} × {item.quantity.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">Standard Pack</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviewer Remarks system */}
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Workflow Remarks Audit Ledger</span>
                
                {selectedOrder.remarks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No verification comments recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedOrder.remarks.map((rem, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-850 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-300">{rem.authorName} <span className="text-[10px] text-slate-500 uppercase font-normal font-sans">({rem.authorRole})</span></span>
                          <span className="text-[9px] text-slate-600 font-mono-custom">{new Date(rem.createdAt).toLocaleDateString()} {new Date(rem.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">{rem.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-16 text-center text-slate-500 space-y-4">
              <FileText className="w-12 h-12 mx-auto text-slate-750" />
              <p className="text-sm">Select an inquiry to view timeline updates, pricing compliance, and operational verification logs.</p>
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
