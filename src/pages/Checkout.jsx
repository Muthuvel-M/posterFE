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

const SIZE_CATALOG = {
  poster: [
    {
      size: 'A4',
      name: 'A4 Poster',
      dimensions: '210 × 297 mm',
      tagline: 'Standard Wall Print',
      defaultPrice: 40,
      defaultCost: 15,
      defaultStock: 100,
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      emoji: '🖼️',
    },
    {
      size: 'A5',
      name: 'A5 Poster',
      dimensions: '148 × 210 mm',
      tagline: 'Medium Art Print',
      defaultPrice: 25,
      defaultCost: 10,
      defaultStock: 100,
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
      emoji: '🖼️',
    },
    {
      size: 'A6',
      name: 'A6 Poster',
      dimensions: '105 × 148 mm',
      tagline: 'Mini Postcard Print',
      defaultPrice: 20,
      defaultCost: 8,
      defaultStock: 100,
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      emoji: '🖼️',
    },
  ],
  frame: [
    {
      size: 'A4',
      name: 'A4 Frame',
      dimensions: 'Fits A4 (210 × 297 mm)',
      tagline: 'Solid Black / Wood Frame',
      defaultPrice: 180,
      defaultCost: 80,
      defaultStock: 50,
      image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80',
      emoji: '🔲',
    },
    {
      size: 'A5',
      name: 'A5 Frame',
      dimensions: 'Fits A5 (148 × 210 mm)',
      tagline: 'Natural Scandinavian Frame',
      defaultPrice: 140,
      defaultCost: 65,
      defaultStock: 50,
      image: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=600&auto=format&fit=crop&q=80',
      emoji: '🔲',
    },
    {
      size: 'A6',
      name: 'A6 Frame',
      dimensions: 'Fits A6 (105 × 148 mm)',
      tagline: 'Compact Tabletop Frame',
      defaultPrice: 100,
      defaultCost: 45,
      defaultStock: 50,
      image: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=600&auto=format&fit=crop&q=80',
      emoji: '🔲',
    },
  ],
  sticker: [
    {
      size: '₹15',
      name: '₹15 Sticker',
      dimensions: 'Small Holographic',
      tagline: 'Waterproof Sparkle',
      defaultPrice: 15,
      defaultCost: 5,
      defaultStock: 150,
      emoji: '✨',
    },
    {
      size: '₹30',
      name: '₹30 Sticker',
      dimensions: 'Premium Die-Cut',
      tagline: 'Large Vinyl Cutout',
      defaultPrice: 30,
      defaultCost: 10,
      defaultStock: 150,
      emoji: '🌟',
    },
  ],
};

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

  // Wizard Steps
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('poster'); // 'poster' | 'frame' | 'sticker'

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

  // Resolves or auto-creates a real database product for a given category & size
  const resolveProductForSize = async (category, size, defaultDef) => {
    let matched = products.find((p) => {
      const isCat = p.category?.toLowerCase() === category.toLowerCase();
      if (!isCat) return false;
      if (category === 'sticker') {
        return (
          p.size === size ||
          Number(p.sellPrice) === Number(defaultDef.defaultPrice) ||
          p.name?.includes(String(defaultDef.defaultPrice))
        );
      }
      return p.size?.toUpperCase() === size.toUpperCase();
    });

    if (matched) return matched;

    // Auto-create in DB so transactions link to a permanent MongoDB _id
    try {
      const payload = {
        name: defaultDef.name,
        sku: `AF-${category.substring(0, 3).toUpperCase()}-${size.replace(/[^A-Za-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`,
        category,
        size,
        sellPrice: defaultDef.defaultPrice,
        costPrice: defaultDef.defaultCost,
        stock: defaultDef.defaultStock || 100,
        lowStockThreshold: 10,
        image: defaultDef.image || '',
        emoji: defaultDef.emoji || (category === 'frame' ? '🔲' : category === 'sticker' ? '✨' : '🖼️'),
        active: true,
      };
      const res = await api.createProduct(payload);
      if (res.success && res.data) {
        setProducts((prev) => [res.data, ...prev]);
        return res.data;
      }
    } catch (err) {
      console.error('Error auto-creating size product:', err);
    }

    // Fallback temporary product
    return {
      _id: `temp-${category}-${size}`,
      name: defaultDef.name,
      category,
      size,
      sellPrice: defaultDef.defaultPrice,
      costPrice: defaultDef.defaultCost,
      stock: defaultDef.defaultStock || 100,
      emoji: defaultDef.emoji,
    };
  };

  // Get live quantity in cart for a size
  const getCartQtyForSize = (category, size, defaultDef) => {
    const item = cartItems.find((ci) => {
      const p = ci.product;
      const isCat = p.category?.toLowerCase() === category.toLowerCase();
      if (!isCat) return false;
      if (category === 'sticker') {
        return (
          p.size === size ||
          Number(ci.sellPrice) === Number(defaultDef.defaultPrice) ||
          p.name?.includes(String(defaultDef.defaultPrice))
        );
      }
      return p.size?.toUpperCase() === size.toUpperCase();
    });
    return item ? item.qty : 0;
  };

  // Handle adding or incrementing size
  const handleAddOrIncrementSize = async (category, size, defaultDef) => {
    const prod = await resolveProductForSize(category, size, defaultDef);
    if (!prod) return;

    const existingInCart = cartItems.find(
      (ci) =>
        ci.product._id === prod._id ||
        (ci.product.category?.toLowerCase() === category.toLowerCase() &&
          (category === 'sticker'
            ? ci.product.size === size || Number(ci.sellPrice) === Number(defaultDef.defaultPrice)
            : ci.product.size?.toUpperCase() === size.toUpperCase()))
    );

    if (existingInCart) {
      updateQty(existingInCart.product._id, existingInCart.qty + 1);
    } else {
      addToCart(prod);
    }
  };

  // Handle decrementing size
  const handleDecrementSize = (category, size, defaultDef) => {
    const existingInCart = cartItems.find(
      (ci) =>
        ci.product.category?.toLowerCase() === category.toLowerCase() &&
        (category === 'sticker'
          ? ci.product.size === size || Number(ci.sellPrice) === Number(defaultDef.defaultPrice)
          : ci.product.size?.toUpperCase() === size.toUpperCase())
    );

    if (existingInCart) {
      updateQty(existingInCart.product._id, existingInCart.qty - 1);
    }
  };

  // Get live price and stock from DB
  const getLiveSizeInfo = (category, size, defaultDef) => {
    const matching = products.filter((p) => {
      const isCat = p.category?.toLowerCase() === category.toLowerCase();
      if (!isCat) return false;
      if (category === 'sticker') {
        return (
          p.size === size ||
          Number(p.sellPrice) === Number(defaultDef.defaultPrice) ||
          p.name?.includes(String(defaultDef.defaultPrice))
        );
      }
      return p.size?.toUpperCase() === size.toUpperCase();
    });

    if (matching.length > 0) {
      const totalStock = matching.reduce((sum, p) => sum + (p.stock || 0), 0);
      const sellPrice = matching[0].sellPrice;
      const image = matching.find((p) => p.image)?.image || defaultDef.image;
      return {
        sellPrice,
        stock: totalStock,
        image,
        isOutOfStock: totalStock <= 0,
        lowStock: totalStock <= 10,
      };
    }

    return {
      sellPrice: defaultDef.defaultPrice,
      stock: defaultDef.defaultStock,
      image: defaultDef.image,
      isOutOfStock: false,
      lowStock: false,
    };
  };

  // Gather current category size products (plus any custom size products in DB)
  const getCurrentCategorySizes = () => {
    const baseList = SIZE_CATALOG[categoryFilter] || [];
    const sizes = [...baseList];

    // Check for any custom sizes added in database
    products
      .filter((p) => p.category?.toLowerCase() === categoryFilter.toLowerCase())
      .forEach((p) => {
        if (p.size && !sizes.some((s) => s.size?.toUpperCase() === p.size?.toUpperCase())) {
          sizes.push({
            size: p.size,
            name: `${p.size} ${categoryFilter === 'frame' ? 'Frame' : categoryFilter === 'sticker' ? 'Sticker' : 'Poster'}`,
            dimensions: `Custom Size (${p.size})`,
            tagline: p.name,
            defaultPrice: p.sellPrice,
            defaultCost: p.costPrice,
            defaultStock: p.stock,
            image: p.image,
            emoji: p.emoji || (categoryFilter === 'frame' ? '🔲' : categoryFilter === 'sticker' ? '✨' : '🖼️'),
          });
        }
      });

    return sizes;
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
      showToast('Please select at least one poster, frame or sticker', 'error');
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

  const categorySizes = getCurrentCategorySizes();

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 pb-32 text-white">
      {/* ─────────────────────────────────────────────────────────────
          STEP 1: PRODUCT SELECTION (Size-Based POS Screen)
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

          {/* Category Tabs (Posters, Frames, Stickers) */}
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
          </div>

          {/* Size-as-Product Grid (Posters, Frames & Stickers) */}
          <div key={categoryFilter} className="grid grid-cols-2 gap-3 sm:gap-3.5 animate-card-in stagger-3">
            {categorySizes.map((item, idx) => {
              const inCartQty = getCartQtyForSize(categoryFilter, item.size, item);
              const info = getLiveSizeInfo(categoryFilter, item.size, item);

              return (
                <div
                  key={item.size}
                  onClick={() => {
                    if (!info.isOutOfStock && inCartQty === 0) {
                      handleAddOrIncrementSize(categoryFilter, item.size, item);
                    }
                  }}
                  style={{ animationDelay: `${50 + idx * 35}ms` }}
                  className={`rounded-2xl sm:rounded-[22px] overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer select-none group active:scale-[0.98] shadow-md ${
                    info.isOutOfStock
                      ? 'opacity-60 grayscale-[40%] cursor-not-allowed bg-[#141417] border border-zinc-800/40'
                      : inCartQty > 0
                      ? 'bg-gradient-to-b from-[#242116] via-[#1a1812] to-[#141417] border-2 border-amber-400 ring-2 ring-amber-400/20 shadow-amber-500/10'
                      : 'bg-[#16161a] hover:bg-[#1c1c22] border border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Card Visual / Image Preview Container */}
                  <div className="relative w-full aspect-square bg-[#0e0e11] overflow-hidden flex items-center justify-center">
                    {info.image ? (
                      <img
                        src={info.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-center p-3">
                        <span className="text-5xl block mb-1 drop-shadow-md">
                          {item.emoji || (categoryFilter === 'frame' ? '🔲' : categoryFilter === 'sticker' ? '✨' : '🖼️')}
                        </span>
                        <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                          {item.size}
                        </span>
                      </div>
                    )}

                    {/* Top-Left Size Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9.5px] font-black uppercase tracking-wider text-amber-300 shadow-sm">
                        {item.size}
                      </span>
                    </div>

                    {/* Top-Right Action: (+) Add Button vs Interactive ([-] Qty [+]) Stepper */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      {inCartQty === 0 ? (
                        <button
                          type="button"
                          disabled={info.isOutOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddOrIncrementSize(categoryFilter, item.size, item);
                          }}
                          className="w-8 h-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center font-black shadow-lg shadow-amber-400/30 group-hover:scale-110 active:scale-90 transition-all disabled:opacity-30 cursor-pointer"
                          title={`Add ${item.name}`}
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                      ) : (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-zinc-950 px-2 py-1 rounded-xl font-black text-xs shadow-lg shadow-amber-400/30 ring-2 ring-zinc-950 animate-scale-up"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDecrementSize(categoryFilter, item.size, item);
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
                              handleAddOrIncrementSize(categoryFilter, item.size, item);
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
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-medium truncate">
                      {item.dimensions}
                    </p>

                    <div className="flex items-baseline justify-between pt-0.5">
                      <span className="text-sm sm:text-base font-black text-amber-400 tracking-tight">
                        {formatCurrency(info.sellPrice)}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-semibold">per piece</span>
                    </div>

                    <p
                      className={`text-[9.5px] font-bold flex items-center gap-1 ${
                        info.isOutOfStock
                          ? 'text-rose-400'
                          : info.lowStock
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          info.isOutOfStock
                            ? 'bg-rose-400'
                            : info.lowStock
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      ></span>
                      {info.isOutOfStock
                        ? 'Out of stock'
                        : info.lowStock
                        ? `Only ${info.stock} left`
                        : `${info.stock} in stock`}
                    </p>
                  </div>

                  {/* Active highlight line */}
                  {inCartQty > 0 && <div className="h-1 bg-gradient-to-r from-amber-400 to-yellow-300 w-full" />}
                </div>
              );
            })}
          </div>

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
