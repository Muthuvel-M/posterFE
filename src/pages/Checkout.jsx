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
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import { api } from '../api/client';

export const Checkout = ({
  catalogVersion,
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

  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1 = Product Selection ('New Sale'), 2 = Checkout Review ('Checkout')
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('poster'); // 'poster' | 'frame' | 'sticker'
  const [sizeFilter, setSizeFilter] = useState('all'); // 'all' | 'A4' | 'A5' | 'A6'

  // Step 2 Form States
  const [custName, setCustName] = useState(customer?.name || '');
  const [custPhone, setCustPhone] = useState(customer?.phone || '');
  const [discountMode, setDiscountMode] = useState('flat'); // 'percent' | 'flat'
  const [discountValue, setDiscountValue] = useState(discount ? String(discount) : '');

  useEffect(() => {
    fetchProducts();
  }, [catalogVersion]);

  useEffect(() => {
    if (customer) {
      setCustName(customer.name || '');
      setCustPhone(customer.phone || '');
    }
  }, [customer]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts({ active: 'true' });
      if (res.success) {
        setProducts(res.data);
      }
    } catch (error) {
      showToast('Failed to load live product catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to ensure or get a valid sticker product (₹15 or ₹30)
  const handleQuickAddSticker = async (priceTier) => {
    const existing = products.find(
      (p) =>
        p.category?.toLowerCase() === 'sticker' &&
        (Number(p.sellPrice) === priceTier || p.size === `₹${priceTier}` || p.name.includes(String(priceTier)))
    );

    if (existing) {
      addToCart(existing);
      return;
    }

    // Auto-create on demand in database if not found so it gets a valid DB ID
    try {
      const is15 = priceTier === 15;
      const newStickerPayload = {
        name: is15 ? '₹15 Small Sticker' : '₹30 Premium Sticker',
        category: 'sticker',
        size: `₹${priceTier}`,
        sellPrice: priceTier,
        costPrice: is15 ? 5 : 10,
        stock: 100,
        lowStockThreshold: 15,
        emoji: is15 ? '✨' : '🌟',
        active: true,
      };

      const res = await api.createProduct(newStickerPayload);
      if (res.success && res.data) {
        setProducts((prev) => [res.data, ...prev]);
        addToCart(res.data);
      }
    } catch (err) {
      // Fallback local addition if network fails
      const fallbackProd = {
        _id: `temp-stk-${priceTier}`,
        name: `₹${priceTier} Sticker`,
        category: 'sticker',
        size: `₹${priceTier}`,
        sellPrice: priceTier,
        costPrice: priceTier === 15 ? 5 : 10,
        stock: 100,
        emoji: priceTier === 15 ? '✨' : '🌟',
      };
      addToCart(fallbackProd);
    }
  };

  const getCartItemQty = (productId) => {
    const found = cartItems.find((item) => item.product._id === productId);
    return found ? found.qty : 0;
  };

  // Find ₹15 and ₹30 products for quick badge state
  const sticker15Product = products.find(
    (p) =>
      p.category?.toLowerCase() === 'sticker' &&
      (Number(p.sellPrice) === 15 || p.size === '₹15' || p.name.includes('15'))
  );
  const sticker30Product = products.find(
    (p) =>
      p.category?.toLowerCase() === 'sticker' &&
      (Number(p.sellPrice) === 30 || p.size === '₹30' || p.name.includes('30'))
  );

  const sticker15Qty = sticker15Product
    ? getCartItemQty(sticker15Product._id)
    : cartItems.find((i) => i.product.category === 'sticker' && i.sellPrice === 15)?.qty || 0;

  const sticker30Qty = sticker30Product
    ? getCartItemQty(sticker30Product._id)
    : cartItems.find((i) => i.product.category === 'sticker' && i.sellPrice === 30)?.qty || 0;

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
      showToast('Please select at least one poster or frame', 'error');
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
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      (p.category && p.category.toLowerCase().includes(query)) ||
      (p.size && p.size.toLowerCase().includes(query));

    const matchesCat =
      categoryFilter === 'all' ||
      (p.category && p.category.toLowerCase() === categoryFilter.toLowerCase());

    const matchesSize =
      sizeFilter === 'all' ||
      (p.size && p.size.toUpperCase() === sizeFilter.toUpperCase());

    return matchesSearch && matchesCat && matchesSize;
  });

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 pb-32 text-white">
      {/* ─────────────────────────────────────────────────────────────
          STEP 1: PRODUCT SELECTION (New Sale POS Screen)
         ───────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div key="step1" className="space-y-5">
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

          {/* Search Input */}
          <div className="relative animate-card-in stagger-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search posters, frames, sizes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#151518] border border-zinc-800/80 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
            />
          </div>

          {/* Category Filter Pills (Poster, Frame & Sticker) */}
          <div className="flex items-center gap-2 pb-1 animate-card-in stagger-3">
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
          </div>

          {/* Products View */}
          {categoryFilter === 'sticker' ? (
            <div key="stickers-view" className="space-y-4 animate-card-in stagger-4">
              {/* Dedicated 2-Card Tier Display for ₹15 and ₹30 Stickers */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* 1. ₹15 Sticker Card */}
                <div className="p-3 sm:p-4 rounded-3xl bg-[#1e1f26] border border-amber-500/30 flex flex-col justify-between relative group hover:border-amber-400/60 transition-all shadow-md animate-card-in">
                  <div className="flex items-center justify-between mb-2 z-10">
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-[10px] font-extrabold text-amber-300 uppercase tracking-wide">
                      ✨ ₹15 Tier
                    </span>

                    {sticker15Qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => handleQuickAddSticker(15)}
                        className="w-8 h-8 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white flex items-center justify-center shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                        title="Add ₹15 Sticker"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-[#34d399] text-zinc-950 px-2 py-1 rounded-xl font-black text-xs shadow-md animate-scale-up">
                        <button
                          type="button"
                          onClick={() => {
                            const target =
                              sticker15Product ||
                              cartItems.find(
                                (i) => i.product.category === 'sticker' && i.sellPrice === 15
                              )?.product;
                            if (target) updateQty(target._id, sticker15Qty - 1);
                          }}
                          className="p-0.5 hover:bg-black/10 rounded cursor-pointer"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="w-3.5 text-center font-black">{sticker15Qty}</span>
                        <button
                          type="button"
                          onClick={() => handleQuickAddSticker(15)}
                          className="p-0.5 hover:bg-black/10 rounded cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Artwork / Icon Preview */}
                  <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500/10 via-zinc-900 to-yellow-500/10 mb-3 flex items-center justify-center relative border border-zinc-800/60 group-hover:scale-[1.02] transition-transform">
                    {sticker15Product?.image ? (
                      <img
                        src={sticker15Product.image}
                        alt="₹15 Sticker"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <span className="text-4xl block mb-1">✨</span>
                        <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">Small Sticker</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {sticker15Product?.name || '₹15 Small Sticker'}
                    </h3>
                    <div className="text-sm sm:text-base font-black text-amber-400 mt-0.5 flex items-baseline gap-1.5">
                      <span>₹15</span>
                      <span className="text-[10px] text-zinc-400 font-normal">per unit</span>
                    </div>
                    <p className="text-[10px] mt-0.5 font-medium text-emerald-400">
                      {sticker15Product ? `${sticker15Product.stock} in stock` : 'In stock'}
                    </p>
                  </div>
                </div>

                {/* 2. ₹30 Sticker Card */}
                <div className="p-3 sm:p-4 rounded-3xl bg-[#1e1f26] border border-amber-500/30 flex flex-col justify-between relative group hover:border-amber-400/60 transition-all shadow-md animate-card-in">
                  <div className="flex items-center justify-between mb-2 z-10">
                    <span className="px-2 py-0.5 rounded-md bg-yellow-400/20 border border-yellow-400/40 text-[10px] font-extrabold text-yellow-300 uppercase tracking-wide">
                      🌟 ₹30 Tier
                    </span>

                    {sticker30Qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => handleQuickAddSticker(30)}
                        className="w-8 h-8 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white flex items-center justify-center shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                        title="Add ₹30 Sticker"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-[#34d399] text-zinc-950 px-2 py-1 rounded-xl font-black text-xs shadow-md animate-scale-up">
                        <button
                          type="button"
                          onClick={() => {
                            const target =
                              sticker30Product ||
                              cartItems.find(
                                (i) => i.product.category === 'sticker' && i.sellPrice === 30
                              )?.product;
                            if (target) updateQty(target._id, sticker30Qty - 1);
                          }}
                          className="p-0.5 hover:bg-black/10 rounded cursor-pointer"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="w-3.5 text-center font-black">{sticker30Qty}</span>
                        <button
                          type="button"
                          onClick={() => handleQuickAddSticker(30)}
                          className="p-0.5 hover:bg-black/10 rounded cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Artwork / Icon Preview */}
                  <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-500/10 via-zinc-900 to-amber-500/10 mb-3 flex items-center justify-center relative border border-zinc-800/60 group-hover:scale-[1.02] transition-transform">
                    {sticker30Product?.image ? (
                      <img
                        src={sticker30Product.image}
                        alt="₹30 Sticker"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <span className="text-4xl block mb-1">🌟</span>
                        <span className="text-[10px] font-black uppercase text-yellow-300 tracking-wider">Premium Sticker</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {sticker30Product?.name || '₹30 Premium Sticker'}
                    </h3>
                    <div className="text-sm sm:text-base font-black text-amber-400 mt-0.5 flex items-baseline gap-1.5">
                      <span>₹30</span>
                      <span className="text-[10px] text-zinc-400 font-normal">per unit</span>
                    </div>
                    <p className="text-[10px] mt-0.5 font-medium text-emerald-400">
                      {sticker30Product ? `${sticker30Product.stock} in stock` : 'In stock'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Custom Stickers from DB (if any with custom designs) */}
              {filteredProducts.filter(
                (p) =>
                  p._id !== sticker15Product?._id &&
                  p._id !== sticker30Product?._id
              ).length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-2.5">
                    CUSTOM DESIGNS & MORE STICKERS
                  </span>
                  <div className="grid grid-cols-2 gap-3.5">
                    {filteredProducts
                      .filter(
                        (p) =>
                          p._id !== sticker15Product?._id &&
                          p._id !== sticker30Product?._id
                      )
                      .map((p, idx) => {
                        const inCartQty = getCartItemQty(p._id);
                        const isOutOfStock = p.stock <= 0;

                        return (
                          <div
                            key={p._id}
                            style={{ animationDelay: `${70 + idx * 30}ms` }}
                            className="p-3 sm:p-4 rounded-3xl bg-[#1e1f26] border border-zinc-800/80 flex flex-col justify-between relative group hover:border-zinc-700 transition-all shadow-md animate-card-in"
                          >
                            <div className="flex items-center justify-between mb-2 z-10">
                              <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 border border-zinc-700/60 text-[10px] font-extrabold text-amber-300 uppercase tracking-wide">
                                {p.size || 'Sticker'}
                              </span>

                              {inCartQty === 0 ? (
                                <button
                                  type="button"
                                  disabled={isOutOfStock}
                                  onClick={() => addToCart(p)}
                                  className="w-8 h-8 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white flex items-center justify-center shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
                                  title="Add to order"
                                >
                                  <Plus className="w-4 h-4 stroke-[2.5]" />
                                </button>
                              ) : (
                                <div className="flex items-center gap-1.5 bg-[#34d399] text-zinc-950 px-2 py-1 rounded-xl font-black text-xs shadow-md animate-scale-up">
                                  <button
                                    type="button"
                                    onClick={() => updateQty(p._id, inCartQty - 1)}
                                    className="p-0.5 hover:bg-black/10 rounded cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3 stroke-[2.5]" />
                                  </button>
                                  <span className="w-3.5 text-center font-black">{inCartQty}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateQty(p._id, inCartQty + 1)}
                                    className="p-0.5 hover:bg-black/10 rounded cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3 stroke-[2.5]" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-zinc-900 mb-3 flex items-center justify-center relative">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="text-4xl">{p.emoji || '✨'}</div>
                              )}
                            </div>

                            <div>
                              <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                                {p.name}
                              </h3>
                              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                                {formatCurrency(p.sellPrice)}
                              </div>
                              <p
                                className={`text-[10px] mt-0.5 font-medium ${
                                  isOutOfStock ? 'text-rose-400 font-bold' : 'text-emerald-400'
                                }`}
                              >
                                {isOutOfStock ? 'Out of stock' : `${p.stock} in stock`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Posters & Frames Grid (2 Columns) */
            loading ? (
              <div className="grid grid-cols-2 gap-3.5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-56 rounded-3xl bg-[#151518] animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div key={categoryFilter} className="p-8 text-center rounded-3xl bg-[#151518] border border-zinc-800/80 flex flex-col items-center gap-3 animate-card-in stagger-4">
                <Package className="w-8 h-8 text-zinc-600" />
                <div>
                  <p className="text-xs font-bold text-zinc-300">No products found</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Try adjusting filters or create a new poster/frame
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
              <div key={categoryFilter} className="grid grid-cols-2 gap-3.5">
                {filteredProducts.map((p, idx) => {
                  const inCartQty = getCartItemQty(p._id);
                  const isOutOfStock = p.stock <= 0;

                  return (
                    <div
                      key={p._id}
                      style={{ animationDelay: `${70 + idx * 30}ms` }}
                      className="p-3 sm:p-4 rounded-3xl bg-[#1e1f26] border border-zinc-800/80 flex flex-col justify-between relative group hover:border-zinc-700 transition-all shadow-md animate-card-in"
                    >
                      {/* Top Action Button: Unselected (Orange +) vs Selected (Mint [- Qty +]) */}
                      <div className="flex items-center justify-between mb-2 z-10">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 border border-zinc-700/60 text-[10px] font-extrabold text-amber-300 uppercase tracking-wide">
                          {p.size || (p.category === 'frame' ? 'Frame' : 'Poster')}
                        </span>

                        {inCartQty === 0 ? (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => addToCart(p)}
                            className="w-8 h-8 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white flex items-center justify-center shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
                            title="Add to order"
                          >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-[#34d399] text-zinc-950 px-2 py-1 rounded-xl font-black text-xs shadow-md animate-scale-up">
                            <button
                              type="button"
                              onClick={() => updateQty(p._id, inCartQty - 1)}
                              className="p-0.5 hover:bg-black/10 rounded cursor-pointer"
                            >
                              <Minus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                            <span className="w-3.5 text-center font-black">{inCartQty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(p._id, inCartQty + 1)}
                              className="p-0.5 hover:bg-black/10 rounded cursor-pointer"
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Centered Artwork Image / Emoji Preview */}
                      <div className="w-full aspect-square rounded-2xl overflow-hidden bg-zinc-900 mb-3 flex items-center justify-center relative">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-4xl">{p.emoji || (p.category === 'frame' ? '🔲' : '🖼️')}</div>
                        )}
                      </div>

                      {/* Title, Price & Stock */}
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                          {p.name}
                        </h3>
                        <div className="text-sm sm:text-base font-black text-white mt-0.5 flex items-baseline gap-1.5">
                          <span>{formatCurrency(p.sellPrice)}</span>
                          {p.category === 'frame' && (
                            <span className="text-[10px] text-zinc-400 font-normal">Frame</span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] mt-0.5 font-medium ${
                            isOutOfStock
                              ? 'text-rose-400 font-bold'
                              : p.stock <= p.lowStockThreshold
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {isOutOfStock ? 'Out of stock' : `${p.stock} in stock`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
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
