import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  Inbox,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  ChevronDown,
  Factory,
  Box,
  Wrench,
  Users,
  TrendingUp,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import { api } from '../api/client';

export const Dashboard = ({ onOpenReceipt }) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'behavior'
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('auraframe_cached_analytics');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [showProfit, setShowProfit] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      if (!data) setLoading(true);
      const res = await api.getAnalytics({ timeframe: 'all' });
      if (res.success && res.data) {
        setData(res.data);
        localStorage.setItem('auraframe_cached_analytics', JSON.stringify(res.data));
      }
    } catch (error) {
      if (!data) {
        showToast('Failed to load analytics', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const lifetime = data?.lifetime || { revenue: 0, profit: 0, expense: 0, cogs: 0, recordedExpenses: 0 };
  const cashFlow = data?.cashFlow || { cashInHand: 0, lifetimeCashInflow: 0, lifetimeCashOutflow: 0, todayNetCash: 0 };
  const customOrders = data?.customOrders || { total: 0, totalValue: 0, totalCost: 0, totalProfit: 0 };
  const customOrdersFin = data?.customOrdersFinancials || {};
  const expenses = data?.expenses || { total: 0, cash: 0, upi: 0 };
  const assets = data?.assets || { stockRetailValue: 0, producedStockCost: 0, rawMaterialCost: 0, operatingToolsCost: 0 };
  const inventoryHealth = data?.inventoryHealth || { totalProducts: 0, totalInStockUnits: 0 };
  const totalInStock = data?.totalInStockUnits ?? inventoryHealth.totalInStockUnits ?? 0;
  const unitsSoldList = data?.unitsSoldTillDate || [];
  const daywiseList = data?.daywiseSalesSplit || [];
  const customerBehavior = data?.customerBehavior || { totalCustomers: 0, repeatRate: 0, avgCustomerLifetimeValue: 0, topCustomers: [] };

  // Calculate profit vs expense balance percentage for progress bar
  const totalFinancials = lifetime.profit + lifetime.expense;
  const profitPercentage = totalFinancials > 0 ? Math.round((Math.max(0, lifetime.profit) / totalFinancials) * 100) : 50;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 pb-32 space-y-5 text-white">
      {/* Top Toggle Switch */}
      <div className="p-1 rounded-2xl bg-[#151518] border border-zinc-800 flex items-center animate-card-in stagger-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          OVERVIEW & INVENTORY
        </button>

        <button
          onClick={() => setActiveTab('behavior')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'behavior'
              ? 'bg-white text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          CUSTOMER BEHAVIOR
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: OVERVIEW & INVENTORY
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div key="overview" className="space-y-4">
          {/* 1. Hero 2-Card Grid: LIFETIME REVENUE & LIVE IN-HAND CASH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1A. LIFETIME REVENUE (Lime Green Card) */}
            <div className="p-5 rounded-[28px] bg-[#d9f99d] text-zinc-950 shadow-xl flex flex-col justify-between min-h-[115px] animate-card-in stagger-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-800">
                  LIFETIME REVENUE
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/10 text-[9px] font-black text-zinc-900">
                  SALES + CUSTOM
                </span>
              </div>
              <div className="text-3xl font-black tracking-tight text-zinc-950 mt-2">
                {formatCurrency(lifetime.revenue)}
              </div>
            </div>

            {/* 1B. LIVE IN-HAND CASH (Dark Gold Card) */}
            <div className="p-5 rounded-[28px] bg-gradient-to-br from-[#1c1917] to-[#121215] border border-amber-500/40 text-white shadow-xl flex flex-col justify-between min-h-[115px] animate-card-in stagger-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    LIVE IN-HAND CASH
                  </span>
                </div>
                <span className="text-[9px] font-mono text-zinc-400">DRAWER</span>
              </div>
              <div className="text-3xl font-black tracking-tight text-white mt-2">
                {formatCurrency(cashFlow.cashInHand)}
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/60 mt-1">
                <span className="text-emerald-400 font-bold">+{formatCurrency(cashFlow.lifetimeCashInflow)} in</span>
                <span className="text-rose-400 font-bold">-{formatCurrency(cashFlow.lifetimeCashOutflow)} out</span>
              </div>
            </div>
          </div>

          {/* 2. Card: LIFETIME PROFIT vs LIFETIME EXPENSE with Balance Bar */}
          <div className="p-5 rounded-[28px] bg-[#151518] border border-zinc-800 space-y-3 shadow-lg animate-card-in stagger-3">
            <div className="flex items-center justify-between text-xs font-black">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-zinc-400 uppercase text-[10px]">NET BUSINESS PROFIT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 uppercase text-[10px]">TOTAL EXPENSE / COGS</span>
                <span className="w-2 h-2 rounded-full bg-[#ff5722]" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg sm:text-xl font-black text-emerald-400">
                {formatCurrency(lifetime.profit)}
              </div>
              <div className="text-lg sm:text-xl font-black text-[#ff5722]">
                {formatCurrency(lifetime.expense)}
              </div>
            </div>

            {/* Ratio Balance Progress Bar */}
            <div className="h-2 w-full rounded-full overflow-hidden bg-[#ff5722] flex">
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{ width: `${profitPercentage}%` }}
              />
            </div>
          </div>

          {/* 2B. CUSTOM ORDERS FINANCIALS CONTRIBUTION */}
          {customOrders.total > 0 && (
            <div className="p-4 rounded-2xl bg-[#151518] border border-zinc-800 flex items-center justify-between shadow-md animate-card-in stagger-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                  🎨
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Custom Orders Contribution</h4>
                  <p className="text-[10px] text-zinc-400">
                    {customOrders.total} orders • Cost: {formatCurrency(customOrders.totalCost || 0)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-amber-300 block">
                  {formatCurrency(customOrders.totalValue)} Rev
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  +{formatCurrency(customOrders.totalProfit || 0)} Profit
                </span>
              </div>
            </div>
          )}

          {/* 3. 2-Column Bento: TOTAL PRODUCTS & IN STOCK */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Total Products */}
            <div className="p-5 rounded-[28px] bg-[#151518] border border-zinc-800 flex flex-col justify-between h-36 shadow-lg animate-card-in stagger-4">
              <div className="w-9 h-9 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {inventoryHealth.totalProducts}
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-0.5">
                  TOTAL PRODUCTS
                </p>
              </div>
            </div>

            {/* In Stock Count */}
            <div className="p-5 rounded-[28px] bg-[#151518] border border-zinc-800 flex flex-col justify-between h-36 shadow-lg animate-card-in stagger-5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {totalInStock}
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-0.5">
                  IN STOCK
                </p>
              </div>
            </div>
          </div>

          {/* 4. UNITS SOLD (TILL DATE) Section */}
          <div className="p-5 rounded-[28px] bg-[#141417] border border-zinc-800/90 space-y-3.5 shadow-lg animate-card-in stagger-6">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-amber-400" />
              <h3 className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                UNITS SOLD (TILL DATE)
              </h3>
            </div>

            {unitsSoldList.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs">
                No items sold yet.
              </div>
            ) : (
              <div className="space-y-2">
                {unitsSoldList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{ animationDelay: `${200 + idx * 35}ms` }}
                    className="p-3.5 rounded-2xl bg-[#1c1c22] border border-zinc-800/80 flex items-center justify-between group transition-all animate-card-in"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center text-zinc-400 shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{item.category === 'frame' ? '🔲' : '🖼️'}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {item.name}
                        </h4>
                        <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                          {item.sku || `SKU-${9000 + idx}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <span className="text-xs font-black text-amber-400 block">
                          {item.qtySold} sold
                        </span>
                        <span className="text-xs font-semibold text-zinc-300">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. DAY-WISE SALES SPLIT Section */}
          <div className="p-5 rounded-[28px] bg-[#141417] border border-zinc-800/90 space-y-3.5 shadow-lg animate-card-in stagger-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  DAY-WISE SALES SPLIT
                </h3>
              </div>

              {/* Toggle Profit Visibility Button */}
              <button
                type="button"
                onClick={() => setShowProfit(!showProfit)}
                className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={showProfit ? 'Hide profit' : 'Show profit'}
              >
                {showProfit ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {daywiseList.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs">
                No daily sales records found.
              </div>
            ) : (
              <div className="space-y-2">
                {daywiseList.map((day, idx) => (
                  <div
                    key={day.date || idx}
                    style={{ animationDelay: `${230 + idx * 35}ms` }}
                    className="p-3.5 rounded-2xl bg-[#1c1c22] border border-zinc-800/80 flex items-center justify-between group transition-all animate-card-in"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                        <Clock className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {day.label}
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {day.unitsSold} units sold
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <span className="text-sm font-black text-emerald-400 block">
                          +{formatCurrency(day.revenue)}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          Profit: {showProfit ? formatCurrency(day.profit) : '••••'}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. STOCK RETAIL VALUE Card */}
          <div className="p-5 rounded-[28px] bg-[#151518] border border-zinc-800 flex items-center justify-between shadow-lg animate-card-in stagger-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                STOCK RETAIL VALUE
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {formatCurrency(assets.stockRetailValue)}
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
              POTENTIAL REV
            </span>
          </div>

          {/* 7. EXPENSE ALLOCATION & ASSETS */}
          <div className="space-y-2.5 animate-card-in stagger-9">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              EXPENSE ALLOCATION & ASSETS
            </h3>

            <div className="space-y-2.5">
              {/* Recorded Operating Expenses */}
              <div className="p-4 rounded-2xl bg-[#151518] border border-rose-500/30 flex items-center justify-between shadow-md animate-card-in stagger-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 rotate-180" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Recorded Store Expenses</h4>
                    <p className="text-[10px] text-zinc-400">Rent, utilities, materials & misc</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-rose-400 block">
                    {formatCurrency(expenses.total || 0)}
                  </span>
                  <span className="text-[9.5px] text-zinc-400 font-semibold">
                    💵 {formatCurrency(expenses.cash || 0)} • 📱 {formatCurrency(expenses.upi || 0)}
                  </span>
                </div>
              </div>

              {/* Produced Stock Cost */}
              <div className="p-4 rounded-2xl bg-[#151518] border border-zinc-800 flex items-center justify-between shadow-md animate-card-in stagger-11">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 flex items-center justify-center">
                    <Factory className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Produced Stock Cost</h4>
                    <p className="text-[10px] text-zinc-400">Finished goods current value</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-white">
                  {formatCurrency(assets.producedStockCost)}
                </span>
              </div>

              {/* Raw Material Cost */}
              <div className="p-4 rounded-2xl bg-[#151518] border border-zinc-800 flex items-center justify-between shadow-md animate-card-in stagger-12">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Raw Material Cost</h4>
                    <p className="text-[10px] text-zinc-400">Unused raw materials value</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-white">
                  {formatCurrency(assets.rawMaterialCost)}
                </span>
              </div>

              {/* Operating & Tools */}
              <div className="p-4 rounded-2xl bg-[#151518] border border-zinc-800 flex items-center justify-between shadow-md animate-card-in stagger-13">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Operating & Tools</h4>
                    <p className="text-[10px] text-zinc-400">Operational machinery & consumables</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-white">
                  {formatCurrency(assets.operatingToolsCost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: CUSTOMER BEHAVIOR
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'behavior' && (
        <div key="behavior" className="space-y-4">
          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#151518] border border-zinc-800 text-center shadow-lg animate-card-in stagger-2">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Customers</span>
              <div className="text-lg font-black text-white mt-0.5">
                {customerBehavior.totalCustomers}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#151518] border border-zinc-800 text-center shadow-lg animate-card-in stagger-3">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Repeat Rate</span>
              <div className="text-lg font-black text-amber-300 mt-0.5">
                {customerBehavior.repeatRate}%
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#151518] border border-zinc-800 text-center shadow-lg animate-card-in stagger-4">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Avg Lifetime</span>
              <div className="text-lg font-black text-emerald-400 mt-0.5">
                {formatCurrency(customerBehavior.avgCustomerLifetimeValue)}
              </div>
            </div>
          </div>

          {/* Top VIP Customers */}
          <div className="space-y-2.5 animate-card-in stagger-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              TOP VALUED CUSTOMERS
            </h3>

            <div className="space-y-2">
              {customerBehavior.topCustomers.map((c, idx) => {
                const cleanPhone = c.phone?.replace(/[^0-9]/g, '');
                const targetPhone = cleanPhone?.length === 10 ? `91${cleanPhone}` : cleanPhone;

                return (
                  <div
                    key={c._id}
                    style={{ animationDelay: `${150 + idx * 40}ms` }}
                    className="p-3.5 rounded-2xl bg-[#151518] border border-zinc-800 flex items-center justify-between shadow-md animate-card-in"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{c.name}</span>
                        <span className="text-[10px] text-zinc-400">{c.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-white block">
                          {formatCurrency(c.totalSpent)}
                        </span>
                        <span className="text-[10px] text-amber-400 font-semibold">
                          {c.orderCount || 1} orders
                        </span>
                      </div>

                      {targetPhone && (
                        <a
                          href={`https://wa.me/${targetPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

