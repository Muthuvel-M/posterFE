import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Package,
  QrCode,
  ArrowRight,
  Sparkles,
  Check,
  AlertTriangle,
  ChevronRight,
  IndianRupee,
  Calendar,
  Box,
  Palette,
} from 'lucide-react';
import { InstagramIcon } from '../components/InstagramIcon';
import { useCatalog } from '../context/CatalogContext';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { api } from '../api/client';

export const HomeBento = ({
  user,
  onNavigate,
  onOpenAddProduct,
  onOpenRawMaterial,
  onOpenInstantQR,
  onOpenReceipt,
  onOpenInstagramQR,
}) => {
  const { products, todaySummary, recentSales, isSyncing, refreshCatalog } = useCatalog();
  const [customStats, setCustomStats] = useState({ total: 0, inProduction: 0, readyForPickup: 0 });

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const activeProductsCount = products.length;
  const lowStockCount = products.filter((p) => (p.stock || 0) <= (p.lowStockThreshold ?? 10)).length;

  const userName = user?.name || 'Muthuvel M';

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 pb-32 space-y-6 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between animate-card-in stagger-1">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-0.5">
            {getGreeting()}
          </span>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              {userName}
            </h1>
          </div>
        </div>

        {/* Instagram Squircle Button (Opens Instagram QR Modal) */}
        <button
          onClick={onOpenInstagramQR}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-lg shadow-pink-500/20 ring-2 ring-zinc-800 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="View Instagram Profile QR"
          aria-label="View Instagram Profile QR"
        >
          <InstagramIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Section: BENTO ACTIONS */}
      <div className="space-y-2.5">
        {/* <h2 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 animate-card-in stagger-2">
          BENTO ACTIONS
        </h2> */}

        {/* 2x2 Bento Action Grid - Compact Sleek Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* 1. RAW MATERIAL (Lime Card) */}
          <div
            onClick={onOpenRawMaterial}
            className="p-3.5 rounded-2xl bg-[#d9f99d] hover:bg-[#bef264] text-zinc-950 flex flex-col justify-between h-28 sm:h-30 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all group animate-card-in stagger-3"
          >
            <div className="flex items-start justify-between">
              <span className="px-2 py-0.5 rounded-full bg-black/10 text-[8.5px] font-extrabold uppercase tracking-wider text-zinc-900">
                STOCK INTAKE
              </span>
              <Box className="w-4.5 h-4.5 text-zinc-950 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-zinc-950 leading-tight">
                RAW MATERIAL
              </h3>
              <p className="text-[10px] font-semibold text-zinc-800 mt-0.5">
                Posters & frames stock
              </p>
            </div>
          </div>

          {/* 2. ANALYTICS (Coral/Orange Card) */}
          <div
            onClick={() => onNavigate('dashboard')}
            className="p-3.5 rounded-2xl bg-[#ff5722] hover:bg-[#f4511e] text-white flex flex-col justify-between h-28 sm:h-30 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all group animate-card-in stagger-4"
          >
            <div className="flex items-start justify-between">
              <span className="px-2 py-0.5 rounded-full bg-black/20 text-[8.5px] font-extrabold uppercase tracking-wider text-white/90">
                INSIGHTS
              </span>
              <TrendingUp className="w-4.5 h-4.5 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-tight">
                ANALYTICS
              </h3>
              <p className="text-[10px] font-semibold text-white/90 mt-0.5">
                Growth & metrics
              </p>
            </div>
          </div>

          {/* 3. CUSTOMERS (Yellow Card) */}
          <div
            onClick={() => onNavigate('customers')}
            className="p-3.5 rounded-2xl bg-[#fde047] hover:bg-[#facc15] text-zinc-950 flex flex-col justify-between h-28 sm:h-30 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all group animate-card-in stagger-5"
          >
            <div className="flex items-start justify-between">
              <span className="px-2 py-0.5 rounded-full bg-black/10 text-[8.5px] font-extrabold uppercase tracking-wider text-zinc-900">
                DIRECTORY
              </span>
              <Users className="w-4.5 h-4.5 text-zinc-950 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-zinc-950 leading-tight">
                CUSTOMERS
              </h3>
              <p className="text-[10px] font-semibold text-zinc-800 mt-0.5">
                CRM profiles
              </p>
            </div>
          </div>

          {/* 4. ADD PRODUCT (White Card) */}
          <div
            onClick={onOpenAddProduct}
            className="p-3.5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 flex flex-col justify-between h-28 sm:h-30 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all group animate-card-in stagger-6"
          >
            <div className="flex items-start justify-between">
              <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-[8.5px] font-extrabold uppercase tracking-wider text-zinc-600">
                INVENTORY
              </span>
              <Package className="w-4.5 h-4.5 text-zinc-950 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-zinc-950 leading-tight">
                ADD PRODUCT
              </h3>
              <p className="text-[10px] font-semibold text-zinc-600 mt-0.5">
                Catalog stock
              </p>
            </div>
          </div>
        </div>

        {/* Wide Card 1: CUSTOM ORDERS & FRAMING */}
        <div
          onClick={() => onNavigate('customization')}
          className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#854d0e] via-[#a16207] to-[#ca8a04] hover:from-[#a16207] hover:to-[#eab308] text-white flex items-center justify-between gap-3 cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all group animate-card-in stagger-7"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/30 text-amber-300 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black tracking-tight text-white">
                  CUSTOM ORDERS
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase bg-white/20 text-white border border-white/30">
                  {customStats.total || 0} ORDERS
                </span>
              </div>
              <p className="text-[11px] text-white/80 mt-0.5 line-clamp-1">
                Collect custom poster & frame specs, photos & advance deposits
              </p>
            </div>
          </div>

          <div className="w-7 h-7 rounded-full bg-black/20 group-hover:bg-black/30 flex items-center justify-center text-white shrink-0 transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Wide Card 2: INSTANT UPI QR */}
        <div
          onClick={onOpenInstantQR}
          className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/95 hover:bg-zinc-900 border border-zinc-800/80 flex items-center justify-between gap-3 cursor-pointer shadow-md hover:border-zinc-700 transition-all group animate-card-in stagger-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-zinc-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black tracking-tight text-white">
                  INSTANT UPI QR
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  FAST
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                Show static QR with no amount input for quick scanning
              </p>
            </div>
          </div>

          <div className="w-7 h-7 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center text-zinc-300 group-hover:text-white shrink-0 transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Section: RECENT SALES */}
      <div className="space-y-2 animate-card-in stagger-9">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
            RECENT SALES
          </h2>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            <span>See all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 min-h-[90px] flex items-center justify-center shadow-md">
          {recentSales.length === 0 ? (
            <p className="text-xs font-semibold text-zinc-500 text-center">
              No sales recorded yet. Start selling!
            </p>
          ) : (
            <div className="w-full space-y-2">
              {recentSales.slice(0, 3).map((sale, idx) => (
                <div
                  key={sale._id}
                  onClick={() => onOpenReceipt && onOpenReceipt(sale)}
                  style={{ animationDelay: `${250 + idx * 40}ms` }}
                  className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/60 cursor-pointer transition-colors animate-card-in"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center text-[9px] font-mono font-bold">
                      AF
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {sale.customerSnapshot?.name || 'Walk-in Customer'}
                      </span>
                      <span className="text-[9.5px] text-zinc-400">
                        {formatDateTime(sale.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-amber-300 block">
                      {formatCurrency(sale.total)}
                    </span>
                    <span className="text-[8.5px] uppercase font-bold text-zinc-400">
                      {sale.paymentMethod}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section: CATALOG & LOW STOCK Live Counter Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Catalog Card (White) */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-3.5 rounded-2xl bg-white text-zinc-950 flex flex-col justify-between h-26 sm:h-28 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all animate-card-in stagger-9"
        >
          <div className="flex items-start justify-between">
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-[8.5px] font-extrabold uppercase tracking-wider text-zinc-600">
              CATALOG
            </span>
            <Package className="w-4.5 h-4.5 text-zinc-950" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-zinc-950">
              {activeProductsCount}
            </div>
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 mt-0.5">
              ACTIVE PRODUCTS
            </p>
          </div>
        </div>

        {/* Low Stock Card (Coral/Orange) */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-3.5 rounded-2xl bg-[#ff5722] text-white flex flex-col justify-between h-26 sm:h-28 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all animate-card-in stagger-10"
        >
          <div className="flex items-start justify-between">
            <span className="px-2 py-0.5 rounded-full bg-black/20 text-[8.5px] font-extrabold uppercase tracking-wider text-white/90">
              LOW STOCK
            </span>
            <Package className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-white">
              {lowStockCount}
            </div>
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-white/90 mt-0.5 flex items-center gap-1">
              {lowStockCount === 0 ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400 stroke-[3]" /> HEALTHY
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-300 inline" /> REQUIRES RESTOCK
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Section: REVENUE OVERVIEW */}
      <div className="space-y-2 animate-card-in stagger-11">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
          REVENUE OVERVIEW
        </h2>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 grid grid-cols-3 gap-2 text-center shadow-md">
          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <span className="text-[9.5px] uppercase font-bold text-zinc-400 block">Today</span>
            <div className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
              {formatCurrency(todaySummary.revenue)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <span className="text-[9.5px] uppercase font-bold text-zinc-400 block">Profit</span>
            <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5">
              {formatCurrency(todaySummary.profit)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <span className="text-[9.5px] uppercase font-bold text-zinc-400 block">Orders</span>
            <div className="text-sm sm:text-base font-black text-white mt-0.5">
              {todaySummary.count}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
