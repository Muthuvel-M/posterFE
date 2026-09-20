import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Calendar,
  IndianRupee,
  Phone,
  User,
  Check,
  Plus,
  Minus,
  Trash2,
  Palette,
  Clock,
  Truck,
  Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { formatCurrency } from '../utils/formatters';
import { api } from '../api/client';

export const CustomOrderModal = ({
  isOpen,
  onClose,
  order = null,
  onSaveSuccess,
}) => {
  const { showToast } = useToast();
  const { shouldRender, isClosing, requestClose } = useModalAnimation(isOpen, onClose);
  const isEditing = Boolean(order && order._id);

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerInstagram, setCustomerInstagram] = useState('');
  const [title, setTitle] = useState('');

  // Multi-selected item types
  const [itemTypes, setItemTypes] = useState([]);
  const [image, setImage] = useState('');

  // Separate Size Tiers for Poster and Frame (No hardcoded default prices)
  const [posterTiers, setPosterTiers] = useState([
    { size: 'A4', count: 1, price: '' },
  ]);
  const [frameTiers, setFrameTiers] = useState([
    { size: 'A4', count: 1, price: '' },
  ]);

  // Dates
  const [orderDate, setOrderDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  // Pricing & Advance
  const [totalPrice, setTotalPrice] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const safeDateToInput = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    try {
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const itemTypeOptions = [
    { id: 'custom_framed_poster', label: '🖼️ Framed Print', desc: 'Custom framed wall art' },
    { id: 'custom_poster', label: '🎨 Poster Only', desc: 'High-res poster art print' },
  ];

  const presetSizes = ['A6', 'A5', 'A4', 'A3'];

  // Calculations for separated tiers
  const calculatePosterTotal = (tiers) => {
    return (tiers || []).reduce((sum, item) => {
      const count = Math.max(1, Number(item.count) || 1);
      const price = Math.max(0, Number(item.price) || 0);
      return sum + count * price;
    }, 0);
  };

  const calculateFrameTotal = (tiers) => {
    return (tiers || []).reduce((sum, item) => {
      const count = Math.max(1, Number(item.count) || 1);
      const price = Math.max(0, Number(item.price) || 0);
      return sum + count * price;
    }, 0);
  };

  const showPoster = itemTypes.includes('custom_poster');

  const showFrame =
    itemTypes.includes('custom_framed_poster') || itemTypes.includes('custom_frame');

  const calculateCombinedTotal = (pTiers, fTiers, currentTypes = itemTypes) => {
    const isPoster = currentTypes.includes('custom_poster');
    const isFrame =
      currentTypes.includes('custom_framed_poster') || currentTypes.includes('custom_frame');
    return (isPoster ? calculatePosterTotal(pTiers) : 0) + (isFrame ? calculateFrameTotal(fTiers) : 0);
  };

  useEffect(() => {
    if (order) {
      setCustomerName(order.customerSnapshot?.name || order.customer?.name || '');
      setCustomerPhone(order.customerSnapshot?.phone || order.customer?.phone || '');
      setCustomerInstagram(order.customerSnapshot?.instagramHandle || order.customer?.instagramHandle || '');
      setTitle(order.title || '');

      // Multi-item types
      if (Array.isArray(order.itemTypes) && order.itemTypes.length > 0) {
        setItemTypes(order.itemTypes);
      } else if (order.itemType) {
        setItemTypes([order.itemType]);
      } else {
        setItemTypes([]);
      }

      // Populate separate Poster Tiers
      if (Array.isArray(order.posterTiers) && order.posterTiers.length > 0) {
        setPosterTiers(
          order.posterTiers.map((pt) => ({
            size: pt.size || 'A4',
            count: Number(pt.count) || 1,
            price: pt.price !== undefined && pt.price !== null ? String(pt.price) : '',
          }))
        );
      } else if (Array.isArray(order.sizeTiers) && order.sizeTiers.length > 0) {
        const separatedPosters = order.sizeTiers
          .filter((st) => st.type === 'poster' || (st.posterPrice && Number(st.posterPrice) > 0) || !st.framePrice)
          .map((st) => ({
            size: st.size || 'A4',
            count: Number(st.count) || 1,
            price: st.price !== undefined ? String(st.price) : (st.posterPrice !== undefined ? String(st.posterPrice) : ''),
          }));
        setPosterTiers(separatedPosters.length > 0 ? separatedPosters : [{ size: 'A4', count: 1, price: '' }]);
      } else {
        const legacySize = order.dimensions?.sizeType || 'A4';
        const legacyPrice = order.pricing?.basePrice || '';
        setPosterTiers([{ size: legacySize, count: 1, price: legacyPrice ? String(legacyPrice) : '' }]);
      }

      // Populate separate Frame Tiers
      if (Array.isArray(order.frameTiers) && order.frameTiers.length > 0) {
        setFrameTiers(
          order.frameTiers.map((ft) => ({
            size: ft.size || 'A4',
            count: Number(ft.count) || 1,
            price: ft.price !== undefined && ft.price !== null ? String(ft.price) : '',
          }))
        );
      } else if (Array.isArray(order.sizeTiers) && order.sizeTiers.length > 0) {
        const separatedFrames = order.sizeTiers
          .filter((st) => st.type === 'frame' || (st.framePrice && Number(st.framePrice) > 0))
          .map((st) => ({
            size: st.size || 'A4',
            count: Number(st.count) || 1,
            price: st.price !== undefined ? String(st.price) : (st.framePrice !== undefined ? String(st.framePrice) : ''),
          }));
        setFrameTiers(separatedFrames.length > 0 ? separatedFrames : [{ size: 'A4', count: 1, price: '' }]);
      } else {
        const legacySize = order.dimensions?.sizeType || 'A4';
        const legacyPrice = order.pricing?.framePrice || '';
        setFrameTiers([{ size: legacySize, count: 1, price: legacyPrice ? String(legacyPrice) : '' }]);
      }

      setImage(order.image || '');

      // Dates
      setOrderDate(safeDateToInput(order.orderDate || order.createdAt || new Date()));
      setDeliveryDate(safeDateToInput(order.deliveryDate || order.dueDate || ''));

      // Pricing
      const existingTotal = order.pricing?.totalPrice !== undefined ? String(order.pricing.totalPrice) : '';
      setTotalPrice(existingTotal);
      setAdvancePaid(order.pricing?.advancePaid !== undefined ? String(order.pricing.advancePaid) : '');
      setCustomNotes(order.customNotes || '');
    } else {
      // Defaults for new custom order (No hardcoded default prices)
      setCustomerName('');
      setCustomerPhone('');
      setCustomerInstagram('');
      setTitle('');
      setItemTypes([]);
      setImage('');

      const initialPoster = [{ size: 'A4', count: 1, price: '' }];
      const initialFrame = [{ size: 'A4', count: 1, price: '' }];
      setPosterTiers(initialPoster);
      setFrameTiers(initialFrame);
      setTotalPrice('');
      setAdvancePaid('');
      setCustomNotes('');

      // Today as Order Placed Date
      const today = new Date();
      setOrderDate(safeDateToInput(today));

      // 3 days from today as initial Delivery Date
      const delivery = new Date();
      delivery.setDate(delivery.getDate() + 3);
      setDeliveryDate(safeDateToInput(delivery));
    }
  }, [order, isOpen]);

  // Toggle multi-selection item types
  const handleToggleItemType = (id) => {
    setItemTypes((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      const newTotal = calculateCombinedTotal(posterTiers, frameTiers, next);
      setTotalPrice(newTotal > 0 ? String(newTotal) : '');
      if (!isEditing && newTotal > 0 && advancePaid !== '') {
        setAdvancePaid(String(Math.round(newTotal / 2)));
      }
      return next;
    });
  };

  // ── Poster Tier Handlers ──────────────────────────────────────────
  const handleAddPosterTier = (sizeName) => {
    setPosterTiers((prev) => {
      const existingIdx = prev.findIndex((st) => st.size === sizeName);
      let updated;
      if (existingIdx >= 0) {
        updated = prev.map((st, i) =>
          i === existingIdx ? { ...st, count: Number(st.count || 1) + 1 } : st
        );
      } else {
        updated = [...prev, { size: sizeName, count: 1, price: '' }];
      }
      const newTotal = calculateCombinedTotal(updated, frameTiers);
      if (newTotal > 0) {
        setTotalPrice(String(newTotal));
        if (!isEditing && advancePaid !== '') {
          setAdvancePaid(String(Math.round(newTotal / 2)));
        }
      }
      return updated;
    });
  };

  const handleUpdatePosterTier = (index, field, value) => {
    setPosterTiers((prev) => {
      const updated = prev.map((st, i) => {
        if (i !== index) return st;
        return { ...st, [field]: value };
      });
      const newTotal = calculateCombinedTotal(updated, frameTiers);
      setTotalPrice(newTotal > 0 ? String(newTotal) : '');
      if (!isEditing && newTotal > 0 && advancePaid !== '') {
        setAdvancePaid(String(Math.round(newTotal / 2)));
      }
      return updated;
    });
  };

  const handleRemovePosterTier = (index) => {
    setPosterTiers((prev) => {
      if (prev.length <= 1) {
        const resetRow = [{ size: 'A4', count: 1, price: '' }];
        const newTotal = calculateCombinedTotal(resetRow, frameTiers);
        setTotalPrice(newTotal > 0 ? String(newTotal) : '');
        return resetRow;
      }
      const updated = prev.filter((_, i) => i !== index);
      const newTotal = calculateCombinedTotal(updated, frameTiers);
      setTotalPrice(newTotal > 0 ? String(newTotal) : '');
      return updated;
    });
  };

  // ── Frame Tier Handlers ───────────────────────────────────────────
  const handleAddFrameTier = (sizeName) => {
    setFrameTiers((prev) => {
      const existingIdx = prev.findIndex((st) => st.size === sizeName);
      let updated;
      if (existingIdx >= 0) {
        updated = prev.map((st, i) =>
          i === existingIdx ? { ...st, count: Number(st.count || 1) + 1 } : st
        );
      } else {
        updated = [...prev, { size: sizeName, count: 1, price: '' }];
      }
      const newTotal = calculateCombinedTotal(posterTiers, updated);
      if (newTotal > 0) {
        setTotalPrice(String(newTotal));
        if (!isEditing && advancePaid !== '') {
          setAdvancePaid(String(Math.round(newTotal / 2)));
        }
      }
      return updated;
    });
  };

  const handleUpdateFrameTier = (index, field, value) => {
    setFrameTiers((prev) => {
      const updated = prev.map((st, i) => {
        if (i !== index) return st;
        return { ...st, [field]: value };
      });
      const newTotal = calculateCombinedTotal(posterTiers, updated);
      setTotalPrice(newTotal > 0 ? String(newTotal) : '');
      if (!isEditing && newTotal > 0 && advancePaid !== '') {
        setAdvancePaid(String(Math.round(newTotal / 2)));
      }
      return updated;
    });
  };

  const handleRemoveFrameTier = (index) => {
    setFrameTiers((prev) => {
      if (prev.length <= 1) {
        const resetRow = [{ size: 'A4', count: 1, price: '' }];
        const newTotal = calculateCombinedTotal(posterTiers, resetRow);
        setTotalPrice(newTotal > 0 ? String(newTotal) : '');
        return resetRow;
      }
      const updated = prev.filter((_, i) => i !== index);
      const newTotal = calculateCombinedTotal(posterTiers, updated);
      setTotalPrice(newTotal > 0 ? String(newTotal) : '');
      return updated;
    });
  };

  // Preset Delivery Date shortcuts
  const handleSetDeliveryPreset = (daysOffset) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    setDeliveryDate(safeDateToInput(target));
  };

  const posterSubtotal = showPoster ? calculatePosterTotal(posterTiers) : 0;
  const frameSubtotal = showFrame ? calculateFrameTotal(frameTiers) : 0;
  const calculatedTotal = posterSubtotal + frameSubtotal;

  const numericTotal = Number(totalPrice) || 0;
  const numericAdvance = Number(advancePaid) || 0;
  const balanceDue = Math.max(0, numericTotal - numericAdvance);

  const totalPosterUnits = posterTiers.reduce((acc, c) => acc + (Number(c.count) || 0), 0);
  const totalFrameUnits = frameTiers.reduce((acc, c) => acc + (Number(c.count) || 0), 0);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!customerName.trim()) {
      showToast('Customer name is required', 'error');
      return;
    }
    if (!customerPhone.trim()) {
      showToast('Customer phone number is required', 'error');
      return;
    }
    if (itemTypes.length === 0) {
      showToast('Please select at least one item type (Framed Print, Poster, Frame, etc.)', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const parsedOrderDate = orderDate ? new Date(orderDate) : new Date();
      const parsedDeliveryDate = deliveryDate ? new Date(deliveryDate) : null;

      const formattedPosterTiers = showPoster
        ? posterTiers.map((pt) => {
            const count = Math.max(1, Number(pt.count) || 1);
            const price = Math.max(0, Number(pt.price) || 0);
            return {
              size: pt.size || 'A4',
              count,
              price,
              total: count * price,
            };
          })
        : [];

      const formattedFrameTiers = showFrame
        ? frameTiers.map((ft) => {
            const count = Math.max(1, Number(ft.count) || 1);
            const price = Math.max(0, Number(ft.price) || 0);
            return {
              size: ft.size || 'A4',
              count,
              price,
              total: count * price,
            };
          })
        : [];

      // Combined sizeTiers for complete backward compatibility
      const combinedSizeTiers = [
        ...formattedPosterTiers.map((pt) => ({
          type: 'poster',
          size: pt.size,
          count: pt.count,
          price: pt.price,
          posterPrice: pt.price,
          framePrice: 0,
          unitPrice: pt.price,
          total: pt.total,
        })),
        ...formattedFrameTiers.map((ft) => ({
          type: 'frame',
          size: ft.size,
          count: ft.count,
          price: ft.price,
          posterPrice: 0,
          framePrice: ft.price,
          unitPrice: ft.price,
          total: ft.total,
        })),
      ];

      const primarySize = formattedPosterTiers[0]?.size || formattedFrameTiers[0]?.size || 'A4';
      const typeSummary = itemTypes
        .map((t) => (t === 'custom_frame' ? 'Frame' : t === 'custom_sticker' ? 'Stickers' : 'Poster'))
        .join(' & ');

      const defaultTitle = `${customerName.trim()}'s Custom ${primarySize} ${typeSummary}`;
      const finalTotal = numericTotal > 0 ? numericTotal : calculatedTotal;

      const payload = {
        title: title.trim() || defaultTitle,
        itemType: itemTypes[0] || 'custom_framed_poster',
        itemTypes,
        posterTiers: formattedPosterTiers,
        frameTiers: formattedFrameTiers,
        sizeTiers: combinedSizeTiers,
        image: image || '',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerInstagram: customerInstagram.trim(),
        dimensions: {
          sizeType: primarySize,
          customWidth: 0,
          customHeight: 0,
          unit: 'in',
        },
        orderDate: parsedOrderDate,
        deliveryDate: parsedDeliveryDate,
        dueDate: parsedDeliveryDate,
        customNotes: customNotes.trim(),
        pricing: {
          basePrice: posterSubtotal,
          framePrice: frameSubtotal,
          matPrice: 0,
          glassPrice: 0,
          totalPrice: finalTotal,
          advancePaid: numericAdvance,
          balanceDue: Math.max(0, finalTotal - numericAdvance),
        },
      };

      let res;
      if (isEditing) {
        res = await api.updateCustomOrder(order._id, payload);
      } else {
        res = await api.createCustomOrder(payload);
      }

      if (res.success) {
        showToast(
          isEditing ? 'Custom order updated successfully' : 'Custom order created successfully',
          'success'
        );
        if (onSaveSuccess) onSaveSuccess(res.data);
        requestClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save custom order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md no-print overflow-hidden ${isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
        }`}
      onClick={requestClose}
    >
      <div
        className={`w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-[#121215] border border-zinc-800 shadow-2xl overflow-hidden text-white max-h-[92vh] flex flex-col my-0 sm:my-auto ${isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-zinc-950 flex items-center justify-center font-bold">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {isEditing ? 'Edit Custom Order' : 'New Custom Order'}
              </h2>
              <p className="text-[11px] text-zinc-400">Separate poster & frame sizes, counts & pricing</p>
            </div>
          </div>

          <button
            onClick={requestClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 no-scrollbar flex-1">
          {/* ─────────────────────────────────────────────────────────────
              SECTION 1: CUSTOMER INFORMATION
             ───────────────────────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              1. CUSTOMER INFORMATION
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Customer Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Patel"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#121215] border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  WhatsApp Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#121215] border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 2: MULTI-SELECT ITEM TYPE
             ───────────────────────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                2. ITEM TYPE
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold">
                {itemTypes.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {itemTypeOptions.map((opt) => {
                const isSelected = itemTypes.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleItemType(opt.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex items-start justify-between gap-2 cursor-pointer ${isSelected
                      ? 'bg-[#2a281c] border-amber-400/90 text-white shadow-md ring-1 ring-amber-400/30'
                      : 'bg-[#121215] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{opt.label}</span>
                      <span className="text-[9.5px] text-zinc-500 block leading-tight mt-0.5">
                        {opt.desc}
                      </span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${isSelected
                        ? 'bg-amber-400 border-amber-400 text-zinc-950 font-bold'
                        : 'border-zinc-700 bg-zinc-900'
                        }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 3: SEPARATE POSTER & FRAME SIZE TIERS (Conditional on selected item types)
             ───────────────────────────────────────────────────────────── */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-3.5 overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                3. SIZE TIERS
              </span>
              {showPoster || showFrame ? (
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  {showPoster && showFrame
                    ? `Posters: ${totalPosterUnits} | Frames: ${totalFrameUnits}`
                    : showPoster
                    ? `Posters: ${totalPosterUnits}`
                    : `Frames: ${totalFrameUnits}`}
                </span>
              ) : (
                <span className="text-[10px] text-zinc-500 italic">No item type selected</span>
              )}
            </div>

            {!showPoster && !showFrame ? (
              <div className="p-4 rounded-xl bg-[#141418] border border-dashed border-zinc-800 text-center py-6">
                <span className="text-xl block mb-1">👆</span>
                <p className="text-xs font-bold text-zinc-300">Select an Item Type above</p>
                <p className="text-[10.5px] text-zinc-500 mt-0.5">
                  Poster and frame size configuration will appear here after selecting an item type.
                </p>
              </div>
            ) : (
              <>
                {/* ── Sub-section A: POSTER SIZE TIERS (Shown when Poster/Framed/Stickers is selected) ── */}
                {showPoster && (
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-[#141418] border border-zinc-800/90 space-y-2.5 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🎨</span>
                        <span className="text-[11px] font-black uppercase text-amber-300 tracking-wide">
                          POSTER
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-400">
                        Subtotal: ₹{posterSubtotal}
                      </span>
                    </div>

                    {/* Quick Add Poster Size Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9.5px] font-bold text-zinc-500">+ Quick Add:</span>
                      {presetSizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleAddPosterTier(sz)}
                          className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-[10px] font-bold text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>{sz}</span>
                        </button>
                      ))}
                    </div>

                    {/* Poster Rows - Two-row layout: Row 1 = Size + Stepper + Total + Delete, Row 2 = Price */}
                    <div className="space-y-2">
                      {posterTiers.map((tier, idx) => {
                        const pPrice = Number(tier.price) || 0;
                        const pCount = Number(tier.count) || 1;
                        const pTotal = pCount * pPrice;

                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-[#191920] border border-zinc-800/90 space-y-2"
                          >
                            {/* Row 1: Size Pill (compact), Count Stepper, Subtotal, Delete */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {/* Reduced size pill */}
                                <input
                                  type="text"
                                  value={tier.size}
                                  onChange={(e) => handleUpdatePosterTier(idx, 'size', e.target.value)}
                                  placeholder="A4"
                                  className="w-14 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 font-black text-xs text-amber-300 uppercase text-center focus:outline-none focus:ring-1 focus:ring-amber-400 shrink-0 shadow-inner"
                                />

                                {/* Count Stepper */}
                                <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg p-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdatePosterTier(idx, 'count', Math.max(1, (Number(tier.count) || 1) - 1))
                                    }
                                    className="w-5 h-5 rounded hover:bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={tier.count}
                                    onChange={(e) => handleUpdatePosterTier(idx, 'count', e.target.value)}
                                    className="w-7 text-center bg-transparent font-mono font-bold text-xs text-white focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdatePosterTier(idx, 'count', (Number(tier.count) || 1) + 1)
                                    }
                                    className="w-5 h-5 rounded hover:bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Right: Subtotal & Delete */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-xs text-emerald-400 text-right whitespace-nowrap">
                                  ₹{pTotal}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleRemovePosterTier(idx)}
                                  className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                                  title="Remove poster tier"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Row 2: Dedicated Price Input below */}
                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/60">
                              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                                <span>Poster Price</span>
                                <span className="text-[9.5px] text-zinc-500">(each)</span>
                              </span>
                              <div className="relative w-32 sm:w-36">
                                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-400" />
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={tier.price}
                                  onChange={(e) => handleUpdatePosterTier(idx, 'price', e.target.value)}
                                  className="w-full pl-6 pr-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 font-mono font-bold text-xs text-amber-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-400 text-right"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Sub-section B: FRAME SIZE TIERS (Shown when Frame/Framed is selected) ── */}
                {showFrame && (
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-[#141418] border border-zinc-800/90 space-y-2.5 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🔲</span>
                        <span className="text-[11px] font-black uppercase text-amber-300 tracking-wide">
                          FRAME
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-400">
                        Subtotal: ₹{frameSubtotal}
                      </span>
                    </div>

                    {/* Quick Add Frame Size Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9.5px] font-bold text-zinc-500">+ Quick Add:</span>
                      {presetSizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleAddFrameTier(sz)}
                          className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-[10px] font-bold text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>{sz}</span>
                        </button>
                      ))}
                    </div>

                    {/* Frame Rows - Two-row layout: Row 1 = Size + Stepper + Total + Delete, Row 2 = Price */}
                    <div className="space-y-2">
                      {frameTiers.map((tier, idx) => {
                        const fPrice = Number(tier.price) || 0;
                        const fCount = Number(tier.count) || 1;
                        const fTotal = fCount * fPrice;

                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-[#191920] border border-zinc-800/90 space-y-2"
                          >
                            {/* Row 1: Size Pill (compact), Count Stepper, Subtotal, Delete */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {/* Reduced size pill */}
                                <input
                                  type="text"
                                  value={tier.size}
                                  onChange={(e) => handleUpdateFrameTier(idx, 'size', e.target.value)}
                                  placeholder="A4"
                                  className="w-14 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 font-black text-xs text-amber-300 uppercase text-center focus:outline-none focus:ring-1 focus:ring-amber-400 shrink-0 shadow-inner"
                                />

                                {/* Count Stepper */}
                                <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg p-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateFrameTier(idx, 'count', Math.max(1, (Number(tier.count) || 1) - 1))
                                    }
                                    className="w-5 h-5 rounded hover:bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={tier.count}
                                    onChange={(e) => handleUpdateFrameTier(idx, 'count', e.target.value)}
                                    className="w-7 text-center bg-transparent font-mono font-bold text-xs text-white focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateFrameTier(idx, 'count', (Number(tier.count) || 1) + 1)
                                    }
                                    className="w-5 h-5 rounded hover:bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Right: Subtotal & Delete */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-xs text-emerald-400 text-right whitespace-nowrap">
                                  ₹{fTotal}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveFrameTier(idx)}
                                  className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                                  title="Remove frame tier"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Row 2: Dedicated Price Input below */}
                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/60">
                              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                                <span>Frame Price</span>
                                <span className="text-[9.5px] text-zinc-500">(each)</span>
                              </span>
                              <div className="relative w-32 sm:w-36">
                                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-400" />
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={tier.price}
                                  onChange={(e) => handleUpdateFrameTier(idx, 'price', e.target.value)}
                                  className="w-full pl-6 pr-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 font-mono font-bold text-xs text-amber-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-400 text-right"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 4: ORDER PLACED DATE & DELIVERY DATE (Fitted & Responsive)
             ───────────────────────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-3 overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              4. DATES (PLACED & DELIVERY)
            </span>

            {/* Date Pickers Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
              {/* Order Placed Date */}
              <div className="min-w-0 w-full">
                <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Order Placed Date</span>
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full min-w-0 max-w-full block box-border px-3 py-2 rounded-xl bg-[#121215] border border-zinc-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                />
              </div>

              {/* Target Delivery Date */}
              <div className="min-w-0 w-full">
                <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Expected Delivery Date</span>
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full min-w-0 max-w-full block box-border px-3 py-2 rounded-xl bg-[#121215] border border-zinc-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Delivery Presets: Today, Tomorrow, +3 Days, +7 Days */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-zinc-500 block mb-1">
                Quick Delivery Presets:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetDeliveryPreset(0)}
                  className="py-1 px-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10.5px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer text-center"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDeliveryPreset(1)}
                  className="py-1 px-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10.5px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer text-center"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDeliveryPreset(3)}
                  className="py-1 px-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10.5px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer text-center"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDeliveryPreset(7)}
                  className="py-1 px-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10.5px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer text-center"
                >
                  +1 Week
                </button>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 5: PRICING & ADVANCE
             ───────────────────────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              5. PRICING & ADVANCE
            </span>

            <div className="grid grid-cols-2 gap-3 min-w-0">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Total Quoted Price *
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400" />
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121215] border border-zinc-700/80 text-sm font-black text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                {calculatedTotal > 0 && totalPrice !== String(calculatedTotal) && (
                  <button
                    type="button"
                    onClick={() => setTotalPrice(String(calculatedTotal))}
                    className="text-[10px] text-amber-400 hover:underline mt-1 block"
                  >
                    Sync with Tiers (₹{calculatedTotal})
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Advance Collected
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121215] border border-zinc-700/80 text-sm font-black text-emerald-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Quick 50% Advance Pill */}
            {numericTotal > 0 && (
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setAdvancePaid(String(Math.round(numericTotal / 2)))}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-emerald-400 transition-colors cursor-pointer"
                >
                  ⚡ 50% Advance (₹{Math.round(numericTotal / 2)})
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancePaid(String(numericTotal))}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-300 transition-colors cursor-pointer"
                >
                  100% Full Paid
                </button>
              </div>
            )}

            {/* Dynamic Balance Calculation Bar */}
            <div className="p-3 rounded-xl bg-[#121215] border border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                  Remaining Balance
                </span>
                <span
                  className={`font-black text-sm ${balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                >
                  ₹{balanceDue}
                </span>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${balanceDue === 0 && numericTotal > 0
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : numericAdvance > 0
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
              >
                {balanceDue === 0 && numericTotal > 0
                  ? 'Fully Paid'
                  : numericAdvance > 0
                    ? 'Partially Paid'
                    : 'Unpaid'}
              </span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 6: IMAGE URL & CUSTOM NOTES
             ───────────────────────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              6. NOTES & REFERENCE IMAGE
            </span>

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Reference Image URL (Optional)
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121215] border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Order Notes / Special Instructions
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Needs UV protected acrylic glass and extra bubble wrap for gift delivery..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121215] border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={requestClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isEditing ? 'Update Custom Order' : 'Create Custom Order'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
