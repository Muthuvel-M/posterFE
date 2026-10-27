import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Package,
  Percent,
  Tag,
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, getProductInitial } from '../utils/formatters';
import { freeGroupKey, normalizeFreeOffer, paidQtyOf } from '../utils/freeOffer';
import { api } from '../api/client';

const PERCENT_DISCOUNTS = [
  { id: 5, label: '5%', percent: 5, minSubtotal: 200 },
  { id: 10, label: '10%', percent: 10, minSubtotal: 500 },
  { id: 15, label: '15%', percent: 15, minSubtotal: 1000 },
];

const FLAT_DISCOUNTS = [
  { id: 30, label: '₹30', amount: 30, minSubtotal: 400 },
  { id: 50, label: '₹50', amount: 50, minSubtotal: 700 },
  { id: 70, label: '₹70', amount: 70, minSubtotal: 900 },
];

export const Checkout = ({
  customers = [],
  onCustomerCreated,
  onOpenAddProduct,
  onNavigate,
}) => {
  const {
    cartItems,
    customer,
    discount,
    subtotal,
    total,
    itemCount,
    addToCart,
    removeFromCart,
    updateQty,
    setFreeQty,
    setDiscount,
    grossSubtotal,
    freeDiscount,
    setCustomer,
    clearCart,
    openPayModal,
  } = useCart();

  const { products, isSyncing, refreshCatalog, settings } = useCatalog();
  const freeOffer = normalizeFreeOffer(settings?.freeOffer);
  const { showToast } = useToast();

  // Wizard Steps
  const [step, setStep] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('poster'); // 'poster' | 'frame' | 'sticker' | 'all'

  // Step 2 Form States
  const [custName, setCustName] = useState(customer?.name || '');
  const [custPhone, setCustPhone] = useState(customer?.phone || '');
  const [discountMode, setDiscountMode] = useState('flat'); // 'percent' | 'flat'
  const [selectedChip, setSelectedChip] = useState(null);

  useEffect(() => {
    if (customer) {
      setCustName(customer.name || '');
      setCustPhone(customer.phone || '');
    }
  }, [customer]);

  useEffect(() => {
    if (selectedChip == null) return;
    const tiers = discountMode === 'percent' ? PERCENT_DISCOUNTS : FLAT_DISCOUNTS;
    const chip = tiers.find((tier) => tier.id === selectedChip);
    if (!chip || subtotal <= chip.minSubtotal) {
      setSelectedChip(null);
      setDiscount(0);
      return;
    }
    const next =
      discountMode === 'percent'
        ? Math.round((subtotal * chip.percent) / 100)
        : chip.amount;
    if (next !== discount) setDiscount(next);
  }, [subtotal, discountMode, selectedChip, discount, setDiscount]);

  const getCartItemQty = (productId) => {
    const found = cartItems.find((item) => item.product._id === productId);
    return found ? paidQtyOf(found) : 0;
  };

  const getCartFreeQty = (productId) => {
    const found = cartItems.find((item) => item.product._id === productId);
    return found ? Number(found.freeQty) || 0 : 0;
  };

  useEffect(() => {
    const paidByGroup = {};
    cartItems.forEach((item) => {
      const key = freeGroupKey(item);
      paidByGroup[key] = (paidByGroup[key] || 0) + paidQtyOf(item);
    });

    cartItems.forEach((item) => {
      const freeQty = Number(item.freeQty) || 0;
      if (!freeQty) return;
      const tier = freeOffer.tiers.find((entry) => entry.freeQty === freeQty);
      const groupPaid = paidByGroup[freeGroupKey(item)] || 0;
      if (!freeOffer.enabled || !tier || groupPaid < tier.buyQty) {
        setFreeQty(item.product._id, 0);
      }
    });
  }, [cartItems, freeOffer.enabled, settings?.freeOffer, setFreeQty]);

  const handleToggleDiscountMode = (mode) => {
    if (mode === discountMode) return;
    setDiscountMode(mode);
    setSelectedChip(null);
    setDiscount(0);
  };

  const handleSelectDiscountChip = (chip) => {
    if (subtotal <= chip.minSubtotal) return;
    if (selectedChip === chip.id) {
      setSelectedChip(null);
      setDiscount(0);
      return;
    }
    setSelectedChip(chip.id);
    const next =
      discountMode === 'percent'
        ? Math.round((subtotal * chip.percent) / 100)
        : chip.amount;
    setDiscount(next);
  };

  const pickFreeTarget = (items) =>
    [...items].sort((a, b) => {
      const paidDiff = paidQtyOf(b) - paidQtyOf(a);
      if (paidDiff !== 0) return paidDiff;
      return (Number(a.sellPrice) || 0) - (Number(b.sellPrice) || 0);
    })[0];

  const handleFreeChip = (group, tier) => {
    const appliedFree = group.items.reduce((sum, item) => sum + (Number(item.freeQty) || 0), 0);
    if (appliedFree === tier.freeQty) {
      group.items.forEach((item) => {
        if (item.freeQty) setFreeQty(item.product._id, 0);
      });
      return;
    }

    const target = pickFreeTarget(group.items);
    if (!target) return;
    if (paidQtyOf(target) + tier.freeQty > target.product.stock) {
      showToast('Not enough stock to add the free pieces', 'error');
      return;
    }

    group.items.forEach((item) => {
      if (item.product._id !== target.product._id && item.freeQty) {
        setFreeQty(item.product._id, 0);
      }
    });
    setFreeQty(target.product._id, tier.freeQty);
  };

  const freeGroups = [];
  const freeGroupIndex = {};
  cartItems.forEach((item) => {
    const key = freeGroupKey(item);
    if (freeGroupIndex[key] == null) {
      freeGroupIndex[key] = freeGroups.length;
      freeGroups.push({
        key,
        size: item.product.size || 'Standard',
        category: item.product.category || 'poster',
        items: [],
        paid: 0,
      });
    }
    const group = freeGroups[freeGroupIndex[key]];
    group.items.push(item);
    group.paid += paidQtyOf(item);
  });

  const handleProceedToReview = () => {
    if (cartItems.length === 0) {
      showToast('Please select at least one item', 'error');
      return;
    }
    setStep(2);
  };

  const handleGenerateUPIQR = () => {
    if (custName.trim() || custPhone.trim()) {
      setCustomer({
        name: custName.trim() || 'Walk-in Customer',
        phone: custPhone.trim(),
      });
    }
    openPayModal();
  };

  const filteredProducts = products.filter((p) => {
    if (!categoryFilter || categoryFilter === 'all') return true;
    return p.category?.toLowerCase() === categoryFilter.toLowerCase();
  });

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 pb-32 text-white">
      {/* ─────────────────────────────────────────────────────────────
          STEP 1: PRODUCT SELECTION (POS Screen with Real Inventory Products)
         ───────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div key="step1" className="space-y-4">
          {/* Top Header & Progress Bar */}
          <div className="animate-card-in stagger-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('home')}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Back to Home"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  New Sale
                </h1>
                <button
                  type="button"
                  onClick={() => refreshCatalog(true)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Refresh catalog from database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {onOpenAddProduct && (
                  <button
                    onClick={onOpenAddProduct}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                )}
                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors ml-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4-Segment Progress Bar (Step 1 Active in Yellow Gold) */}
            <div className="grid grid-cols-4 gap-1.5 h-1 w-full rounded-full overflow-hidden bg-zinc-800">
              <div className="bg-amber-400 h-full rounded-full" />
              <div className="bg-zinc-800 h-full" />
              <div className="bg-zinc-800 h-full" />
              <div className="bg-zinc-800 h-full" />
            </div>
          </div>

          {/* Category Tabs (Posters, Frames, Stickers, All) */}
          <div className="flex items-center gap-2 animate-card-in stagger-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('poster')}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                categoryFilter === 'poster'
                  ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                  : 'bg-[#151518] text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              🖼️ Posters
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('frame')}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                categoryFilter === 'frame'
                  ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                  : 'bg-[#151518] text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              🔲 Frames
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('sticker')}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                categoryFilter === 'sticker'
                  ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                  : 'bg-[#151518] text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              ✨ Stickers
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                  : 'bg-[#151518] text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              All
            </button>
          </div>

          {/* Product Cards Grid */}
          {isSyncing && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-3.5 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-56 rounded-2xl bg-[#151518] border border-zinc-800/40" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-[#151518] border border-zinc-800/80 flex flex-col items-center gap-3 animate-card-in stagger-3">
              <Package className="w-8 h-8 text-zinc-600" />
              <div>
                <p className="text-xs font-bold text-zinc-300">No products found in this category</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Add items to your Inventory to start selling
                </p>
              </div>
              {onOpenAddProduct && (
                <button
                  onClick={onOpenAddProduct}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              )}
            </div>
          ) : (
            <div key={categoryFilter} className="grid grid-cols-2 gap-3 sm:gap-3.5 animate-card-in stagger-3">
              {filteredProducts.map((p, idx) => {
                const inCartQty = getCartItemQty(p._id);
                const freeQty = getCartFreeQty(p._id);
                const isOutOfStock = p.stock <= 0;

                return (
                  <div
                    key={p._id}
                    onClick={() => {
                      if (!isOutOfStock && inCartQty === 0) {
                        addToCart(p);
                      }
                    }}
                    style={{ animationDelay: `${50 + idx * 30}ms` }}
                    className={`rounded-2xl sm:rounded-[22px] overflow-hidden transition-all duration-200 flex flex-col justify-between cursor-pointer select-none group active:scale-[0.98] shadow-md ${
                      isOutOfStock
                        ? 'opacity-50 grayscale-[40%] cursor-not-allowed bg-[#141417] border border-zinc-800/40'
                        : inCartQty > 0
                        ? 'bg-[#16161a] border border-amber-400/90 shadow-sm'
                        : 'bg-[#16161a] hover:bg-[#1b1b22] border border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    {/* Card Visual — size / sticker initial (no product image) */}
                    <div className="relative w-full aspect-square bg-[#0e0e11] overflow-hidden flex items-center justify-center">
                      <span
                        className={`font-black tracking-tight select-none group-hover:scale-105 transition-transform duration-300 ${
                          getProductInitial(p).length <= 2
                            ? 'text-5xl sm:text-6xl'
                            : 'text-4xl sm:text-5xl'
                        } ${
                          p.category === 'sticker'
                            ? 'text-fuchsia-300'
                            : p.category === 'frame'
                            ? 'text-sky-300'
                            : 'text-amber-300'
                        }`}
                      >
                        {getProductInitial(p)}
                      </span>

                      {/* Top-Right Action: (+) Add Button vs Interactive ([-] Qty [+]) Stepper */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        {inCartQty === 0 ? (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                            className="w-11 h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20 group-hover:scale-105 active:scale-90 transition-all disabled:opacity-30 cursor-pointer"
                            title={`Add ${p.name}`}
                          >
                            <Plus className="w-6 h-6 stroke-[3]" />
                          </button>
                        ) : (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 bg-amber-400 text-zinc-950 px-1 py-1 rounded-2xl font-black text-sm shadow-md ring-1 ring-zinc-900 animate-scale-up"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(p._id, inCartQty - 1);
                              }}
                              className="w-11 h-11 rounded-xl hover:bg-black/15 flex items-center justify-center transition-colors cursor-pointer"
                              title="Decrease"
                            >
                              <Minus className="w-6 h-6 stroke-[3]" />
                            </button>
                            <span className="min-w-[20px] text-center font-black text-sm">{inCartQty}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(p._id, inCartQty + 1);
                              }}
                              className="w-11 h-11 rounded-xl hover:bg-black/15 flex items-center justify-center transition-colors cursor-pointer"
                              title="Add one more"
                            >
                              <Plus className="w-6 h-6 stroke-[3]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info Footer */}
                    <div className="p-3 sm:p-3.5 space-y-1 bg-[#121215]/90 border-t border-zinc-800/60">
                      <h3 className="text-xs sm:text-[13px] font-extrabold text-white truncate group-hover:text-amber-300 transition-colors">
                        {p.name}
                      </h3>
                      {freeQty > 0 && (
                        <p className="text-[10px] font-bold text-emerald-400">+{freeQty} free</p>
                      )}

                      <div className="flex items-baseline justify-between pt-0.5">
                        <span className="text-sm sm:text-base font-black text-amber-400 tracking-tight">
                          {formatCurrency(p.sellPrice)}
                        </span>
                        {p.size && (
                          <span className="text-[10px] text-zinc-400 font-semibold">{p.size}</span>
                        )}
                      </div>

                      <p
                        className={`text-[9.5px] font-bold flex items-center gap-1 ${
                          isOutOfStock
                            ? 'text-rose-400'
                            : p.stock <= (p.lowStockThreshold || 5)
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-400'
                              : p.stock <= (p.lowStockThreshold || 5)
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        ></span>
                        {isOutOfStock
                          ? 'Out of stock'
                          : p.stock <= (p.lowStockThreshold || 5)
                          ? `Only ${p.stock} left`
                          : `${p.stock} in stock`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Bottom Subtotal Bar — BottomNav hidden on checkout */}
          {itemCount > 0 && (
            <div className="fixed above-safe-bottom left-4 right-4 max-w-xl mx-auto z-30 animate-card-in">
              <div className="p-3.5 sm:p-4 rounded-3xl bg-[#151518]/95 backdrop-blur-xl border border-zinc-800 shadow-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
                    {freeDiscount > 0 ? ' · free applied' : ''}
                  </span>
                  <div className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Subtotal: {formatCurrency(subtotal)}
                  </div>
                </div>

                <button
                  onClick={handleProceedToReview}
                  className="py-3 px-5 rounded-2xl bg-[#f59e0b] hover:bg-[#d97706] text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Review Order</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 2: CHECKOUT REVIEW ORDER
         ───────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div key="step2" className="space-y-4">
          {/* Top Header & Progress Bar */}
          <div className="animate-card-in stagger-1">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Products</span>
              </button>
              <h1 className="text-lg sm:text-xl font-black text-white">Checkout</h1>
            </div>

            {/* Progress Bar (Step 1 Done Green, Step 2 Active Yellow) */}
            <div className="grid grid-cols-4 gap-1.5 h-1 w-full rounded-full overflow-hidden bg-zinc-800">
              <div className="bg-emerald-400 h-full rounded-full" />
              <div className="bg-amber-400 h-full rounded-full" />
              <div className="bg-zinc-800 h-full" />
              <div className="bg-zinc-800 h-full" />
            </div>
          </div>

          {/* Card 1: ORDER SUMMARY */}
          <div className="p-5 rounded-3xl bg-[#1a1b22] border border-zinc-800 space-y-3 shadow-xl animate-card-in stagger-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                ORDER SUMMARY
              </span>
              <span className="text-xs font-bold text-zinc-400">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-zinc-800/80 max-h-56 overflow-y-auto no-scrollbar">
              {cartItems.map((item) => (
                <div
                  key={item.product._id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{item.product.name}</p>
                    <p className="text-[11px] text-zinc-400">
                      {formatCurrency(item.sellPrice)} × {paidQtyOf(item)}
                      {(item.freeQty || 0) > 0 ? ` + ${item.freeQty} free` : ''} ({item.product.size || 'Standard'})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(item.sellPrice * paidQtyOf(item))}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product._id)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-800/80 space-y-1 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-white">
                  {formatCurrency(grossSubtotal)}
                </span>
              </div>
              {freeDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Free</span>
                  <span className="font-mono">-{formatCurrency(freeDiscount)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Discount</span>
                  <span className="font-mono">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-white pt-1">
                <span>Total Amount</span>
                <span className="font-mono text-emerald-400">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: CUSTOMER (OPTIONAL) */}
          <div className="p-5 rounded-3xl bg-[#1a1b22] border border-zinc-800 space-y-3 shadow-xl animate-card-in stagger-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
              CUSTOMER (OPTIONAL)
            </span>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                placeholder="Walk-in Customer"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#151518] border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                WhatsApp Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#151518] border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              />
            </div>
          </div>

          {freeOffer.enabled && freeGroups.some((group) => group.paid >= 5) && (
            <div className="p-5 rounded-3xl bg-[#1a1b22] border border-zinc-800 space-y-3 shadow-xl animate-card-in stagger-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                Free offer
              </span>
              {freeGroups.filter((group) => group.paid >= 5).map((group) => (
                <div key={group.key} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-white uppercase">
                      {group.size} {group.category}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-400">
                      {group.paid} paid
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {freeOffer.tiers.map((tier, tierIndex) => {
                      const target = pickFreeTarget(group.items);
                      const stockOk = target
                        && paidQtyOf(target) + tier.freeQty <= target.product.stock;
                      const eligible = group.paid >= tier.buyQty && stockOk;
                      const appliedFree = group.items.reduce(
                        (sum, item) => sum + (Number(item.freeQty) || 0),
                        0
                      );
                      const selected = appliedFree === tier.freeQty;
                      return (
                        <button
                          key={`${group.key}-${tierIndex}`}
                          type="button"
                          disabled={!eligible && !selected}
                          onClick={() => (eligible || selected ? handleFreeChip(group, tier) : undefined)}
                          title={
                            eligible || selected
                              ? `Buy ${tier.buyQty}, get ${tier.freeQty} free`
                              : `Needs ${tier.buyQty} paid ${group.size}`
                          }
                          className={`py-3 px-2 rounded-xl text-xs font-black transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 ${
                            selected
                              ? 'bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-400/20'
                              : 'bg-[#151518] text-zinc-300 border border-zinc-800 hover:text-white'
                          }`}
                        >
                          <span className="block">{tier.freeQty} free</span>
                          <span className={`block text-[10px] font-semibold mt-0.5 ${selected ? 'text-zinc-800' : 'text-zinc-500'}`}>
                            buy {tier.buyQty}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Card 3: DISCOUNT */}
          <div className="p-5 rounded-3xl bg-[#1a1b22] border border-zinc-800 space-y-3 shadow-xl animate-card-in stagger-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
              DISCOUNT
            </span>

            {/* Toggle % Percent vs ₹ Flat */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleDiscountMode('percent')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${discountMode === 'percent'
                    ? 'bg-[#2a281c] border border-amber-400/80 text-amber-300'
                    : 'bg-[#151518] text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
              >
                <span>% Percent</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleDiscountMode('flat')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${discountMode === 'flat'
                    ? 'bg-[#2a281c] border border-amber-400/80 text-amber-300'
                    : 'bg-[#151518] text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>₹ Flat</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(discountMode === 'percent' ? PERCENT_DISCOUNTS : FLAT_DISCOUNTS).map((chip) => {
                const eligible = subtotal > chip.minSubtotal;
                const selected = selectedChip === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    disabled={!eligible}
                    onClick={() => handleSelectDiscountChip(chip)}
                    title={
                      eligible
                        ? `Apply ${chip.label}`
                        : `Available above ₹${chip.minSubtotal}`
                    }
                    className={`py-3 px-2 rounded-xl text-xs font-black transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 ${
                      selected
                        ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                        : 'bg-[#151518] text-zinc-300 border border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span className="block">{chip.label}</span>
                    <span className={`block text-[10px] font-semibold mt-0.5 ${selected ? 'text-zinc-800' : 'text-zinc-500'}`}>
                      above ₹{chip.minSubtotal}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Button: Pay with UPI -> */}
          <div className="pt-2 animate-card-in stagger-5">
            <button
              onClick={handleGenerateUPIQR}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <QrCode className="w-5 h-5 stroke-[2.5]" />
              <span>Pay with UPI ({formatCurrency(total)})</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
