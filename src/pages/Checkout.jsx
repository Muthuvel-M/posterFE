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
import { formatCurrency } from '../utils/formatters';
import { api } from '../api/client';

export const Checkout = ({
  customers = [],
  onCustomerCreated,
  onOpenAddProduct,
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
    setDiscount,
    setCustomer,
    clearCart,
    openPayModal,
  } = useCart();

  const { products, isSyncing, refreshCatalog } = useCatalog();
  const { showToast } = useToast();

  // Wizard Steps
  const [step, setStep] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('poster'); // 'poster' | 'frame' | 'sticker' | 'all'

  // Step 2 Form States
  const [custName, setCustName] = useState(customer?.name || '');
  const [custPhone, setCustPhone] = useState(customer?.phone || '');
  const [discountMode, setDiscountMode] = useState('flat'); // 'percent' | 'flat'
  const [discountValue, setDiscountValue] = useState(discount ? String(discount) : '');

  useEffect(() => {
    if (customer) {
      setCustName(customer.name || '');
      setCustPhone(customer.phone || '');
    }
  }, [customer]);

  const getCartItemQty = (productId) => {
    const found = cartItems.find((item) => item.product._id === productId);
    return found ? found.qty : 0;
  };

  const handleDiscountChange = (val, mode = discountMode) => {
    setDiscountValue(val);
    const num = Math.max(0, Number(val) || 0);

    if (mode === 'percent') {
      const calculated = Math.round((subtotal * Math.min(100, num)) / 100);
      setDiscount(calculated);
    } else {
      setDiscount(num);
    }
  };

  const handleToggleDiscountMode = (mode) => {
    setDiscountMode(mode);
    handleDiscountChange(discountValue, mode);
  };

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
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  New Sale
                </h1>
                <button
                  type="button"
                  onClick={fetchProducts}
                  className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Refresh catalog from database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
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
          {loading ? (
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
                    {/* Card Visual / Image Preview Container */}
                    <div className="relative w-full aspect-square bg-[#0e0e11] overflow-hidden flex items-center justify-center">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-center p-3">
                          <span className="text-5xl block mb-1 drop-shadow-md">
                            {p.emoji || (p.category === 'frame' ? '🔲' : p.category === 'sticker' ? '✨' : '🖼️')}
                          </span>
                        </div>
                      )}

                      {/* Top-Left Size / Category Badge */}
                      {p.size && (
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9.5px] font-black uppercase tracking-wider text-amber-300 shadow-sm">
                            {p.size}
                          </span>
                        </div>
                      )}

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
                            className="w-8 h-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20 group-hover:scale-105 active:scale-90 transition-all disabled:opacity-30 cursor-pointer"
                            title={`Add ${p.name}`}
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                          </button>
                        ) : (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 bg-amber-400 text-zinc-950 px-2 py-1 rounded-xl font-black text-xs shadow-md ring-1 ring-zinc-900 animate-scale-up"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(p._id, inCartQty - 1);
                              }}
                              className="w-5 h-5 rounded-lg hover:bg-black/15 flex items-center justify-center transition-colors cursor-pointer"
                              title="Decrease"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <span className="min-w-[16px] text-center font-black text-xs">{inCartQty}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(p._id, inCartQty + 1);
                              }}
                              className="w-5 h-5 rounded-lg hover:bg-black/15 flex items-center justify-center transition-colors cursor-pointer"
                              title="Add one more"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
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

          {/* Floating Bottom Subtotal Bar */}
          {itemCount > 0 && (
            <div className="fixed bottom-20 left-4 right-4 max-w-xl mx-auto z-30 animate-card-in">
              <div className="p-3.5 sm:p-4 rounded-3xl bg-[#151518]/95 backdrop-blur-xl border border-zinc-800 shadow-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
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
                      {formatCurrency(item.sellPrice)} × {item.qty} ({item.product.size || 'Standard'})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(item.sellPrice * item.qty)}
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
                  {formatCurrency(subtotal)}
                </span>
              </div>
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
                <span>%</span>
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

            <div>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={discountValue}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#151518] border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              />
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
