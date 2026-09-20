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
  const [itemTypes, setItemTypes] = useState(['custom_framed_poster']);
  const [image, setImage] = useState('');

  // Size Tiers with Count, Poster Price & Frame Price (No hardcoded default prices)
  const [sizeTiers, setSizeTiers] = useState([
    { size: 'A4', count: 1, posterPrice: '', framePrice: '' },
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
    { id: 'custom_framed_poster', label: '🖼️ Framed Print', desc: 'Poster + Frame assembly' },
    { id: 'custom_poster', label: '🎨 Poster Only', desc: 'High-res art print' },
    { id: 'custom_frame', label: '🔲 Frame Only', desc: 'Custom size frame' },
    { id: 'custom_sticker', label: '✨ Stickers', desc: 'Custom vinyl pack' },
  ];

  const presetSizes = ['A6', 'A5', 'A4', 'A3', '12x18', '18x24', 'Custom'];

  // Helper to sync total from size tiers
  const calculateTotal = (tiers) => {
    return tiers.reduce((sum, item) => {
      const count = Math.max(1, Number(item.count) || 1);
      const posterP = Math.max(0, Number(item.posterPrice) || 0);
      const frameP = Math.max(0, Number(item.framePrice) || 0);
      const unitP = item.unitPrice !== undefined && item.posterPrice === '' && item.framePrice === ''
        ? Math.max(0, Number(item.unitPrice) || 0)
        : posterP + frameP;
      return sum + count * unitP;
    }, 0);
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
        setItemTypes(['custom_framed_poster']);
      }

      // Size tiers
      if (Array.isArray(order.sizeTiers) && order.sizeTiers.length > 0) {
        setSizeTiers(
          order.sizeTiers.map((st) => ({
            size: st.size || 'A4',
            count: Number(st.count) || 1,
            posterPrice: st.posterPrice !== undefined && st.posterPrice !== null ? String(st.posterPrice) : '',
            framePrice: st.framePrice !== undefined && st.framePrice !== null ? String(st.framePrice) : '',
            unitPrice: Number(st.unitPrice) || 0,
          }))
        );
      } else {
        const legacySize = order.dimensions?.sizeType || 'A4';
        const legacyPrice = order.pricing?.totalPrice || '';
        setSizeTiers([{ size: legacySize, count: 1, posterPrice: legacyPrice, framePrice: '' }]);
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
      // Defaults for new custom order (No default hardcoded prices)
      setCustomerName('');
      setCustomerPhone('');
      setCustomerInstagram('');
      setTitle('');
      setItemTypes(['custom_framed_poster']);
      setImage('');

      const initialTiers = [{ size: 'A4', count: 1, posterPrice: '', framePrice: '' }];
      setSizeTiers(initialTiers);
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
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least 1 selected
        return prev.filter((t) => t !== id);
      }
      return [...prev, id];
    });
  };

  // Add new size tier (clean, no hardcoded default price)
  const handleAddSizeTier = (sizeName) => {
    setSizeTiers((prev) => {
      const existingIdx = prev.findIndex((st) => st.size === sizeName);
      let updated;
      if (existingIdx >= 0) {
        updated = prev.map((st, i) =>
          i === existingIdx ? { ...st, count: Number(st.count || 1) + 1 } : st
        );
      } else {
        updated = [...prev, { size: sizeName, count: 1, posterPrice: '', framePrice: '' }];
      }
      const newTotal = calculateTotal(updated);
      if (newTotal > 0) {
        setTotalPrice(String(newTotal));
        if (!isEditing && advancePaid !== '') {
          setAdvancePaid(String(Math.round(newTotal / 2)));
        }
      }
      return updated;
    });
  };

  // Update specific tier field
  const handleUpdateTier = (index, field, value) => {
    setSizeTiers((prev) => {
      const updated = prev.map((st, i) => {
        if (i !== index) return st;
        return {
          ...st,
          [field]: field === 'size' ? value : value,
        };
      });
      const newTotal = calculateTotal(updated);
      setTotalPrice(newTotal > 0 ? String(newTotal) : '');
      if (!isEditing && newTotal > 0 && advancePaid !== '') {
        setAdvancePaid(String(Math.round(newTotal / 2)));
      }
      return updated;
    });
  };

  // Remove tier
  const handleRemoveTier = (index) => {
    setSizeTiers((prev) => {
      if (prev.length <= 1) {
        showToast('At least one size tier is required', 'info');
        return prev;
      }
      const updated = prev.filter((_, i) => i !== index);
      const newTotal = calculateTotal(updated);
      setTotalPrice(newTotal > 0 ? String(newTotal) : '');
      return updated;
    });
  };

  // Preset Delivery Date - Clicking "Today" sets today's actual date
  const handleSetDeliveryPreset = (daysOffset) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    setDeliveryDate(safeDateToInput(target));
  };

  const numericTotal = Number(totalPrice) || 0;
  const numericAdvance = Number(advancePaid) || 0;
  const balanceDue = Math.max(0, numericTotal - numericAdvance);

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
    if (sizeTiers.length === 0) {
      showToast('Please add at least one size tier', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const parsedOrderDate = orderDate ? new Date(orderDate) : new Date();
      const parsedDeliveryDate = deliveryDate ? new Date(deliveryDate) : null;

      const formattedTiers = sizeTiers.map((st) => {
        const count = Math.max(1, Number(st.count) || 1);
        const posterP = Math.max(0, Number(st.posterPrice) || 0);
        const frameP = Math.max(0, Number(st.framePrice) || 0);
        const unitP = posterP + frameP;
        return {
          size: st.size || 'A4',
          count,
          posterPrice: posterP,
          framePrice: frameP,
          unitPrice: unitP,
          total: count * unitP,
        };
      });

      const primarySize = formattedTiers[0]?.size || 'A4';
      const typeSummary = itemTypes
        .map((t) => (t === 'custom_frame' ? 'Frame' : t === 'custom_sticker' ? 'Stickers' : 'Poster'))
        .join(' & ');

      const defaultTitle = `${customerName.trim()}'s Custom ${primarySize} ${typeSummary}`;

      const finalTotal = numericTotal > 0 ? numericTotal : calculateTotal(sizeTiers);

      const payload = {
        title: title.trim() || defaultTitle,
        itemType: itemTypes[0] || 'custom_framed_poster',
        itemTypes,
        sizeTiers: formattedTiers,
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
          basePrice: formattedTiers[0]?.posterPrice || 0,
          framePrice: formattedTiers[0]?.framePrice || 0,
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
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md no-print overflow-hidden ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={requestClose}
    >
      <div
        className={`w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-[#121215] border border-zinc-800 shadow-2xl overflow-hidden text-white max-h-[92vh] flex flex-col my-0 sm:my-auto ${
          isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
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
              <p className="text-[11px] text-zinc-400">Poster & frame rates, size tiers & delivery dates</p>
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 no-scrollbar flex-1">
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
                2. ITEM TYPE (MULTI-SELECT)
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
                    className={`p-2.5 rounded-xl text-left border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
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
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSelected
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
              SECTION 3: SIZE TIERS (POSTER & FRAME INDIVIDUAL PRICES)
             ───────────────────────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                3. SIZE TIERS, POSTER & FRAME RATES
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">
                Total Units: {sizeTiers.reduce((acc, c) => acc + (Number(c.count) || 0), 0)}
              </span>
            </div>

            {/* Quick Add Size Tier Pills */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 mb-1">
                + Add Size:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {presetSizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleAddSizeTier(sz)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{sz}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Tiers Dynamic Rows with Poster Rate & Frame Rate */}
            <div className="space-y-2.5 pt-1">
              {sizeTiers.map((tier, idx) => {
                const posterP = Number(tier.posterPrice) || 0;
                const frameP = Number(tier.framePrice) || 0;
                const rowUnitTotal = posterP + frameP;
                const rowCount = Number(tier.count) || 1;
                const rowSubtotal = rowCount * rowUnitTotal;

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#121215] border border-zinc-800/90 space-y-2.5 text-xs"
                  >
                    {/* Top Row: Size, Count Stepper & Delete */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tier.size}
                          onChange={(e) => handleUpdateTier(idx, 'size', e.target.value)}
                          placeholder="A4"
                          className="w-20 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 font-black text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 uppercase text-center"
                        />

                        {/* Count Stepper */}
                        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateTier(idx, 'count', Math.max(1, (Number(tier.count) || 1) - 1))}
                            className="w-6 h-6 rounded-md hover:bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={tier.count}
                            onChange={(e) => handleUpdateTier(idx, 'count', e.target.value)}
                            className="w-9 text-center bg-transparent font-mono font-bold text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateTier(idx, 'count', (Number(tier.count) || 1) + 1)}
                            className="w-6 h-6 rounded-md hover:bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Row Subtotal & Delete */}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase block">Total</span>
                          <span className="font-mono font-black text-xs text-emerald-400">
                            ₹{rowSubtotal}
                          </span>
                        </div>

                        {sizeTiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(idx)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Remove size tier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Poster Rate + Frame Rate Inputs */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60">
                      <div>
                        <label className="block text-[9.5px] font-bold text-zinc-400 mb-0.5">
                          🎨 Poster Rate (₹)
                        </label>
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={tier.posterPrice}
                            onChange={(e) => handleUpdateTier(idx, 'posterPrice', e.target.value)}
                            className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 font-mono font-bold text-xs text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-zinc-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9.5px] font-bold text-zinc-400 mb-0.5">
                          🔲 Frame Rate (₹)
                        </label>
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={tier.framePrice}
                            onChange={(e) => handleUpdateTier(idx, 'framePrice', e.target.value)}
                            className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 font-mono font-bold text-xs text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-zinc-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

            {/* Quick Delivery Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-zinc-500 font-bold mr-1">Delivery:</span>
              <button
                type="button"
                onClick={() => handleSetDeliveryPreset(0)}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${
                  deliveryDate === safeDateToInput(new Date())
                    ? 'bg-amber-400 text-zinc-950 border-amber-400'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSetDeliveryPreset(1)}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Tomorrow (+1d)
              </button>
              <button
                type="button"
                onClick={() => handleSetDeliveryPreset(3)}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
              >
                +3 Days
              </button>
              <button
                type="button"
                onClick={() => handleSetDeliveryPreset(7)}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                +1 Week
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SECTION 5: PRICING, DEPOSIT & BALANCE
             ───────────────────────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              5. PRICING & ADVANCE DEPOSIT
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Total Quoted Price (₹) *
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400" />
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={totalPrice}
                    onChange={(e) => {
                      const newTotal = e.target.value;
                      setTotalPrice(newTotal);
                      if (newTotal && advancePaid !== '') {
                        setAdvancePaid(String(Math.round(Number(newTotal) / 2)));
                      }
                    }}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#121215] border border-zinc-700 text-sm font-black text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Advance Paid (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    max={numericTotal || undefined}
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#121215] border border-zinc-700 text-sm font-black text-emerald-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono placeholder:text-zinc-600"
                  />
                </div>
              </div>
            </div>

            {/* Quick Deposit Presets */}
            {numericTotal > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setAdvancePaid(String(Math.round(numericTotal / 2)))}
                  className="py-1 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-amber-300 transition-colors cursor-pointer"
                >
                  50% Advance (₹{Math.round(numericTotal / 2)})
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancePaid(String(numericTotal))}
                  className="py-1 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-emerald-400 transition-colors cursor-pointer"
                >
                  100% Full Paid (₹{numericTotal})
                </button>
              </div>
            )}

            {/* Live Balance Summary Banner */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-semibold">Remaining Due Balance:</span>
              <span
                className={`font-black font-mono text-sm ${
                  balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {balanceDue > 0 ? `₹${balanceDue} Pending` : 'Fully Paid ✓'}
              </span>
            </div>

            {/* Special Instructions / Notes */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Custom Instructions & Notes
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Add white margin, premium glossy paper, urgent delivery..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121215] border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Modal Submit Action Footer */}
        <div className="p-5 sm:p-6 pt-3 border-t border-zinc-800/80 bg-[#121215]">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-[#f59e0b] hover:bg-[#d97706] text-zinc-950 font-black text-sm sm:text-base shadow-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting
              ? 'Saving Custom Order...'
              : isEditing
              ? 'Save Changes'
              : `Create Custom Order ${numericTotal > 0 ? `(${formatCurrency(numericTotal)})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};
