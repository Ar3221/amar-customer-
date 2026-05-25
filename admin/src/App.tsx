// ==================================================
// AMAR INDUSTRIES ERP — ADMINISTRATIVE ERP PORTAL
// Path: admin/src/App.tsx
// ==================================================

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Box, Users, FileText, ShieldAlert, AlertTriangle, 
  CheckCircle2, Clock, Eye, EyeOff, Download, RefreshCw, BarChart2,
  Layers, Filter, Check, X, Send, ChevronRight,
  FileSpreadsheet, Plus, Trash2, Edit2, Search, UploadCloud, 
  Star, Flame, Package, Sparkles, PlusCircle, MapPin, Building2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import { db, initializeMockDB } from './mockData';
import type { Order, Product, Category, User as SystemUser, OrderStatus } from './types';
import { EmailPreferences } from './components/EmailPreferences';
import {
  loadAnalyticsPreferences,
  saveAnalyticsPreferences,
  buildChartData,
  getAnalyticsTableRows,
  measureLabel,
  viewModeTitle,
  formatMeasureValue,
  filterOrdersForAnalytics,
  type AnalyticsPreferences,
  type AnalyticsViewMode,
  type AnalyticsMeasure,
} from './lib/analytics';

export default function App() {
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'orders' | 'products' | 'inventory' | 'analytics' | 'exports' | 'staff'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    initializeMockDB();
    const stored = localStorage.getItem('amar_session');
    return stored ? JSON.parse(stored) : null;
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [remarkInput, setRemarkInput] = useState('');
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [isStaffAccessPromptOpen, setIsStaffAccessPromptOpen] = useState(false);
  const [staffAccessPassword, setStaffAccessPassword] = useState('');
  const [staffAccessError, setStaffAccessError] = useState<string | null>(null);

  // Sync Profiles for Demo toggling (commented out to satisfy unused local rules)
  /*
  const adminProfiles = [
    SAMPLE_SUPERVISOR,
    SAMPLE_ADMIN
  ];
  */

  useEffect(() => {
    refreshState();
  }, []);

  const refreshState = () => {
    setOrders(db.getOrders());
    setProducts(db.getProducts());
    setCategories(db.getCategories());
    setUsers(db.getUsers());
    const stored = localStorage.getItem('amar_session');
    if (stored) {
      const active = JSON.parse(stored) as SystemUser;
      const updatedUser = db.getUsers().find(u => u.id === active.id) || active;
      setCurrentUser(updatedUser);
      localStorage.setItem('amar_session', JSON.stringify(updatedUser));
    }
  };

  const handleProfileSwitch = (roleName: string) => {
    const target = db.getUsers().find(p => p.role === roleName) || (roleName === 'admin' ? SAMPLE_ADMIN : SAMPLE_SUPERVISOR);
    localStorage.setItem('amar_session', JSON.stringify(target));
    setCurrentUser(target);
    refreshState();
  };

  // 1. ORDER WORKFLOW ACTIONS
  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus, remarkText?: string) => {
    if (!remarkText && (newStatus === 'approved' || newStatus === 'rejected')) {
      setActionStatus("Verification error. Remarks are mandatory for status transitions.");
      return;
    }
    db.updateOrderStatus(orderId, newStatus, currentUser!, remarkText);
    setActionStatus(null);
    setRemarkInput('');
    
    // Refresh selections
    const updatedOrders = db.getOrders();
    setOrders(updatedOrders);
    const found = updatedOrders.find(o => o.id === orderId);
    if (found) setSelectedOrder(found);
    
    refreshState();
  };

  const handleAddCustomRemark = (orderId: string) => {
    if (!remarkInput.trim()) return;
    db.addRemark(orderId, currentUser!, remarkInput, 'operational');
    setRemarkInput('');
    
    // Refresh selection
    const updated = db.getOrders();
    setOrders(updated);
    const found = updated.find(o => o.id === orderId);
    if (found) setSelectedOrder(found);
    
    refreshState();
  };

  // 2. STOCK ADJUSTMENT WORKFLOW
  const handleAdjustStock = (productId: string, val: number) => {
    db.updateProductStock(productId, val);
    refreshState();
  };

  const handleLogout = () => {
    localStorage.removeItem('amar_session');
    setCurrentUser(null);
  };

  const requestStaffManagementAccess = () => {
    setSelectedOrder(null);
    setStaffAccessPassword('');
    setStaffAccessError(null);
    setIsStaffAccessPromptOpen(true);
  };

  const handleStaffAccessConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    if (staffAccessPassword !== currentUser?.password) {
      setStaffAccessError('Invalid administrator password. Supervisor management is locked.');
      return;
    }

    setIsStaffAccessPromptOpen(false);
    setStaffAccessPassword('');
    setStaffAccessError(null);
    setActiveMenu('staff');
  };

  // Calculated Metrics for Dashboard Cards
  const pendingInquiries = orders.filter(o => o.status === 'pending' || o.status === 'under_review');
  const approvedInquiries = orders.filter(o => o.status === 'approved' || o.status === 'processing');
  const activeEscalations = orders.filter(o => o.status === 'escalated');
  const totalValue = orders.reduce((sum, o) => sum + (o.status !== 'rejected' ? o.totalAmount : 0), 0);
  const lowStockProducts = products.filter(p => p.stockLevel <= p.minStockThreshold);

  if (!currentUser) {
    return (
      <LoginPortal onLoginSuccess={(user) => {
        localStorage.setItem('amar_session', JSON.stringify(user));
        setCurrentUser(user);
        refreshState();
      }} />
    );
  }

  return (
    <div className="min-h-screen bg-industrial-950 bg-grid-pattern text-slate-100 flex flex-col font-sans">
      
      {/* GLOBAL BANNER */}
      <div className="bg-slate-900 border-b border-industrial-800 px-6 py-2 flex justify-between items-center text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
          <span className="font-mono-custom">AMAR-ERP Executive Control Panel v3.5 (Secure Terminal Mode)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">Connected Identity:</span>
          <div className="flex bg-industrial-950 rounded border border-industrial-800 p-0.5">
            <button 
              onClick={() => handleProfileSwitch('supervisor')}
              className={`px-2 py-0.5 rounded transition ${currentUser.role === 'supervisor' ? 'bg-brand-cyan/20 text-brand-cyan font-bold' : 'hover:text-slate-200'}`}
            >
              Supervisor (Rahul)
            </button>
            <button 
              onClick={() => handleProfileSwitch('admin')}
              className={`px-2 py-0.5 rounded transition ${currentUser.role === 'admin' ? 'bg-brand-orange/20 text-brand-orange font-bold' : 'hover:text-slate-200'}`}
            >
              Admin (Amarjit)
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* SIDEBAR NAVIGATION CONTROLS */}
        <aside className="w-full md:w-64 bg-slate-900/40 border-r border-industrial-800 p-6 flex flex-col gap-8">
          <div>
            <h1 className="font-black text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase leading-none">
              AMAR ERP SYSTEM
            </h1>
            <span className="text-[10px] tracking-widest text-brand-cyan uppercase font-bold font-mono-custom block mt-1">
              AMAR INDUSTRIES LTD
            </span>
          </div>

          <nav className="flex flex-col gap-1.5 flex-1">
            <button 
              onClick={() => { setActiveMenu('dashboard'); setSelectedOrder(null); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeMenu === 'dashboard' ? 'bg-brand-cyan/10 border-l-2 border-brand-cyan text-brand-cyan' : 'hover:bg-slate-850/50 text-slate-400 hover:text-slate-200'}`}
            >
              <TrendingUp className="w-4 h-4" /> Overview Dashboard
            </button>
            <button 
              onClick={() => { setActiveMenu('orders'); setSelectedOrder(null); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeMenu === 'orders' ? 'bg-brand-cyan/10 border-l-2 border-brand-cyan text-brand-cyan' : 'hover:bg-slate-850/50 text-slate-400 hover:text-slate-200'}`}
            >
              <FileText className="w-4 h-4" /> Order Pipelines ({pendingInquiries.length})
            </button>
            <button 
              onClick={() => { setActiveMenu('products'); setSelectedOrder(null); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeMenu === 'products' ? 'bg-brand-cyan/10 border-l-2 border-brand-cyan text-brand-cyan' : 'hover:bg-slate-850/50 text-slate-400 hover:text-slate-200'}`}
            >
              <Package className="w-4 h-4" /> Product Catalog
            </button>
            <button 
              onClick={() => { setActiveMenu('inventory'); setSelectedOrder(null); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeMenu === 'inventory' ? 'bg-brand-cyan/10 border-l-2 border-brand-cyan text-brand-cyan' : 'hover:bg-slate-850/50 text-slate-400 hover:text-slate-200'}`}
            >
              <Box className="w-4 h-4" /> Stocks & Warehouses
            </button>
            <button 
              onClick={() => { setActiveMenu('analytics'); setSelectedOrder(null); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeMenu === 'analytics' ? 'bg-brand-cyan/10 border-l-2 border-brand-cyan text-brand-cyan' : 'hover:bg-slate-850/50 text-slate-400 hover:text-slate-200'}`}
            >
              <BarChart2 className="w-4 h-4" /> SLA Charts & Analytics
            </button>
            <button 
              onClick={() => { setActiveMenu('exports'); setSelectedOrder(null); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeMenu === 'exports' ? 'bg-brand-cyan/10 border-l-2 border-brand-cyan text-brand-cyan' : 'hover:bg-slate-850/50 text-slate-400 hover:text-slate-200'}`}
            >
              <Download className="w-4 h-4" /> Report Export Center
            </button>
            {currentUser.role === 'admin' && (
              <button 
                onClick={requestStaffManagementAccess}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeMenu === 'staff' ? 'bg-brand-cyan/10 border-l-2 border-brand-cyan text-brand-cyan' : 'hover:bg-slate-850/50 text-slate-400 hover:text-slate-200'}`}
              >
                <Users className="w-4 h-4" /> Staff Directory
              </button>
            )}
          </nav>

          {/* User Display Info */}
          <div className="p-4 bg-industrial-900 border border-industrial-800 rounded-xl space-y-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Authorized Session</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-mono-custom text-xs">
                {currentUser.fullName[0]}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-200 leading-tight truncate max-w-[120px]">{currentUser.fullName.split(' ')[0]}</p>
                <span className="text-[8px] text-brand-cyan font-mono-custom uppercase tracking-wider block">{currentUser.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-2 py-1 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-[9px] font-black uppercase tracking-wider text-red-400 rounded transition cursor-pointer"
            >
              Sign Out Session
            </button>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-h-[92vh]">
          {activeMenu === 'dashboard' && (
            <DashboardView 
              metrics={{ totalValue, pendingInquiries, approvedInquiries, activeEscalations, lowStockProducts }}
              orders={orders}
              onNavigate={setActiveMenu}
            />
          )}

          {activeMenu === 'orders' && (
            <OrdersPipelineView 
              orders={orders}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              currentUser={currentUser}
              remarkInput={remarkInput}
              setRemarkInput={setRemarkInput}
              onAction={handleUpdateStatus}
              onAddRemark={handleAddCustomRemark}
              actionStatus={actionStatus}
            />
          )}

          {activeMenu === 'products' && (
            <ProductsManagementView 
              products={products}
              categories={categories}
              currentUser={currentUser}
              onProductChange={refreshState}
            />
          )}

          {activeMenu === 'staff' && currentUser.role === 'admin' && (
            <StaffManagementView 
              currentUser={currentUser}
              onStaffChange={refreshState}
            />
          )}

          {activeMenu === 'inventory' && (
            <InventoryView 
              products={products}
              categories={categories}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {activeMenu === 'analytics' && (
            <AnalyticsDashboardView orders={orders} products={products} categories={categories} />
          )}

          {activeMenu === 'exports' && (
            <ExportCenterView 
              orders={orders}
              users={users}
              currentUser={currentUser}
            />
          )}
        </main>

      </div>

      {isStaffAccessPromptOpen && currentUser.role === 'admin' && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="glass-panel-glow bg-slate-950/95 border border-industrial-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col p-6 space-y-5">
            <div className="text-center space-y-2.5">
              <div className="inline-flex p-3 bg-red-950/20 border border-red-500/20 rounded-2xl text-brand-orange animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-widest">
                Supervisor Management Locked
              </h4>
              <p className="text-[10px] text-slate-500 font-mono-custom">
                Re-enter your administrator password to manage supervisor accounts.
              </p>
            </div>

            <form onSubmit={handleStaffAccessConfirm} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-semibold">Administrator Password *</label>
                <PasswordInput
                  required
                  autoFocus
                  value={staffAccessPassword}
                  onChange={(e) => setStaffAccessPassword(e.target.value)}
                  placeholder="Confirm password to continue"
                  className="w-full text-xs p-3 rounded-lg bg-industrial-950 border border-industrial-850 text-slate-200 focus:border-brand-orange outline-none transition"
                />
              </div>

              {staffAccessError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-400 font-mono-custom">
                  {staffAccessError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsStaffAccessPromptOpen(false); setStaffAccessPassword(''); setStaffAccessError(null); }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 rounded-lg text-xs font-bold text-slate-350 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-orange hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-lg shadow-brand-orange/15 transition cursor-pointer"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================================================
// ADMIN WORKFLOW VIEW COMPONENT SCRIPTS
// ==================================================

// A. OVERVIEW DASHBOARD VIEW
function DashboardView({ 
  metrics, 
  orders, 
  onNavigate 
}: { 
  metrics: any; 
  orders: Order[]; 
  onNavigate: (t: any) => void;
}) {

  // Dynamic manufacturing AI insights engine
  const getAiInsights = () => {
    const list = [];
    if (metrics.lowStockProducts.length > 0) {
      list.push(`⚠️ WARNING: Critical raw inventory alert. ${metrics.lowStockProducts[0].name} has fallen below threshold. Immediate run recommended.`);
    }
    const stagnantOrders = orders.filter(o => o.status === 'escalated');
    if (stagnantOrders.length > 0) {
      list.push(`🚨 SLA ALERT: Nestlé India inquiry ${stagnantOrders[0].id} has breached SLA timeline parameters. Processing backlog increasing.`);
    }
    list.push(`ℹ️ INSIGHT: Product category "Ice Cream Cups" demand is surging. Regional sales reports in South India show a 24% uplift.`);
    return list;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* AI INDUSTRIAL LOG ADVISOR BANNER */}
      <div className="glass-panel-glow border border-brand-cyan/30 rounded-2xl p-5 space-y-3 relative overflow-hidden bg-slate-900/60">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Layers className="w-36 h-36 text-brand-cyan" />
        </div>
        
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-brand-cyan animate-spin-slow" />
          <h4 className="text-xs font-black uppercase text-brand-cyan tracking-widest font-mono-custom">AMAR-AI Manufacturing & SLA Scheduler</h4>
        </div>
        
        <div className="space-y-1.5">
          {getAiInsights().map((insight, idx) => (
            <p key={idx} className="text-xs text-slate-300 flex items-start gap-2 font-mono-custom">
              <span className="text-brand-cyan font-bold block select-none">&gt;&gt;</span>
              <span>{insight}</span>
            </p>
          ))}
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden bg-slate-900/30">
          <div className="absolute top-4 right-4 text-brand-cyan/20 p-2 rounded bg-slate-800/50">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Annualized Pipeline Value</span>
          <h3 className="text-2xl font-extrabold text-white mt-1.5 font-mono-custom">₹{metrics.totalValue.toLocaleString(undefined, {maximumFractionDigits:0})}</h3>
          <span className="text-[9px] text-brand-cyan font-mono-custom mt-2 block">+₹1.2M this month</span>
        </div>

        <div 
          onClick={() => onNavigate('orders')}
          className="glass-panel p-6 rounded-xl relative overflow-hidden bg-slate-900/30 cursor-pointer hover:border-brand-cyan/30 transition"
        >
          <div className="absolute top-4 right-4 text-brand-cyan/20 p-2 rounded bg-slate-800/50">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Pending SLA Verification</span>
          <h3 className="text-2xl font-extrabold text-white mt-1.5 font-mono-custom">{metrics.pendingInquiries.length}</h3>
          <span className="text-[9px] text-yellow-400 font-mono-custom mt-2 block">{orders.filter(o=>o.status==='pending').length} unassigned pipeline logs</span>
        </div>

        <div 
          onClick={() => onNavigate('inventory')}
          className="glass-panel p-6 rounded-xl relative overflow-hidden bg-slate-900/30 cursor-pointer hover:border-brand-cyan/30 transition"
        >
          <div className="absolute top-4 right-4 text-brand-cyan/20 p-2 rounded bg-slate-800/50">
            <AlertTriangle className="w-5 h-5 text-amber-500/50" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Critical Inventory Alerts</span>
          <h3 className="text-2xl font-extrabold text-amber-500 mt-1.5 font-mono-custom">{metrics.lowStockProducts.length}</h3>
          <span className="text-[9px] text-slate-400 font-mono-custom mt-2 block">Require raw component refills</span>
        </div>

        <div 
          onClick={() => onNavigate('orders')}
          className="glass-panel p-6 rounded-xl relative overflow-hidden bg-slate-900/30 cursor-pointer hover:border-brand-cyan/30 transition animate-glow-fade"
        >
          <div className="absolute top-4 right-4 text-brand-cyan/20 p-2 rounded bg-slate-800/50">
            <ShieldAlert className="w-5 h-5 text-brand-escalate" />
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">SLA Critical Escalations</span>
          <h3 className="text-2xl font-extrabold text-brand-escalate mt-1.5 font-mono-custom">{metrics.activeEscalations.length}</h3>
          <span className="text-[9px] text-brand-escalate font-mono-custom mt-2 block">Executive action mandatory</span>
        </div>
      </div>

      {/* MID PANEL: LIVE RECENT LOGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Inquiries pipeline summary */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-xl space-y-4 bg-slate-900/20">
          <div className="flex justify-between items-center border-b border-industrial-800 pb-3">
            <h4 className="font-bold text-xs uppercase text-slate-300 tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-cyan" /> Live Verification Pipeline
            </h4>
            <button onClick={() => onNavigate('orders')} className="text-[10px] text-brand-cyan font-bold hover:underline">View Pipeline Grid &gt;</button>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 4).map(o => (
              <div key={o.id} className="p-3 bg-industrial-900 rounded border border-industrial-800 flex justify-between items-center text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-white font-mono-custom">{o.id}</span>
                  <span className="text-slate-500 font-mono-custom text-[10px] block">{o.customerCompany} • ₹{o.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] uppercase px-2 py-0.5 rounded border ${
                    o.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                    o.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    o.status === 'escalated' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    'bg-sky-500/10 text-sky-500 border-sky-500/20'
                  }`}>
                    {o.status.replace('_', ' ')}
                  </span>
                  <button 
                    onClick={() => { onNavigate('orders'); }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit feed logs */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-xl space-y-4 bg-slate-900/20">
          <div className="flex justify-between items-center border-b border-industrial-800 pb-3">
            <h4 className="font-bold text-xs uppercase text-slate-300 tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-cyan" /> Workflow Audits
            </h4>
          </div>

          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
            <div className="text-[10px] border-l-2 border-brand-cyan pl-3 py-1 space-y-0.5">
              <span className="text-slate-500 block font-mono-custom">2026-05-25 11:10</span>
              <p className="text-slate-300 leading-normal">System initialized. Synchronized 14 active database records.</p>
            </div>
            <div className="text-[10px] border-l-2 border-brand-orange pl-3 py-1 space-y-0.5">
              <span className="text-slate-500 block font-mono-custom">2026-05-25 10:47</span>
              <p className="text-slate-300 leading-normal">SLA check executed. 1 inquiry flagged as critical ESCALATION.</p>
            </div>
            <div className="text-[10px] border-l-2 border-emerald-500 pl-3 py-1 space-y-0.5">
              <span className="text-slate-500 block font-mono-custom">2026-05-22 14:00</span>
              <p className="text-slate-300 leading-normal">Admin Amarjit approved nesting order inquiry ORD-2026-003.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// B. DETAILED ORDER REVIEW PIPELINE
function OrdersPipelineView({ 
  orders, 
  selectedOrder, 
  setSelectedOrder,
  currentUser,
  remarkInput,
  setRemarkInput,
  onAction: handleUpdateStatus,
  onAddRemark: handleAddCustomRemark,
  actionStatus
}: any) {

  const getStatusStyle = (s: OrderStatus) => {
    switch (s) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'under_review': return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'dispatched': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'escalated': return 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* ORDERS PIPELINE TABLE (LEFT) */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <h3 className="text-xl font-extrabold text-white uppercase tracking-wider">Industrial Inquiries Pipeline</h3>
          <p className="text-xs text-slate-400">Review logistics details, product quantity requirements, and approve or assign workflows.</p>
        </div>

        <div className="glass-panel rounded-xl overflow-hidden bg-slate-900/30 border border-industrial-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-industrial-900 border-b border-industrial-800 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                <th className="p-4">Inquiry ID</th>
                <th className="p-4">Company Name</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-800">
              {orders.map((o: Order) => (
                <tr 
                  key={o.id} 
                  className={`hover:bg-slate-850/30 transition cursor-pointer ${selectedOrder?.id === o.id ? 'bg-brand-cyan/5' : ''}`}
                  onClick={() => setSelectedOrder(o)}
                >
                  <td className="p-4 font-bold font-mono-custom text-white">{o.id}</td>
                  <td className="p-4 font-semibold text-slate-350">{o.customerCompany}</td>
                  <td className="p-4 font-bold font-mono-custom text-brand-cyan">₹{o.totalAmount.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${getStatusStyle(o.status)}`}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-[10px] text-brand-cyan hover:underline font-bold flex items-center gap-1">
                      Review <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL WORKFLOW ACTION CONSOLE (RIGHT) */}
      <div className="lg:col-span-5">
        {selectedOrder ? (
          <div className="bg-slate-900/50 border border-industrial-800 p-6 rounded-2xl space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            
            {/* Header overview */}
            <div className="flex justify-between items-start border-b border-industrial-800 pb-4">
              <div>
                <h4 className="text-base font-extrabold text-white font-mono-custom">{selectedOrder.id}</h4>
                <p className="text-[10px] text-slate-500 font-mono-custom mt-0.5">Submitted: {new Date(selectedOrder.createdAt).toLocaleDateString()} {new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
              </div>
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${getStatusStyle(selectedOrder.status)}`}>
                {selectedOrder.status.replace('_', ' ')}
              </span>
            </div>

            {/* Commercial Profile */}
            <div className="bg-industrial-900 p-4 rounded-xl border border-industrial-800 text-xs space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Buyer Logistics Matrix</span>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block">Company Name</span>
                  <p className="font-semibold text-slate-200">{selectedOrder.customerCompany}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">GSTIN Registration</span>
                  <p className="font-bold text-brand-cyan font-mono-custom">{selectedOrder.gstNumber || 'NOT PROVIDED'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Buyer Phone</span>
                  <p className="font-semibold text-slate-200">{selectedOrder.shippingDetails.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Buyer Email</span>
                  <p className="font-semibold text-slate-200 truncate">{selectedOrder.shippingDetails.email || 'NOT PROVIDED'}</p>
                </div>
                <div className="col-span-2 pt-1">
                  <span className="text-[10px] text-slate-500 block">Warehouse Destination</span>
                  <p className="text-slate-350 leading-relaxed">{selectedOrder.shippingDetails.address}, {selectedOrder.shippingDetails.city}</p>
                </div>
              </div>
            </div>

            {/* Inquiry items list */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Contract Request specifications</span>
              <div className="space-y-1.5">
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-2 px-3 bg-industrial-950 rounded border border-industrial-800">
                    <div>
                      <p className="font-semibold text-slate-300">{item.productName}</p>
                      <span className="text-[10px] text-slate-500 font-mono-custom">{item.productSku} × {item.quantity.toLocaleString()}</span>
                    </div>
                    <span className="font-mono-custom font-bold text-brand-cyan">₹{(item.quantity * item.unitPrice).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION PANEL */}
            <div className="bg-industrial-900 border border-industrial-800 p-4 rounded-xl space-y-4">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Workflow State Dispatcher</span>
              
              {/* Remarks Field Input */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase block font-semibold">Workflow Comments / State Change Remarks</label>
                <textarea 
                  rows={2}
                  placeholder="Input explanation for approvals, rejections, or operational escalations..."
                  value={remarkInput}
                  onChange={(e) => setRemarkInput(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan focus:outline-none transition"
                />
              </div>

              {actionStatus && (
                <div className="bg-red-500/10 border border-red-500/20 p-2 rounded text-[10px] text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{actionStatus}</span>
                </div>
              )}

              {/* Status Actions buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'approved', remarkInput)}
                  className="flex-1 py-2 px-3 bg-brand-emerald text-slate-950 text-xs font-bold rounded flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition"
                >
                  <Check className="w-3.5 h-3.5" /> Approve Inquiry
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'rejected', remarkInput)}
                  className="flex-1 py-2 px-3 bg-red-600 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 hover:bg-red-500 transition"
                >
                  <X className="w-3.5 h-3.5" /> Reject Inquiry
                </button>
              </div>

              {/* Additional operational logs update */}
              <div className="flex gap-2 border-t border-industrial-800 pt-3">
                <button 
                  onClick={() => handleAddCustomRemark(selectedOrder.id)}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-[10px] font-bold text-slate-300 rounded flex items-center justify-center gap-1 transition"
                >
                  <Send className="w-3 h-3" /> Log Operational Comment
                </button>
                {currentUser.role === 'supervisor' && selectedOrder.status !== 'escalated' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'escalated', 'SLA Flagged: Manual operational escalation triggered by operations manager.')}
                    className="w-full py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 text-[10px] font-bold text-red-400 rounded flex items-center justify-center gap-1 transition"
                  >
                    <ShieldAlert className="w-3 h-3" /> Escalate to Admin
                  </button>
                )}
              </div>
            </div>

            {/* Remarks ledger list */}
            <div className="space-y-3 pt-3 border-t border-industrial-800">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Ledger Remark Records ({selectedOrder.remarks.length})</span>
              {selectedOrder.remarks.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">No verification comments recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {selectedOrder.remarks.map((rem: any, idx: number) => (
                    <div key={idx} className="p-3 bg-industrial-950 rounded border border-industrial-800 text-[10px] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-300">{rem.authorName} <span className="text-[8px] text-slate-500 uppercase font-normal font-sans">({rem.authorRole})</span></span>
                        <span className="text-[8px] text-slate-600 font-mono-custom">{new Date(rem.createdAt).toLocaleDateString()} {new Date(rem.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-slate-450 leading-relaxed">{rem.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-slate-900/20 border border-dashed border-industrial-800 rounded-2xl p-16 text-center text-slate-500 space-y-4">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-750" />
            <p className="text-sm">Select an active order inquiry from the pipeline directory to open the workflow state review console.</p>
          </div>
        )}
      </div>

    </div>
  );
}

// C. WAREHOUSE STOCKS & INVENTORY MANAGEMENT VIEW
function InventoryView({ 
  products, 
  categories, 
  onAdjustStock 
}: { 
  products: Product[]; 
  categories: Category[]; 
  onAdjustStock: (id: string, val: number) => void;
}) {
  const [stockAdjustments, setStockAdjustments] = useState<Record<string, string>>({});
  const [inventoryMessage, setInventoryMessage] = useState<string | null>(null);

  const handleStockAdjustment = (product: Product, direction: 'add' | 'reduce') => {
    const requestedQty = Math.floor(Number(stockAdjustments[product.id]));

    if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
      setInventoryMessage('Enter a valid stock quantity before running an inventory adjustment.');
      return;
    }

    const nextStock = direction === 'add'
      ? product.stockLevel + requestedQty
      : Math.max(0, product.stockLevel - requestedQty);

    onAdjustStock(product.id, nextStock);
    setStockAdjustments(prev => ({ ...prev, [product.id]: '' }));
    setInventoryMessage(
      direction === 'add'
        ? `Refilled ${requestedQty.toLocaleString()} units for ${product.name}.`
        : `Reduced ${Math.min(requestedQty, product.stockLevel).toLocaleString()} units from ${product.name}.`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xl font-extrabold text-white uppercase tracking-wider">Warehouse Inventory Matrix</h3>
        <p className="text-xs text-slate-400">Monitor raw stock levels, set warning margins, and run custom refill or stock reduction adjustments.</p>
      </div>

      {inventoryMessage && (
        <div className="bg-brand-cyan/10 border border-brand-cyan/20 p-3 rounded-lg flex items-center justify-between gap-3 text-xs text-brand-cyan">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p>{inventoryMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setInventoryMessage(null)}
            className="p-1 rounded hover:bg-brand-cyan/10 text-brand-cyan transition"
            aria-label="Dismiss inventory message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="glass-panel rounded-xl overflow-hidden bg-slate-900/30 border border-industrial-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-industrial-900 border-b border-industrial-800 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
              <th className="p-4">Product Name</th>
              <th className="p-4">SKU Code</th>
              <th className="p-4">Current Stock</th>
              <th className="p-4">Min. Threshold</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action Pipeline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-800">
            {products.map((p) => {
              const isLow = p.stockLevel <= p.minStockThreshold;
              
              return (
                <tr key={p.id} className="hover:bg-slate-850/20 transition">
                  <td className="p-4 font-bold text-white leading-tight">
                    {p.name}
                    <span className="text-[9px] text-slate-500 block font-normal capitalize mt-0.5">
                      {categories.find(c=>c.id===p.categoryId)?.name || 'General Product'}
                    </span>
                  </td>
                  <td className="p-4 font-mono-custom text-slate-400">{p.sku}</td>
                  <td className="p-4 font-bold font-mono-custom">{p.stockLevel.toLocaleString()} units</td>
                  <td className="p-4 font-mono-custom text-slate-500">{p.minStockThreshold.toLocaleString()} units</td>
                  <td className="p-4">
                    {isLow ? (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Critical Stock
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Secure Level
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2 min-w-[230px]">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={stockAdjustments[p.id] || ''}
                        onChange={(e) => setStockAdjustments(prev => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="Custom units"
                        className="w-full text-[10px] p-2 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          type="button"
                          onClick={() => handleStockAdjustment(p, 'add')}
                          className="px-2.5 py-1.5 bg-brand-cyan text-slate-950 text-[10px] font-black rounded hover:bg-cyan-400 transition flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Refill
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleStockAdjustment(p, 'reduce')}
                          className="px-2.5 py-1.5 bg-red-500/15 text-red-300 border border-red-500/25 text-[10px] font-black rounded hover:bg-red-500/25 transition flex items-center justify-center gap-1"
                        >
                          <X className="w-3 h-3" /> Reduce
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// D. PREFERENCE-DRIVEN ANALYTICS VIEW
function AnalyticsDashboardView({
  orders,
  products,
  categories,
}: {
  orders: Order[];
  products: Product[];
  categories: Category[];
}) {
  const [prefs, setPrefs] = useState<AnalyticsPreferences>(loadAnalyticsPreferences);

  const updatePrefs = (patch: Partial<AnalyticsPreferences>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveAnalyticsPreferences(next);
  };

  const filteredOrders = useMemo(
    () => filterOrdersForAnalytics(orders, prefs.includePending),
    [orders, prefs.includePending]
  );

  const chartData = useMemo(
    () => buildChartData(orders, products, categories, prefs),
    [orders, products, categories, prefs]
  );

  const tableRows = useMemo(
    () => getAnalyticsTableRows(orders, products, categories, prefs),
    [orders, products, categories, prefs]
  );

  const COLORS = ['#00f2fe', '#06b6d4', '#10b981', '#f97316', '#ef4444', '#a855f7', '#eab308', '#64748b'];

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalQty = filteredOrders.reduce(
    (s, o) => s + o.items.reduce((q, i) => q + i.quantity, 0),
    0
  );

  const viewModes: { id: AnalyticsViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'state', label: 'State-wise', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'company', label: 'Company-wise', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'sales', label: 'Sales-wise', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'quantity', label: 'Quantity-wise', icon: <Package className="w-3.5 h-3.5" /> },
  ];

  const measures: { id: AnalyticsMeasure; label: string }[] = [
    { id: 'revenue', label: 'Sales (₹)' },
    { id: 'quantity', label: 'Quantity' },
    { id: 'orders', label: 'Orders' },
  ];

  const showMeasureToggle = prefs.viewMode === 'state' || prefs.viewMode === 'company';
  const activeMeasure = prefs.viewMode === 'sales' ? 'revenue' : prefs.viewMode === 'quantity' ? 'quantity' : prefs.measure;

  const yFormatter = (v: number) => {
    if (activeMeasure === 'revenue') return `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${(v / 1000).toFixed(0)}k`}`;
    if (activeMeasure === 'quantity') return v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
    return String(v);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-white uppercase tracking-wider">Enterprise Performance Analytics</h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose how to slice your pipeline — by state, company, sales timeline, or quantity by category.
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="glass-panel px-4 py-2 rounded-lg border border-industrial-800">
            <span className="text-slate-500 block text-[9px] uppercase">Filtered orders</span>
            <span className="font-mono-custom font-bold text-brand-cyan">{filteredOrders.length}</span>
          </div>
          <div className="glass-panel px-4 py-2 rounded-lg border border-industrial-800">
            <span className="text-slate-500 block text-[9px] uppercase">Pipeline value</span>
            <span className="font-mono-custom font-bold text-emerald-400">₹{totalRevenue.toLocaleString('en-IN')}</span>
          </div>
          <div className="glass-panel px-4 py-2 rounded-lg border border-industrial-800">
            <span className="text-slate-500 block text-[9px] uppercase">Total units</span>
            <span className="font-mono-custom font-bold text-slate-200">{totalQty.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Analytics preferences */}
      <div className="glass-panel p-5 rounded-xl bg-slate-900/40 border border-industrial-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-industrial-800 pb-3">
          <Filter className="w-4 h-4 text-brand-cyan" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Analytics View Preference</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {viewModes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => updatePrefs({ viewMode: m.id })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                prefs.viewMode === m.id
                  ? 'bg-brand-cyan/20 border border-brand-cyan text-brand-cyan'
                  : 'bg-slate-900 border border-industrial-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {showMeasureToggle && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[9px] text-slate-500 uppercase font-semibold mr-2">Measure:</span>
            {measures.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => updatePrefs({ measure: m.id })}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition cursor-pointer ${
                  prefs.measure === m.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-industrial-950 text-slate-500 border border-industrial-800 hover:text-slate-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.includePending}
            onChange={(e) => updatePrefs({ includePending: e.target.checked })}
            className="accent-brand-cyan"
          />
          Include pending &amp; rejected orders in analytics
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Primary chart */}
        <div className="glass-panel p-6 rounded-xl bg-slate-900/30 space-y-4 lg:col-span-2">
          <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest block">
            {viewModeTitle(prefs.viewMode)} — {measureLabel(activeMeasure)}
          </span>
          <div className="h-80">
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-20">No order data for the selected filters.</p>
            ) : prefs.viewMode === 'sales' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00f2fe" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} tickFormatter={yFormatter} />
                  <Tooltip
                    formatter={(value) => [formatMeasureValue(Number(value || 0), 'revenue'), 'Sales']}
                    contentStyle={{ background: '#09090b', borderColor: '#27272a' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#00f2fe" strokeWidth={2} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout={chartData.length > 8 ? 'vertical' : 'horizontal'}>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                  {chartData.length > 8 ? (
                    <>
                      <XAxis type="number" stroke="#71717a" fontSize={10} tickFormatter={yFormatter} />
                      <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={9} width={120} />
                    </>
                  ) : (
                    <>
                      <XAxis dataKey="name" stroke="#71717a" fontSize={9} angle={-20} textAnchor="end" height={70} />
                      <YAxis stroke="#71717a" fontSize={10} tickFormatter={yFormatter} />
                    </>
                  )}
                  <Tooltip
                    formatter={(value) => [formatMeasureValue(Number(value || 0), activeMeasure), measureLabel(activeMeasure)]}
                    contentStyle={{ background: '#09090b', borderColor: '#27272a' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Breakdown table */}
        <div className="glass-panel p-6 rounded-xl bg-slate-900/30 space-y-4 lg:col-span-2">
          <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest block">Detailed breakdown</span>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 uppercase text-[9px] border-b border-industrial-800">
                  <th className="py-2 pr-4">Segment</th>
                  <th className="py-2 pr-4 text-right">Sales (₹)</th>
                  <th className="py-2 pr-4 text-right">Quantity</th>
                  <th className="py-2 text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-industrial-800/50 hover:bg-slate-900/50">
                    <td className="py-2.5 pr-4 font-semibold text-slate-300">{row.name}</td>
                    <td className="py-2.5 pr-4 text-right font-mono-custom text-emerald-400">
                      ₹{(row.revenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono-custom text-slate-400">
                      {(row.quantity || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 text-right font-mono-custom text-brand-cyan">{row.orders || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie share for state/company */}
        {(prefs.viewMode === 'state' || prefs.viewMode === 'company') && chartData.length > 0 && (
          <div className="glass-panel p-6 rounded-xl bg-slate-900/30 space-y-4 lg:col-span-2">
            <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest block">
              Share distribution — {measureLabel(prefs.measure)}
            </span>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {chartData.map((_, index) => (
                        <Cell key={`pie-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatMeasureValue(Number(value || 0), prefs.measure), 'Share']}
                      contentStyle={{ background: '#09090b', borderColor: '#27272a' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 text-xs flex-1">
                {chartData.slice(0, 10).map((c, idx) => {
                  const total = chartData.reduce((s, d) => s + d.value, 0);
                  const pct = total ? ((c.value / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                        <span className="text-slate-300 font-semibold truncate max-w-[200px]">{c.name}</span>
                      </div>
                      <span className="text-slate-500 font-mono-custom">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// E. REPORT EXPORT CENTER VIEW (XLSX, PAPAPARSE, JSPDF)
function ExportCenterView({ 
  orders, 
  users,
  currentUser 
}: { 
  orders: Order[]; 
  users: SystemUser[];
  currentUser: SystemUser 
}) {
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [includeCustomerDetails, setIncludeCustomerDetails] = useState(true);
  const [exportLoggedMsg, setExportLoggedMsg] = useState<string | null>(null);

  const getFilteredData = () => {
    return orders.filter(o => filterStatus === 'all' ? true : o.status === filterStatus);
  };

  const customerProfiles = useMemo(() => {
    return new Map(users.filter(u => u.role === 'customer').map(u => [u.id, u]));
  }, [users]);

  const buildCustomerExportRow = (o: Order) => {
    const customer = customerProfiles.get(o.customerId);
    const email = customer?.email || o.shippingDetails.email || '';
    const phone = customer?.phoneNumber || o.shippingDetails.phone || '';
    const company = customer?.companyName || o.customerCompany || '';
    const gstNumber = customer?.gstNumber || o.gstNumber || '';
    const registeredAddress = customer?.shippingAddress || '';

    return {
      orderId: o.id,
      customerId: o.customerId,
      customerName: o.customerName,
      registeredFullName: customer?.fullName || o.shippingDetails.fullName || o.customerName,
      companyName: company,
      email,
      phone,
      gstNumber,
      registeredAddress,
      shippingFullName: o.shippingDetails.fullName,
      shippingAddress: o.shippingDetails.address,
      shippingCity: o.shippingDetails.city,
      shippingPhone: o.shippingDetails.phone,
      shippingEmail: o.shippingDetails.email || email,
      customerRegisteredAt: customer?.createdAt || '',
      orderNotes: o.notes || '',
      status: o.status,
      inquiryDate: o.createdAt,
      contractValue: o.totalAmount
    };
  };

  // 1. EXCEL EXPORT MACRO
  const triggerExcelExport = () => {
    const data = getFilteredData();
    const cleanData = data.map(o => {
      const c = buildCustomerExportRow(o);
      const summaryRow = {
        'Order ID': c.orderId,
        'Customer Name': c.customerName,
        'Company Name': c.companyName,
        'Status': c.status.toUpperCase(),
        'Inquiry Date': new Date(c.inquiryDate).toLocaleDateString(),
        'GSTIN Registration': c.gstNumber || 'UNAVAILABLE',
        'Shipping City': c.shippingCity,
        'Contract Value (INR)': c.contractValue
      };

      if (!includeCustomerDetails) return summaryRow;

      return {
        ...summaryRow,
        'Customer ID': c.customerId,
        'Registered Full Name': c.registeredFullName,
        'Customer Email': c.email || 'UNAVAILABLE',
        'Customer Phone': c.phone || 'UNAVAILABLE',
        'Registered Address': c.registeredAddress || 'UNAVAILABLE',
        'Shipping Full Name': c.shippingFullName,
        'Shipping Address': c.shippingAddress,
        'Shipping Phone': c.shippingPhone,
        'Shipping Email': c.shippingEmail || 'UNAVAILABLE',
        'Customer Registered At': c.customerRegisteredAt ? new Date(c.customerRegisteredAt).toLocaleString() : 'UNAVAILABLE',
        'Customer Notes': c.orderNotes || 'NONE'
      };
    });

    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inquiries Pipeline');
    
    // Write out Excel
    XLSX.writeFile(wb, `AMAR_ERP_Pipeline_${Date.now()}.xlsx`);
    
    setExportLoggedMsg(`Spreadsheet report generated successfully in Excel format${includeCustomerDetails ? ' with customer details' : ''}. Row count: ${cleanData.length}`);
  };

  // 2. CSV EXPORT MACRO
  const triggerCsvExport = () => {
    const data = getFilteredData();
    const cleanData = data.map(o => {
      const c = buildCustomerExportRow(o);

      if (includeCustomerDetails) return c;

      return {
        orderId: c.orderId,
        customer: c.customerName,
        company: c.companyName,
        status: c.status,
        date: c.inquiryDate,
        amount: c.contractValue,
        gstin: c.gstNumber,
        city: c.shippingCity
      };
    });

    const csv = Papa.unparse(cleanData);
    
    // Download prompt Deno/Browser element
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AMAR_ERP_Pipeline_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportLoggedMsg(`CSV dataset report extracted successfully${includeCustomerDetails ? ' with customer details' : ''}. Row count: ${cleanData.length}`);
  };

  // 3. PDF INVOICE EXPORT MACRO
  const triggerPdfExport = () => {
    const data = getFilteredData();
    const doc = new jsPDF();

    // Document styling defaults
    doc.setFont("Helvetica");
    
    // Header
    doc.setFillColor(9, 9, 11);
    doc.rect(0, 0, 220, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("AMAR INDUSTRIES / AMAR SPLINTS PVT. LTD.", 15, 20);
    doc.setFontSize(9);
    doc.setTextColor(6, 182, 212);
    doc.text("SLA LOGISTICS AUDIT - SYSTEM PIPELINE REPORT", 15, 27);
    
    // System audit metadata
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated by: ${currentUser.fullName}`, 15, 50);
    doc.text(`Timestamp: ${new Date().toLocaleString()}`, 15, 55);
    doc.text(`Selected status filters: ${filterStatus.toUpperCase()}`, 15, 60);
    doc.text(`Customer details: ${includeCustomerDetails ? 'INCLUDED' : 'SUMMARY ONLY'}`, 15, 65);

    // Dynamic grid draw
    let yPos = 75;
    doc.setFontSize(10);
    doc.setFillColor(24, 24, 27);
    doc.rect(12, yPos - 5, 186, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("ID", 15, yPos);
    if (includeCustomerDetails) {
      doc.text("Customer / Company", 38, yPos);
      doc.text("Contact", 95, yPos);
      doc.text("GSTIN / City", 145, yPos);
    } else {
      doc.text("Company", 45, yPos);
      doc.text("Inquiry Date", 115, yPos);
      doc.text("Contract INR", 155, yPos);
    }

    doc.setTextColor(50, 50, 50);
    data.forEach((o) => {
      const c = buildCustomerExportRow(o);
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      yPos += 12;
      doc.text(o.id, 15, yPos);

      if (includeCustomerDetails) {
        doc.text(`${c.customerName}`.slice(0, 24), 38, yPos);
        doc.text(`${c.phone || 'No phone'}`.slice(0, 24), 95, yPos);
        doc.text(`${c.gstNumber || 'No GSTIN'}`.slice(0, 22), 145, yPos);
        yPos += 5;
        doc.setTextColor(95, 95, 95);
        doc.text(`${c.companyName}`.slice(0, 32), 38, yPos);
        doc.text(`${c.email || 'No email'}`.slice(0, 30), 95, yPos);
        doc.text(`${c.shippingCity}`.slice(0, 24), 145, yPos);
        yPos += 5;
        doc.text(`Address: ${c.registeredAddress || c.shippingAddress}`.slice(0, 88), 38, yPos);
        doc.setTextColor(50, 50, 50);
      } else {
        doc.text(c.companyName.slice(0, 24), 45, yPos);
        doc.text(new Date(c.inquiryDate).toLocaleDateString(), 115, yPos);
        doc.text(`INR ${c.contractValue.toLocaleString()}`, 155, yPos);
      }
    });

    doc.save(`AMAR_ERP_SLA_Ledger_${Date.now()}.pdf`);

    setExportLoggedMsg(`Official PDF Report compiled${includeCustomerDetails ? ' with customer details' : ''}. Dispatched to browser download manager. Entries: ${data.length}`);
  };

  const handleTriggerRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (exportFormat === 'excel') triggerExcelExport();
    if (exportFormat === 'csv') triggerCsvExport();
    if (exportFormat === 'pdf') triggerPdfExport();
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h3 className="text-xl font-extrabold text-white uppercase tracking-wider">Spreadsheet & Document Export Center</h3>
        <p className="text-xs text-slate-400">Generate audits, export spreadsheet formats for accounting systems, or print executive PDFs.</p>
      </div>

      <form onSubmit={handleTriggerRun} className="glass-panel p-6 rounded-2xl bg-slate-900/40 border border-industrial-800 space-y-5">
        <div className="border-b border-industrial-800 pb-3">
          <h4 className="font-bold text-xs uppercase text-slate-300 tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-cyan" /> Configure Export Matrix
          </h4>
        </div>

        <div className="space-y-4">
          
          {/* Format selection */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Select File Format</span>
            <div className="grid grid-cols-3 gap-3">
              <button 
                type="button"
                onClick={() => setExportFormat('excel')}
                className={`py-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${exportFormat === 'excel' ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' : 'bg-industrial-900 border-industrial-800 text-slate-450 hover:text-slate-200'}`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Microsoft Excel
              </button>
              <button 
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`py-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${exportFormat === 'csv' ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' : 'bg-industrial-900 border-industrial-800 text-slate-450 hover:text-slate-200'}`}
              >
                <FileSpreadsheet className="w-4 h-4" /> CSV Format
              </button>
              <button 
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`py-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${exportFormat === 'pdf' ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' : 'bg-industrial-900 border-industrial-800 text-slate-450 hover:text-slate-200'}`}
              >
                <FileText className="w-4 h-4" /> PDF Audit
              </button>
            </div>
          </div>

          {/* Filtering variables */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Filter by Order Status</span>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
            >
              <option value="all">All Inquiries</option>
              <option value="pending">Pending Review Only</option>
              <option value="approved">Approved Contracts Only</option>
              <option value="rejected">Rejected Inquiries Only</option>
              <option value="escalated">SLA Escalations Only</option>
            </select>
          </div>

          {/* Customer detail export option */}
          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${includeCustomerDetails ? 'bg-brand-cyan/10 border-brand-cyan/40' : 'bg-industrial-950 border-industrial-800 hover:border-industrial-700'}`}>
            <input
              type="checkbox"
              checked={includeCustomerDetails}
              onChange={(e) => setIncludeCustomerDetails(e.target.checked)}
              className="mt-1 h-4 w-4 accent-cyan-400"
            />
            <span className="space-y-1">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">Include Customer Details</span>
              <span className="text-[10px] text-slate-500 leading-relaxed block">
                Adds customer ID, registered name, email, phone number, GSTIN, registered address, shipping address, and notes to the export.
              </span>
            </span>
          </label>

        </div>

        {exportLoggedMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-3 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p>{exportLoggedMsg}</p>
          </div>
        )}

        <button 
          type="submit"
          className="w-full py-3 bg-brand-cyan hover:bg-cyan-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider rounded-lg shadow-xl shadow-brand-cyan/15 flex items-center justify-center gap-2 transition duration-300"
        >
          <Download className="w-4 h-4" /> Compile & Download Report
        </button>
      </form>
    </div>
  );
}

// ==================================================
// DEMO ACCOUNTS STATIC METADATA
// ==================================================

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

// ==================================================
// F. DYNAMIC PRODUCT MANAGEMENT SYSTEM (CRITICAL MODULE)
// ==================================================
interface ProductsManagementViewProps {
  products: Product[];
  categories: Category[];
  currentUser: SystemUser;
  onProductChange: () => void;
}

function ProductsManagementView({
  products,
  categories,
  currentUser,
  onProductChange
}: ProductsManagementViewProps) {
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Permission error message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'general' | 'moq' | 'specs' | 'marketing'>('general');

  // Form states
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formMoq, setFormMoq] = useState(50000);
  const [formBasePrice, setFormBasePrice] = useState(1.00);
  const [formUnitType, setFormUnitType] = useState('Thousand');
  const [formStockLevel, setFormStockLevel] = useState(100000);
  const [formMinStockThreshold, setFormMinStockThreshold] = useState(30000);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formStatus, setFormStatus] = useState<'active' | 'hidden' | 'out_of_stock'>('active');
  const [formTags, setFormTags] = useState<string>('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formTrending, setFormTrending] = useState(false);
  const [formCustomPrinting, setFormCustomPrinting] = useState(false);
  const [formPackagingDetails, setFormPackagingDetails] = useState('');
  const [formExportSpecifications, setFormExportSpecifications] = useState('');
  
  // Volume pricing states
  const [formVolumePricing, setFormVolumePricing] = useState<{ qty: number; price: number }[]>([]);
  const [newVolumeQty, setNewVolumeQty] = useState<number | ''>('');
  const [newVolumePrice, setNewVolumePrice] = useState<number | ''>('');

  // Dimensions states
  const [formHeight, setFormHeight] = useState('');
  const [formTopDiameter, setFormTopDiameter] = useState('');
  const [formBottomDiameter, setFormBottomDiameter] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formLength, setFormLength] = useState('');
  const [formWidth, setFormWidth] = useState('');
  const [formThickness, setFormThickness] = useState('');
  const [formSticks, setFormSticks] = useState<number | ''>('');

  // Upload simulation states
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingProgress, setUploadingProgress] = useState<number | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Pre-load default values
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingProductId(null);
    setModalTab('general');
    
    // Clear all fields
    setFormName('');
    setFormSku(`AMAR-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`);
    setFormCategoryId(categories[0]?.id || '');
    setFormDescription('');
    setFormMaterial('Food Grade Polypropylene (PP)');
    setFormMoq(50000);
    setFormBasePrice(1.00);
    setFormUnitType('Thousand');
    setFormStockLevel(100000);
    setFormMinStockThreshold(30000);
    setFormIsAvailable(true);
    setFormStatus('active');
    setFormTags('cups, plastic, new');
    setFormFeatured(false);
    setFormTrending(false);
    setFormCustomPrinting(true);
    setFormPackagingDetails('5,000 units per master carton, double shrink-wrapped');
    setFormExportSpecifications('HS Code: 39235010, certified FDA food grade');
    setFormVolumePricing([]);
    setImageUrls([]);
    
    // Reset dimensions
    setFormHeight('50mm');
    setFormTopDiameter('70mm');
    setFormBottomDiameter('50mm');
    setFormWeight('2.8g');
    setFormLength('');
    setFormWidth('');
    setFormThickness('');
    setFormSticks('');

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setModalMode('edit');
    setEditingProductId(p.id);
    setModalTab('general');

    // Fill form fields
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategoryId(p.categoryId);
    setFormDescription(p.description);
    setFormMaterial(p.material);
    setFormMoq(p.moq);
    setFormBasePrice(p.basePrice);
    setFormUnitType(p.unitType);
    setFormStockLevel(p.stockLevel);
    setFormMinStockThreshold(p.minStockThreshold);
    setFormIsAvailable(p.isAvailable);
    setFormStatus(p.status);
    setFormTags(p.tags.join(', '));
    setFormFeatured(p.featured);
    setFormTrending(p.trending);
    setFormCustomPrinting(p.customPrinting);
    setFormPackagingDetails(p.packagingDetails || '');
    setFormExportSpecifications(p.exportSpecifications || '');
    setFormVolumePricing(p.volumePricing || []);
    setImageUrls(p.imageUrls || []);

    // Fill dimensions
    setFormHeight(p.dimensions?.height || '');
    setFormTopDiameter(p.dimensions?.top_diameter || '');
    setFormBottomDiameter(p.dimensions?.bottom_diameter || '');
    setFormWeight(p.dimensions?.weight || '');
    setFormLength(p.dimensions?.length || '');
    setFormWidth(p.dimensions?.width || '');
    setFormThickness(p.dimensions?.thickness || '');
    setFormSticks(p.dimensions?.sticks || '');

    setIsModalOpen(true);
  };

  // CRUD Actions
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formSku.trim()) {
      showToast('⚠️ Validation Error: Product Name and SKU code are mandatory fields.');
      return;
    }

    const payload = {
      categoryId: formCategoryId,
      name: formName,
      sku: formSku,
      description: formDescription,
      dimensions: {
        height: formHeight || undefined,
        top_diameter: formTopDiameter || undefined,
        bottom_diameter: formBottomDiameter || undefined,
        weight: formWeight || undefined,
        length: formLength || undefined,
        width: formWidth || undefined,
        thickness: formThickness || undefined,
        sticks: formSticks !== '' ? Number(formSticks) : undefined
      },
      material: formMaterial,
      moq: Number(formMoq),
      basePrice: Number(formBasePrice),
      volumePricing: formVolumePricing,
      imageUrls: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=600'],
      isAvailable: formIsAvailable,
      stockLevel: Number(formStockLevel),
      minStockThreshold: Number(formMinStockThreshold),
      unitType: formUnitType,
      status: formStatus,
      tags: formTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
      featured: formFeatured,
      trending: formTrending,
      customPrinting: formCustomPrinting,
      packagingDetails: formPackagingDetails || undefined,
      exportSpecifications: formExportSpecifications || undefined
    };

    if (modalMode === 'create') {
      db.createProduct(payload);
      showToast(`🎉 Success: Created new catalog item "${formName}" successfully!`);
    } else {
      if (editingProductId) {
        db.updateProduct(editingProductId, payload);
        showToast(`🎉 Success: Product "${formName}" catalog specs updated successfully!`);
      }
    }

    setIsModalOpen(false);
    onProductChange();
  };

  const handleDeleteProduct = (productId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}" from the active product catalog?`)) {
      return;
    }

    const success = db.deleteProduct(productId, currentUser);
    if (!success) {
      showToast(`🚨 Permission Denied: Supervisors are blocked from deleting factory-preset catalog products. Please contact the Managing Director (Admin).`);
    } else {
      showToast(`🎉 Success: Catalog item "${name}" deleted successfully.`);
      onProductChange();
    }
  };

  // Inline rapid switches
  const toggleFeatured = (p: Product) => {
    db.updateProduct(p.id, { featured: !p.featured });
    showToast(`🔄 Catalog updated: Toggled Featured status for ${p.name}`);
    onProductChange();
  };

  const toggleTrending = (p: Product) => {
    db.updateProduct(p.id, { trending: !p.trending });
    showToast(`🔄 Catalog updated: Toggled Trending status for ${p.name}`);
    onProductChange();
  };

  const toggleAvailability = (p: Product) => {
    const nextStatus = p.status === 'active' ? 'hidden' : 'active';
    db.updateProduct(p.id, { 
      status: nextStatus,
      isAvailable: nextStatus === 'active'
    });
    showToast(`🔄 Catalog updated: Product ${p.name} visibility changed to: ${nextStatus.toUpperCase()}`);
    onProductChange();
  };

  // Volume pricing helper functions
  const addVolumeTier = () => {
    if (newVolumeQty === '' || newVolumePrice === '') {
      showToast('⚠️ Please specify both quantity and discounted price to append a tier.');
      return;
    }
    const qty = Number(newVolumeQty);
    const price = Number(newVolumePrice);

    if (qty <= 0 || price <= 0) {
      showToast('⚠️ Quantity and price tiers must be greater than zero.');
      return;
    }

    // Check duplicates
    if (formVolumePricing.some(t => t.qty === qty)) {
      showToast('⚠️ A pricing tier for this exact volume quantity already exists.');
      return;
    }

    const updated = [...formVolumePricing, { qty, price }].sort((a, b) => a.qty - b.qty);
    setFormVolumePricing(updated);
    setNewVolumeQty('');
    setNewVolumePrice('');
  };

  const removeVolumeTier = (qtyIndex: number) => {
    const updated = formVolumePricing.filter((_, idx) => idx !== qtyIndex);
    setFormVolumePricing(updated);
  };

  // Simulated image upload drag-and-drop
  const simulateImageUpload = () => {
    if (uploadingProgress !== null) return;
    setUploadingProgress(10);
    
    let progress = 10;
    const interval = setInterval(() => {
      progress += 30;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadingProgress(100);
        setTimeout(() => {
          // Select a beautiful pre-defined mock Unsplash asset based on keywords
          const mockImages = [
            'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=600',
            'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=600',
            'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?q=80&w=600',
            'https://images.unsplash.com/photo-1549476464-37392f719c28?q=80&w=600',
            'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?q=80&w=600',
            'https://images.unsplash.com/photo-1582281227099-7f4574488fb6?q=80&w=600',
            'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=600'
          ];
          const chosenImage = mockImages[Math.floor(Math.random() * mockImages.length)];
          setImageUrls(prev => [...prev, chosenImage]);
          setUploadingProgress(null);
          showToast('📸 Image simulated and successfully uploaded to bucket "product-assets".');
        }, 300);
      } else {
        setUploadingProgress(progress);
      }
    }, 250);
  };

  const removeImage = (urlIndex: number) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== urlIndex));
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCat = selectedCatFilter === 'all' ? true : p.categoryId === selectedCatFilter;
    const matchesStatus = selectedStatusFilter === 'all' ? true : p.status === selectedStatusFilter;

    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* TOAST SYSTEM BANNER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel-glow border-l-4 border-brand-cyan px-5 py-4 rounded-xl max-w-md shadow-2xl flex items-center justify-between gap-4 animate-slide-up bg-slate-900">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-brand-cyan flex-shrink-0 animate-bounce" />
            <p className="text-xs font-semibold text-slate-200">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-cyan" /> Unified Product Catalog
          </h3>
          <p className="text-xs text-slate-400">Configure factory products, volume tiers, MOQ scales, and marketing metadata fields.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="py-2.5 px-4 bg-brand-cyan hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-lg shadow-brand-cyan/10 transition duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* FILTER SEARCH GRID */}
      <div className="glass-panel p-4 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-900/20">
        
        {/* Search Query */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by product name, SKU code, tags..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-lg bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none transition"
          />
        </div>

        {/* Category Selector */}
        <div className="sm:col-span-3">
          <select 
            value={selectedCatFilter}
            onChange={(e) => setSelectedCatFilter(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Status Selector */}
        <div className="sm:col-span-3">
          <select 
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Tiers</option>
            <option value="hidden">Hidden</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

      </div>

      {/* PRODUCTS MATRIX TABLE */}
      <div className="glass-panel rounded-xl overflow-hidden bg-slate-900/30 border border-industrial-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-industrial-900 border-b border-industrial-800 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
              <th className="p-4 pl-6 w-14">Image</th>
              <th className="p-4">Product Details</th>
              <th className="p-4">Supply Specs</th>
              <th className="p-4">Stock Metrics</th>
              <th className="p-4 text-center">Marketing</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right pr-6">Action Matrix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-800">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-500 italic">
                  No factory products catalog logs found matching selected criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const categoryName = categories.find(c => c.id === p.categoryId)?.name || 'General Product';
                const isLow = p.stockLevel <= p.minStockThreshold;

                return (
                  <tr key={p.id} className="hover:bg-slate-850/15 transition">
                    
                    {/* IMAGE */}
                    <td className="p-4 pl-6">
                      <img 
                        src={p.imageUrls[0] || 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=100'} 
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-lg border border-industrial-800 bg-slate-950" 
                      />
                    </td>

                    {/* DETAILS */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-white text-xs hover:text-brand-cyan cursor-pointer transition" onClick={() => handleOpenEditModal(p)}>{p.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-450 font-mono-custom">
                          <span>{p.sku}</span>
                          <span className="text-slate-650">•</span>
                          <span className="text-brand-cyan/80 capitalize font-sans font-semibold">{categoryName}</span>
                        </div>
                      </div>
                    </td>

                    {/* SUPPLY */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-200">MOQ: <span className="font-mono-custom font-normal text-slate-350">{p.moq.toLocaleString()}</span> <span className="text-[10px] text-slate-500">/{p.unitType}</span></p>
                        <p className="text-[10px] text-slate-450 font-semibold">Base: <span className="font-mono-custom text-brand-cyan">₹{p.basePrice.toFixed(4)}</span></p>
                      </div>
                    </td>

                    {/* STOCK */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className={`font-bold font-mono-custom ${isLow ? 'text-amber-500' : 'text-slate-200'}`}>
                          {p.stockLevel.toLocaleString()} units
                        </p>
                        <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold w-fit block ${
                          p.status === 'out_of_stock' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          isLow ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-emerald-500/5 text-emerald-450 border border-emerald-500/10'
                        }`}>
                          {p.status === 'out_of_stock' ? 'OUT OF STOCK' : isLow ? 'LOW STOCK ALERT' : 'SECURE LEVEL'}
                        </span>
                      </div>
                    </td>

                    {/* MARKETING TOGGLES */}
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2.5">
                        {/* Featured Star toggle */}
                        <button 
                          onClick={() => toggleFeatured(p)}
                          title={p.featured ? "Featured Product" : "Mark as Featured"}
                          className={`p-1 rounded hover:bg-slate-800 transition ${p.featured ? 'text-yellow-400' : 'text-slate-600'}`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                        {/* Trending Flame toggle */}
                        <button 
                          onClick={() => toggleTrending(p)}
                          title={p.trending ? "Trending Product" : "Mark as Trending"}
                          className={`p-1 rounded hover:bg-slate-800 transition ${p.trending ? 'text-brand-orange' : 'text-slate-600'}`}
                        >
                          <Flame className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="p-4">
                      <button 
                        onClick={() => toggleAvailability(p)}
                        className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border transition ${
                          p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' :
                          p.status === 'hidden' ? 'bg-slate-700/25 text-slate-400 border-slate-700/35 hover:bg-slate-700/40' :
                          'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                        }`}
                      >
                        {p.status.replace('_', ' ')}
                      </button>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 text-right pr-6">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => handleOpenEditModal(p)}
                          title="Edit Specifications"
                          className="p-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          title="Delete Product"
                          className="p-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/10 hover:border-red-500/30 rounded text-red-400 hover:text-red-300 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL SYSTEM CREATION/EDITING (TABBED SHEET) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-industrial-800 bg-slate-950">
            
            {/* Modal Header */}
            <div className="bg-industrial-900 px-6 py-4 border-b border-industrial-800 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-brand-cyan" /> 
                  {modalMode === 'create' ? 'Create New Industrial Catalog Item' : 'Modify Product Specifications'}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono-custom mt-0.5">
                  {modalMode === 'edit' ? `Modifying profile: ${formSku}` : 'Generate new factory record profile'}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body & Columns */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
              
              {/* Left Column: Editor Tabs Form */}
              <div className="flex-1 space-y-5">
                
                {/* Form Tabs Nav */}
                <div className="flex border-b border-industrial-800 gap-1.5 text-xs pb-0.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setModalTab('general')}
                    className={`pb-2 px-3 font-semibold transition uppercase tracking-wider ${modalTab === 'general' ? 'border-b-2 border-brand-cyan text-brand-cyan' : 'text-slate-450 hover:text-slate-200'}`}
                  >
                    General Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('moq')}
                    className={`pb-2 px-3 font-semibold transition uppercase tracking-wider ${modalTab === 'moq' ? 'border-b-2 border-brand-cyan text-brand-cyan' : 'text-slate-450 hover:text-slate-200'}`}
                  >
                    MOQ & Supply Tiers
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('specs')}
                    className={`pb-2 px-3 font-semibold transition uppercase tracking-wider ${modalTab === 'specs' ? 'border-b-2 border-brand-cyan text-brand-cyan' : 'text-slate-450 hover:text-slate-200'}`}
                  >
                    Technical Specs
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('marketing')}
                    className={`pb-2 px-3 font-semibold transition uppercase tracking-wider ${modalTab === 'marketing' ? 'border-b-2 border-brand-cyan text-brand-cyan' : 'text-slate-450 hover:text-slate-200'}`}
                  >
                    Marketing & Tags
                  </button>
                </div>

                {/* Tab Content Rendering */}
                <div className="space-y-4 min-h-[45vh]">
                  
                  {/* TAB 1: GENERAL INFO */}
                  {modalTab === 'general' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                      
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Product Name *</label>
                        <input 
                          type="text" 
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="e.g. Premium 250ml Dessert Tub"
                          className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">SKU Code *</label>
                        <input 
                          type="text" 
                          required
                          value={formSku}
                          onChange={(e) => setFormSku(e.target.value)}
                          placeholder="e.g. AMAR-IC-250"
                          className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none font-mono-custom"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Catalog Category *</label>
                        <select 
                          value={formCategoryId}
                          onChange={(e) => setFormCategoryId(e.target.value)}
                          className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Description</label>
                        <textarea 
                          rows={3}
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          placeholder="Provide detailed description of material applications and rigidity properties..."
                          className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Base Price per Unit *</label>
                        <input 
                          type="number" 
                          step="0.0001"
                          required
                          value={formBasePrice}
                          onChange={(e) => setFormBasePrice(Number(e.target.value))}
                          className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none font-mono-custom"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Unit Type *</label>
                        <input 
                          type="text" 
                          required
                          value={formUnitType}
                          onChange={(e) => setFormUnitType(e.target.value)}
                          placeholder="e.g. Thousand, Crate, Million"
                          className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Initial Warehouse Stock Level</label>
                        <input 
                          type="number" 
                          value={formStockLevel}
                          onChange={(e) => setFormStockLevel(Number(e.target.value))}
                          className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none font-mono-custom"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Min Stock Low threshold Alert</label>
                        <input 
                          type="number" 
                          value={formMinStockThreshold}
                          onChange={(e) => setFormMinStockThreshold(Number(e.target.value))}
                          className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none font-mono-custom"
                        />
                      </div>

                    </div>
                  )}

                  {/* TAB 2: MOQ & VOLUME TIERS */}
                  {modalTab === 'moq' && (
                    <div className="space-y-5 animate-fade-in">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">Minimum Order Quantity (MOQ) *</label>
                          <input 
                            type="number" 
                            required
                            value={formMoq}
                            onChange={(e) => setFormMoq(Number(e.target.value))}
                            className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none font-mono-custom"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-semibold block">&nbsp;</label>
                          <span className="text-[11px] text-slate-450 block pt-3">
                            Orders below this volume threshold are automatically blocked inside customer portal.
                          </span>
                        </div>
                      </div>

                      {/* Volume Price Tiers Config */}
                      <div className="border border-industrial-800 rounded-xl p-4 bg-industrial-900 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-350 uppercase tracking-widest font-bold">Configure Discount Tiers</span>
                          <span className="text-[9px] text-brand-cyan font-mono-custom">Local-First Dynamic Price Engine</span>
                        </div>

                        {/* Add Tier Form */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase">Min Volume Quantity</label>
                            <input 
                              type="number" 
                              value={newVolumeQty}
                              onChange={(e) => setNewVolumeQty(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="e.g. 50000"
                              className="w-full text-[11px] p-2 rounded bg-industrial-950 border border-industrial-800 text-slate-200 font-mono-custom focus:outline-none focus:border-brand-cyan"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase">Unit Rate (INR)</label>
                            <input 
                              type="number" 
                              step="0.0001"
                              value={newVolumePrice}
                              onChange={(e) => setNewVolumePrice(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="e.g. 0.85"
                              className="w-full text-[11px] p-2 rounded bg-industrial-950 border border-industrial-800 text-slate-200 font-mono-custom focus:outline-none focus:border-brand-cyan"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={addVolumeTier}
                            className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-xs flex items-center justify-center gap-1 border border-slate-700 transition"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Append Tier
                          </button>
                        </div>

                        {/* Current Tiers List */}
                        <div className="space-y-1.5 pt-2">
                          <label className="text-[9px] text-slate-500 uppercase block">Active Discount Tiers Checklist ({formVolumePricing.length})</label>
                          {formVolumePricing.length === 0 ? (
                            <p className="text-[10px] text-slate-500 italic py-2">No volume pricing tiers configured. Base price will apply to all orders.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {formVolumePricing.map((tier, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs p-2 bg-industrial-950 rounded border border-industrial-800 font-mono-custom">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] bg-brand-cyan/15 text-brand-cyan py-0.5 px-1.5 rounded font-sans font-bold">Tier {idx+1}</span>
                                    <span>Quantity &ge; {tier.qty.toLocaleString()} units</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-brand-cyan">₹{tier.price.toFixed(4)}</span>
                                    <button 
                                      type="button"
                                      onClick={() => removeVolumeTier(idx)}
                                      className="text-red-500 hover:text-red-400 transition"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>

                    </div>
                  )}

                  {/* TAB 3: TECHNICAL SPECS */}
                  {modalTab === 'specs' && (
                    <div className="space-y-5 animate-fade-in">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">Material Composition</label>
                          <input 
                            type="text" 
                            value={formMaterial}
                            onChange={(e) => setFormMaterial(e.target.value)}
                            placeholder="e.g. Food Grade Polypropylene (PP)"
                            className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                          />
                        </div>

                        {/* Custom printing availability */}
                        <div className="flex items-center justify-between border border-industrial-800 p-2.5 rounded bg-industrial-900/60 mt-1">
                          <div>
                            <span className="text-[10px] font-bold text-slate-350 uppercase block">Custom Printing Compatibility</span>
                            <span className="text-[9px] text-slate-500">Enable brand graphic submissions</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormCustomPrinting(!formCustomPrinting)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors ${formCustomPrinting ? 'bg-brand-cyan' : 'bg-slate-800'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formCustomPrinting ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 border border-industrial-800 p-4 rounded-xl bg-industrial-900/40">
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold col-span-2 sm:col-span-4 border-b border-industrial-800 pb-1.5">Product Dimensions Model</span>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase">Height (mm)</label>
                            <input 
                              type="text" 
                              value={formHeight}
                              onChange={(e) => setFormHeight(e.target.value)}
                              placeholder="e.g. 50mm"
                              className="w-full text-[11px] p-2 rounded bg-industrial-950 border border-industrial-800 text-slate-200 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase">Top Diameter (mm)</label>
                            <input 
                              type="text" 
                              value={formTopDiameter}
                              onChange={(e) => setFormTopDiameter(e.target.value)}
                              placeholder="e.g. 70mm"
                              className="w-full text-[11px] p-2 rounded bg-industrial-950 border border-industrial-800 text-slate-200 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase">Bottom Diameter (mm)</label>
                            <input 
                              type="text" 
                              value={formBottomDiameter}
                              onChange={(e) => setFormBottomDiameter(e.target.value)}
                              placeholder="e.g. 50mm"
                              className="w-full text-[11px] p-2 rounded bg-industrial-950 border border-industrial-800 text-slate-200 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase">Unit Weight (g)</label>
                            <input 
                              type="text" 
                              value={formWeight}
                              onChange={(e) => setFormWeight(e.target.value)}
                              placeholder="e.g. 2.8g"
                              className="w-full text-[11px] p-2 rounded bg-industrial-950 border border-industrial-800 text-slate-200 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase">Length (mm)</label>
                            <input 
                              type="text" 
                              value={formLength}
                              onChange={(e) => setFormLength(e.target.value)}
                              placeholder="e.g. 93mm"
                              className="w-full text-[11px] p-2 rounded bg-industrial-950 border border-industrial-800 text-slate-200 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase">Width (mm)</label>
                            <input 
                              type="text" 
                              value={formWidth}
                              onChange={(e) => setFormWidth(e.target.value)}
                              placeholder="e.g. 10mm"
                              className="w-full text-[11px] p-2 rounded bg-industrial-950 border border-industrial-800 text-slate-200 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase">Thickness (mm)</label>
                            <input 
                              type="text" 
                              value={formThickness}
                              onChange={(e) => setFormThickness(e.target.value)}
                              placeholder="e.g. 2.0mm"
                              className="w-full text-[11px] p-2 rounded bg-industrial-950 border border-industrial-800 text-slate-200 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 uppercase">Sticks Count</label>
                            <input 
                              type="number" 
                              value={formSticks}
                              onChange={(e) => setFormSticks(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="e.g. 40"
                              className="w-full text-[11px] p-2 rounded bg-industrial-950 border border-industrial-800 text-slate-200 outline-none"
                            />
                          </div>

                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">Packaging Specifications Details</label>
                          <input 
                            type="text" 
                            value={formPackagingDetails}
                            onChange={(e) => setFormPackagingDetails(e.target.value)}
                            placeholder="e.g. 5,000 units per master carton, double shrink-wrapped"
                            className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">HS Code & Export Certifications</label>
                          <input 
                            type="text" 
                            value={formExportSpecifications}
                            onChange={(e) => setFormExportSpecifications(e.target.value)}
                            placeholder="e.g. HS Code: 39235010, certified FDA food grade"
                            className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                          />
                        </div>

                      </div>

                    </div>
                  )}

                  {/* TAB 4: MARKETING & TAGS */}
                  {modalTab === 'marketing' && (
                    <div className="space-y-5 animate-fade-in">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Featured boolean */}
                        <div className="flex items-center justify-between border border-industrial-800 p-4 rounded-xl bg-industrial-900/60">
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                            <div>
                              <span className="text-[10px] font-bold text-slate-350 uppercase block">Featured Spot</span>
                              <span className="text-[9px] text-slate-500">Showcase prominently on landing carousel</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormFeatured(!formFeatured)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors ${formFeatured ? 'bg-brand-cyan' : 'bg-slate-800'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formFeatured ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        {/* Trending boolean */}
                        <div className="flex items-center justify-between border border-industrial-800 p-4 rounded-xl bg-industrial-900/60">
                          <div className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-brand-orange fill-current" />
                            <div>
                              <span className="text-[10px] font-bold text-slate-350 uppercase block">Trending Tag</span>
                              <span className="text-[9px] text-slate-500">Highlight as fast-moving procurement item</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormTrending(!formTrending)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors ${formTrending ? 'bg-brand-cyan' : 'bg-slate-800'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formTrending ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        {/* Status Select */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">Active Catalog Status</label>
                          <select 
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value as any)}
                            className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                          >
                            <option value="active">Active (Visible)</option>
                            <option value="hidden">Hidden from buyer lists</option>
                            <option value="out_of_stock">Out of Stock</option>
                          </select>
                        </div>

                        {/* Tags Input */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-semibold">Search Engine Tags (Comma Separated)</label>
                          <input 
                            type="text" 
                            value={formTags}
                            onChange={(e) => setFormTags(e.target.value)}
                            placeholder="e.g. cups, ice cream, packaging, plastic"
                            className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                          />
                        </div>

                      </div>

                    </div>
                  )}

                </div>

              </div>

              {/* Right Column: Premium Sticky Simulated Image Uploader */}
              <div className="w-full md:w-64 space-y-4">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Product Asset Manager</span>
                
                {/* Dropzone frame */}
                <div 
                  onClick={simulateImageUpload}
                  className="border-2 border-dashed border-industrial-800 hover:border-brand-cyan/50 hover:bg-slate-900/40 p-6 rounded-2xl text-center cursor-pointer transition relative overflow-hidden group bg-slate-900/10 min-h-36 flex flex-col justify-center items-center"
                >
                  {uploadingProgress !== null ? (
                    <div className="w-full space-y-2.5">
                      <RefreshCw className="w-8 h-8 text-brand-cyan animate-spin mx-auto" />
                      <p className="text-[10px] text-slate-450">Uploading simulated assets...</p>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1">
                        <div className="bg-brand-cyan h-1 rounded-full transition-all duration-300" style={{ width: `${uploadingProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="w-8 h-8 text-slate-650 group-hover:text-brand-cyan group-hover:scale-105 transition duration-300 mx-auto" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-300">Drag files here, or click</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Bucket: "product-assets"</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thumbnails grid list */}
                <div className="space-y-2.5">
                  <label className="text-[9px] text-slate-500 uppercase block font-semibold">Active Thumbnails ({imageUrls.length})</label>
                  
                  {imageUrls.length === 0 ? (
                    <div className="p-4 border border-dashed border-industrial-800 rounded-xl text-center text-[10px] text-slate-500 italic bg-slate-900/5">
                      No assets linked yet. Simulated placeholders will apply on save.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {imageUrls.map((url, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-industrial-800 bg-slate-950 w-full pt-[100%]">
                          <img src={url} alt={`Preview ${idx}`} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200">
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="p-1 bg-red-650 hover:bg-red-500 text-white rounded transition"
                              title="Delete Image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>

            </form>

            {/* Modal Footer Controls */}
            <div className="bg-industrial-900 px-6 py-4 border-t border-industrial-800 flex justify-between gap-3">
              <span className="text-[10px] text-slate-500 italic flex items-center">
                * Required validation fields
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 rounded-lg text-xs font-bold text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSaveProduct}
                  className="px-5 py-2 bg-brand-cyan hover:bg-cyan-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider rounded-lg shadow-lg shadow-brand-cyan/5 transition cursor-pointer"
                >
                  Save Specifications
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ==================================================
// Password field with show/hide toggle
// ==================================================
interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

function PasswordInput({ className = '', ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={showPassword ? 'text' : 'password'}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition cursor-pointer"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ==================================================
// G. SECURE INDUSTRIAL GLASSMORPHIC LOGIN PORTAL
// ==================================================
interface LoginPortalProps {
  onLoginSuccess: (user: SystemUser) => void;
}

function LoginPortal({ onLoginSuccess }: LoginPortalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const user = db.authenticateUser(email, password);
      setIsLoading(false);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Access Denied: Invalid email or security password.');
      }
    }, 850);
  };

  const loadDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-industrial-950 bg-grid-pattern text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Ambient background glow points */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-cyan/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-orange/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Terminal Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-slate-900 border border-industrial-800 rounded-2xl shadow-inner mb-2">
            <Layers className="w-8 h-8 text-brand-cyan animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase leading-none">
            AMAR INDUSTRIES ERP
          </h1>
          <p className="text-[10px] tracking-widest text-brand-cyan uppercase font-bold font-mono-custom mt-1">
            EXECUTIVE CONTROL PORTAL
          </p>
        </div>

        {/* Premium Glass Card */}
        <div className="glass-panel-glow bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="border-b border-industrial-800 pb-4">
            <h2 className="text-sm font-extrabold uppercase text-slate-300 tracking-wider">Security Access Console</h2>
            <p className="text-[10px] text-slate-500 font-mono-custom mt-0.5">Please authorize active credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Terminal Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operations@amarsplints.com"
                className="w-full text-xs p-3 rounded-lg bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Terminal Security Password</label>
              <PasswordInput
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs p-3 rounded-lg bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none transition"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 font-mono-custom flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-bounce" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand-cyan hover:bg-cyan-400 disabled:bg-cyan-950 disabled:text-cyan-800 text-slate-950 text-xs font-black uppercase tracking-widest rounded-lg transition duration-200 shadow-lg shadow-brand-cyan/15 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying Identity...
                </>
              ) : (
                <>
                  <span>Initialize Terminal Session</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Dev Bypass list */}
          <div className="border-t border-industrial-800 pt-4 space-y-2.5">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block">Developer Bypass Accounts</span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => loadDemo('supervisor@amarsplints.com', 'super123')}
                className="py-2 bg-slate-900 border border-industrial-800 hover:border-slate-700 rounded-lg text-slate-300 text-left px-3 hover:text-white transition flex flex-col justify-center cursor-pointer"
              >
                <span className="font-bold text-xs text-brand-cyan leading-none">Rahul (Supervisor)</span>
                <span className="text-[8px] text-slate-500 font-mono-custom mt-1">super123</span>
              </button>
              <button
                type="button"
                onClick={() => loadDemo('admin@amarsplints.com', 'admin123')}
                className="py-2 bg-slate-900 border border-industrial-800 hover:border-slate-700 rounded-lg text-slate-300 text-left px-3 hover:text-white transition flex flex-col justify-center cursor-pointer"
              >
                <span className="font-bold text-xs text-brand-orange leading-none">Amarjit (Admin)</span>
                <span className="text-[8px] text-slate-500 font-mono-custom mt-1">admin123</span>
              </button>
            </div>
          </div>

        </div>

        <div className="text-center">
          <p className="text-[9px] text-slate-650 font-mono-custom">
            Secured Layer • AES-256 localMock Encrypted Session
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================================================
// H. STAFF DIRECTORY & PERSISTENT ROLE PRIVILEGES VIEW
// ==================================================
interface StaffManagementViewProps {
  currentUser: SystemUser;
  onStaffChange: () => void;
}

type StaffRole = 'supervisor' | 'admin';

type PendingStaffAction =
  | {
      type: 'add';
      targetName: string;
      payload: {
        fullName: string;
        email: string;
        password: string;
        role: StaffRole;
      };
    }
  | {
      type: 'delete' | 'promote';
      targetId: string;
      targetName: string;
    };

function StaffManagementView({ currentUser, onStaffChange }: StaffManagementViewProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form input bindings
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<StaffRole>('supervisor');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Security re-authentication states
  const [pendingAction, setPendingAction] = useState<PendingStaffAction | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    setUsers(db.getUsers().filter(u => u.role === 'admin' || u.role === 'supervisor'));
  }, [currentUser]);

  const refreshLocalState = () => {
    setUsers(db.getUsers().filter(u => u.role === 'admin' || u.role === 'supervisor'));
    onStaffChange();
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('All fields are mandatory to create active staff profiles.');
      return;
    }

    // Check duplicate email
    const duplicate = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (duplicate) {
      setErrorMsg('An operational account with this email address already exists.');
      return;
    }

    // Trigger Admin Password Re-authentication Modal
    setPendingAction({
      type: 'add',
      targetName: fullName,
      payload: { fullName, email, password, role }
    });
  };

  const handleDeleteStaffTrigger = (userId: string, name: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (userId === currentUser.id) {
      setErrorMsg('CRITICAL SECURITY LINT: Self-deletion of your logged-in administrator session is strictly blocked.');
      return;
    }

    // Trigger Admin Password Re-authentication Modal
    setPendingAction({
      type: 'delete',
      targetId: userId,
      targetName: name
    });
  };

  const handlePromoteTrigger = (userId: string, name: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Trigger Admin Password Re-authentication Modal
    setPendingAction({
      type: 'promote',
      targetId: userId,
      targetName: name
    });
  };

  const handleReauthConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError(null);

    // Verify against current administrator's active password
    if (confirmPassword !== currentUser.password) {
      setConfirmError('Re-authentication Failed: Invalid administrator terminal password.');
      return;
    }

    // Execute the authorized pending mutation
    if (pendingAction) {
      if (pendingAction.type === 'add') {
        const { fullName, email, password, role } = pendingAction.payload;
        db.createStaff({ fullName, email, password, role });
        setSuccessMsg(`Successfully registered ${fullName} as an authorized ${role}.`);
        
        // Reset form variables
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('supervisor');
        setIsModalOpen(false);
      } else if (pendingAction.type === 'delete') {
        const success = db.deleteStaff(pendingAction.targetId!, currentUser.id);
        if (success) {
          setSuccessMsg(`ERP terminal privileges revoked for staff member ${pendingAction.targetName}.`);
        } else {
          setErrorMsg('Staff removal operation failed.');
        }
      } else if (pendingAction.type === 'promote') {
        const success = db.promoteToAdmin(pendingAction.targetId!);
        if (success) {
          setSuccessMsg(`Elevated ${pendingAction.targetName} to ERP Administrator privileges successfully. Role synced.`);
        } else {
          setErrorMsg('Elevation privileges process encountered a mock database error.');
        }
      }
    }

    // Clear confirmation inputs and trigger hot updates
    setPendingAction(null);
    setConfirmPassword('');
    setConfirmError(null);
    refreshLocalState();

    // Auto close alerts
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 4000);
  };

  const totalSupervisors = users.filter(u => u.role === 'supervisor').length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Toast Notification Layers */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel-glow border-l-4 border-emerald-500 px-5 py-4 rounded-xl max-w-md shadow-2xl flex items-center justify-between gap-4 animate-slide-up bg-slate-900">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-bounce" />
            <p className="text-xs font-semibold text-slate-200">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel-glow border-l-4 border-red-500 px-5 py-4 rounded-xl max-w-md shadow-2xl flex items-center justify-between gap-4 animate-slide-up bg-slate-900">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
            <p className="text-xs font-semibold text-slate-200">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIEW HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-cyan animate-pulse" /> Enterprise Staff Directory
          </h3>
          <p className="text-xs text-slate-400">Configure authorization levels, create new supervisors, and elevate staff roles.</p>
        </div>
        <button
          onClick={() => { setErrorMsg(null); setSuccessMsg(null); setIsModalOpen(true); }}
          className="py-2.5 px-4 bg-brand-cyan hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-lg shadow-brand-cyan/10 transition duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Register Staff Member
        </button>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-xl bg-slate-900/30">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Total Staff Accounts</span>
          <h3 className="text-2xl font-extrabold text-white mt-1 font-mono-custom">{users.length}</h3>
        </div>
        <div className="glass-panel p-5 rounded-xl bg-slate-900/30">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Active Administrators</span>
          <h3 className="text-2xl font-extrabold text-brand-orange mt-1 font-mono-custom">{totalAdmins}</h3>
        </div>
        <div className="glass-panel p-5 rounded-xl bg-slate-900/30">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Operations Supervisors</span>
          <h3 className="text-2xl font-extrabold text-brand-cyan mt-1 font-mono-custom">{totalSupervisors}</h3>
        </div>
      </div>

      <EmailPreferences currentUser={currentUser} />

      {/* STAFF DIRECTORY TABLE GRID */}
      <div className="glass-panel rounded-xl overflow-hidden bg-slate-900/30 border border-industrial-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-industrial-900 border-b border-industrial-800 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
              <th className="p-4 pl-6">Employee Profile Name</th>
              <th className="p-4">Authorized Login Email</th>
              <th className="p-4">Privilege Clearance Role</th>
              <th className="p-4">Registered Date</th>
              <th className="p-4 text-right pr-6">Administrative Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-800">
            {users.map((staff) => {
              const isSelf = staff.id === currentUser.id;
              return (
                <tr key={staff.id} className="hover:bg-slate-850/15 transition">
                  <td className="p-4 pl-6 font-bold text-white">
                    {staff.fullName}
                    {isSelf && (
                      <span className="text-[8px] bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/35 px-1.5 py-0.5 rounded font-mono-custom uppercase font-black tracking-widest ml-2.5">
                        ACTIVE SESSION
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono-custom text-slate-350">{staff.email}</td>
                  <td className="p-4">
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                      staff.role === 'admin' 
                        ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/20' 
                        : 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20'
                    }`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="p-4 font-mono-custom text-slate-450">{new Date(staff.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex justify-end items-center gap-2">
                      
                      {/* ELEVATION BUTTON */}
                      {staff.role === 'supervisor' && (
                        <button
                          onClick={() => handlePromoteTrigger(staff.id, staff.fullName)}
                          className="px-2.5 py-1 bg-brand-orange/15 hover:bg-brand-orange/20 border border-brand-orange/25 text-brand-orange text-[10px] font-black uppercase tracking-wider rounded transition flex items-center gap-1 cursor-pointer"
                          title="Elevate privileges to Administrator"
                        >
                          <Sparkles className="w-3 h-3" /> Elevate to Admin
                        </button>
                      )}
                      
                      {/* REMOVE BUTTON */}
                      <button
                        onClick={() => handleDeleteStaffTrigger(staff.id, staff.fullName)}
                        disabled={isSelf}
                        className={`p-1.5 rounded transition border cursor-pointer ${
                          isSelf 
                            ? 'bg-slate-800/10 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-red-950/20 hover:bg-red-950/40 border-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-300'
                        }`}
                        title={isSelf ? "Self-deletion locked" : "Revoke employee access"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL DIALOG SHEET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-industrial-800 bg-slate-950">
            
            <div className="bg-industrial-900 px-6 py-4 border-b border-industrial-800 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-brand-cyan animate-pulse" /> Register Active Staff Account
                </h4>
                <p className="text-[10px] text-slate-500 font-mono-custom mt-0.5">Generate secure credentials for new personnel</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-semibold">Full Employee Name *</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-semibold">Assigned Security Email *</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh@amarsplints.com"
                  className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-semibold">Terminal Password *</label>
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Assign custom login password"
                  className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-semibold">Clearance privilege level *</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="w-full text-xs p-2.5 rounded bg-industrial-950 border border-industrial-800 text-slate-200 focus:border-brand-cyan outline-none"
                >
                  <option value="supervisor">Supervisor (Can accept inquiries & adjust inventory)</option>
                  <option value="admin">Administrator (Complete structural, product & user controls)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-industrial-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 rounded-lg text-xs font-bold text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-cyan hover:bg-cyan-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider rounded-lg shadow-lg shadow-brand-cyan/5 transition cursor-pointer"
                >
                  Save Profile Specs
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* SECURITY RE-AUTHENTICATION OVERLAY */}
      {pendingAction && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="glass-panel-glow bg-slate-950/95 border border-industrial-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col p-6 space-y-5">
            
            <div className="text-center space-y-2.5">
              <div className="inline-flex p-3 bg-red-950/20 border border-red-500/20 rounded-2xl text-brand-orange animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-widest">
                Administrative Authorization
              </h4>
              <p className="text-[10px] text-slate-500 font-mono-custom">
                Please confirm your active administrator password
              </p>
            </div>

            <div className="bg-industrial-900/60 p-3 rounded-lg border border-industrial-800 text-[10px] space-y-1">
              <span className="text-slate-500 uppercase block font-semibold">Clearance Operation</span>
              <p className="text-slate-350 leading-relaxed font-semibold">
                {pendingAction.type === 'add' && `Create supervisor/admin profile "${pendingAction.targetName}"`}
                {pendingAction.type === 'delete' && `Revoke access permissions for "${pendingAction.targetName}"`}
                {pendingAction.type === 'promote' && `Promote "${pendingAction.targetName}" to ERP Administrator role`}
              </p>
            </div>

            <form onSubmit={handleReauthConfirm} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-semibold">Administrator Password *</label>
                <PasswordInput
                  required
                  autoFocus
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Input password to verify credentials"
                  className="w-full text-xs p-3 rounded-lg bg-industrial-950 border border-industrial-850 text-slate-200 focus:border-brand-orange outline-none transition"
                />
              </div>

              {confirmError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-400 font-mono-custom">
                  {confirmError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setPendingAction(null); setConfirmPassword(''); setConfirmError(null); }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 rounded-lg text-xs font-bold text-slate-350 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-orange hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-lg shadow-brand-orange/15 transition cursor-pointer"
                >
                  Confirm Clearance
                </button>
              </div>
            </form>

          </div>
        </div>
      )}    </div>
  );
}
