import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Layers,
  Sparkles,
  Calendar,
  IndianRupee,
  Phone,
  User,
  Check,
  Tag,
  Palette,
  Eye,
} from 'lucide-react';
import { InstagramIcon } from './InstagramIcon';
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
  const [itemType, setItemType] = useState('custom_framed_poster'); // 'custom_framed_poster' | 'custom_poster' | 'custom_frame' | 'custom_sticker'
  const [image, setImage] = useState('');

  // Dimensions & Finish
  const [sizeType, setSizeType] = useState('A4'); // 'A4' | 'A5' | 'A6' | 'A3' | '12x18' | '18x24' | 'custom'
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape' | 'square'
  const [paperFinish, setPaperFinish] = useState('matte_art'); // 'matte_art' | 'glossy_photo' | 'textured_canvas' | 'metallic_pearl' | 'holographic'

  // Framing Specs
  const [isFramed, setIsFramed] = useState(true);
  const [frameColor, setFrameColor] = useState('matte_black'); // 'matte_black' | 'oak_wood' | 'antique_gold' | 'deep_walnut' | 'pure_white' | 'metallic_silver'
  const [frameThickness, setFrameThickness] = useState('standard_1.25'); // 'slim_0.75' | 'standard_1.25' | 'gallery_2.0'
  const [mountBoard, setMountBoard] = useState('off_white'); // 'none' | 'off_white' | 'pitch_black' | 'cream_dual'
  const [glassType, setGlassType] = useState('anti_reflective'); // 'anti_reflective' | 'clear_acrylic' | 'museum_uv' | 'none'

  // Pricing & Advance
  const [basePrice, setBasePrice] = useState(150);
  const [framePrice, setFramePrice] = useState(250);
  const [matPrice, setMatPrice] = useState(50);
  const [glassPrice, setGlassPrice] = useState(80);
  const [totalPrice, setTotalPrice] = useState(530);
  const [advancePaid, setAdvancePaid] = useState(265); // Default 50% (half of 530)
  const [dueDate, setDueDate] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Frame Border Color Mapping for Live Preview
  const frameBorderStyles = {
    matte_black: 'border-[#18181b] ring-2 ring-zinc-800 shadow-2xl',
    oak_wood: 'border-[#b5885c] ring-2 ring-[#8c6239] shadow-2xl',
    antique_gold: 'border-[#d4af37] ring-2 ring-[#aa8522] shadow-2xl',
    deep_walnut: 'border-[#4a2e18] ring-2 ring-[#2e1c0e] shadow-2xl',
    pure_white: 'border-[#f4f4f5] ring-2 ring-zinc-300 shadow-2xl',
    metallic_silver: 'border-[#94a3b8] ring-2 ring-zinc-400 shadow-2xl',
    none: 'border-transparent',
  };

  const matBackgroundStyles = {
    off_white: 'bg-[#fafaf9] p-3 sm:p-4',
    pitch_black: 'bg-[#09090b] p-3 sm:p-4',
    cream_dual: 'bg-[#fef3c7] p-3 sm:p-4 ring-1 ring-amber-300/40',
    none: 'p-0',
  };

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

  useEffect(() => {
    if (order) {
      setCustomerName(order.customerSnapshot?.name || order.customer?.name || '');
      setCustomerPhone(order.customerSnapshot?.phone || order.customer?.phone || '');
      setCustomerInstagram(order.customerSnapshot?.instagramHandle || order.customer?.instagramHandle || '');
      setTitle(order.title || '');
      setItemType(order.itemType || 'custom_framed_poster');
      setImage(order.image || '');
      setSizeType(order.dimensions?.sizeType || 'A4');
      setCustomWidth(order.dimensions?.customWidth || '');
      setCustomHeight(order.dimensions?.customHeight || '');
      setOrientation(order.orientation || 'portrait');
      setPaperFinish(order.paperFinish || 'matte_art');
      setIsFramed(order.framing?.isFramed !== undefined ? Boolean(order.framing.isFramed) : true);
      setFrameColor(order.framing?.frameColor || 'matte_black');
      setFrameThickness(order.framing?.frameThickness || 'standard_1.25');
      setMountBoard(order.framing?.mountBoard || 'off_white');
      setGlassType(order.framing?.glassType || 'anti_reflective');
      setBasePrice(order.pricing?.basePrice ?? 150);
      setFramePrice(order.pricing?.framePrice ?? 250);
      setMatPrice(order.pricing?.matPrice ?? 50);
      setGlassPrice(order.pricing?.glassPrice ?? 80);
      const existingTotal = order.pricing?.totalPrice ?? 530;
      setTotalPrice(existingTotal);
      setAdvancePaid(order.pricing?.advancePaid ?? Math.round(existingTotal / 2));
      setCustomNotes(order.customNotes || '');
      setDueDate(safeDateToInput(order.dueDate));
    } else {
      // Defaults for new custom order (Advance is 50% of total)
      setCustomerName('');
      setCustomerPhone('');
      setCustomerInstagram('');
      setTitle('');
      setItemType('custom_framed_poster');
      setImage('');
      setSizeType('A4');
      setCustomWidth('');
      setCustomHeight('');
      setOrientation('portrait');
      setPaperFinish('matte_art');
      setIsFramed(true);
      setFrameColor('matte_black');
      setFrameThickness('standard_1.25');
      setMountBoard('off_white');
      setGlassType('anti_reflective');
      setBasePrice(150);
      setFramePrice(250);
      setMatPrice(50);
      setGlassPrice(80);
      const initialTotal = 530;
      setTotalPrice(initialTotal);
      setAdvancePaid(Math.round(initialTotal / 2)); // Default half (₹265)
      setCustomNotes('');
      // Default due date: 3 days from today
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setDueDate(safeDateToInput(d));
    }
  }, [order, isOpen]);

  // Recalculate estimated pricing based on selections
  const recalculatePrice = (
    newSizeType = sizeType,
    newFramed = isFramed,
    newMount = mountBoard,
    newGlass = glassType
  ) => {
    let base = 150;
    if (newSizeType === 'A6') base = 80;
    if (newSizeType === 'A5') base = 100;
    if (newSizeType === 'A4') base = 150;
    if (newSizeType === 'A3') base = 250;
    if (newSizeType === '12x18') base = 350;
    if (newSizeType === '18x24') base = 500;
    if (newSizeType === 'custom') base = 300;

    let frame = 0;
    let mat = 0;
    let glass = 0;

    if (newFramed) {
      frame = base * 1.5;
      if (newMount !== 'none') mat = 50;
      if (newGlass === 'anti_reflective') glass = 80;
      if (newGlass === 'museum_uv') glass = 140;
      if (newGlass === 'clear_acrylic') glass = 60;
    }

    const calculatedTotal = Math.round(base + frame + mat + glass);
    setBasePrice(base);
    setFramePrice(frame);
    setMatPrice(mat);
    setGlassPrice(glass);
    setTotalPrice(calculatedTotal);
    if (!isEditing) {
      setAdvancePaid(Math.round(calculatedTotal / 2)); // Default half of total
    }
  };

  const handleSizeTypeChange = (sz) => {
    setSizeType(sz);
    recalculatePrice(sz, isFramed, mountBoard, glassType);
  };

  const handleFramedToggle = (val) => {
    setIsFramed(val);
    if (!val) {
      setFrameColor('none');
      setMountBoard('none');
      setGlassType('none');
    } else {
      setFrameColor('matte_black');
      setMountBoard('off_white');
      setGlassType('anti_reflective');
    }
    recalculatePrice(sizeType, val, val ? 'off_white' : 'none', val ? 'anti_reflective' : 'none');
  };

  const handleFileUpload = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('Image size must be under 8MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      showToast('Photo uploaded for custom framing preview', 'success', 1500);
    };
    reader.readAsDataURL(file);
  };

  const balanceDue = Math.max(0, Number(totalPrice) - Number(advancePaid));

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

    try {
      setSubmitting(true);
      const parsedDueDate = dueDate ? new Date(dueDate) : null;
      const validDueDate = parsedDueDate && !isNaN(parsedDueDate.getTime()) ? parsedDueDate : null;

      const payload = {
        title: title.trim() || `${customerName.trim()}'s Custom ${sizeType} ${isFramed ? 'Framed Poster' : 'Poster'}`,
        itemType,
        image: image || '',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerInstagram: customerInstagram.trim(),
        dimensions: {
          sizeType,
          customWidth: Number(customWidth) || 0,
          customHeight: Number(customHeight) || 0,
          unit: 'in',
        },
        orientation,
        paperFinish,
        framing: {
          isFramed,
          frameColor: isFramed ? (frameColor || 'matte_black') : 'none',
          frameThickness: frameThickness || 'standard_1.25',
          mountBoard: isFramed ? (mountBoard || 'off_white') : 'none',
          glassType: isFramed ? (glassType || 'anti_reflective') : 'none',
        },
        customNotes: customNotes.trim(),
        pricing: {
          basePrice: Number(basePrice) || 0,
          framePrice: Number(framePrice) || 0,
          matPrice: Number(matPrice) || 0,
          glassPrice: Number(glassPrice) || 0,
          totalPrice: Number(totalPrice) || 0,
          advancePaid: Number(advancePaid) || 0,
          balanceDue,
        },
        dueDate: validDueDate,
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

  const currentFrameStyle = isFramed
    ? frameBorderStyles[frameColor] || frameBorderStyles.matte_black
    : 'border-transparent ring-1 ring-zinc-750';
  const currentMatStyle = isFramed
    ? matBackgroundStyles[mountBoard] || matBackgroundStyles.off_white
    : 'p-0';

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
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-zinc-950 flex items-center justify-center font-bold">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {isEditing ? 'Edit Custom Order' : 'New Custom Order'}
              </h2>
              <p className="text-[11px] text-zinc-400">Custom poster & frame specifications</p>
            </div>
          </div>

          <button
            onClick={requestClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 no-scrollbar flex-1">
          {/* Section 1: Customer Details */}
          <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              1. CUSTOMER INFORMATION
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Instagram Handle (Optional)
                </label>
                <div className="relative">
                  <InstagramIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-pink-400" />
                  <input
                    type="text"
                    placeholder="@username"
                    value={customerInstagram}
                    onChange={(e) => setCustomerInstagram(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#121215] border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Target Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121215] border border-zinc-700/80 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  />
                </div>
              </div>
            </div> */}
          </div>

          {/* Section 2: Order Title & Live Artwork Preview Simulator */}
          {/* <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                2. ARTWORK & LIVE FRAME SIMULATOR
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                <Eye className="w-3 h-3 text-amber-400" /> Live Preview
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Order / Artwork Title
              </label>
              <input
                type="text"
                placeholder="e.g. Wedding Anniversary Portrait, Graduation Photo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#121215] border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
              <div
                className={`max-w-[200px] w-full aspect-[4/5] rounded-xl overflow-hidden flex items-center justify-center relative transition-all duration-300 border-8 ${currentFrameStyle} ${currentMatStyle}`}
              >
                {image ? (
                  <img
                    src={image}
                    alt="Custom preview"
                    className="w-full h-full object-cover rounded shadow-inner"
                  />
                ) : (
                  <label className="w-full h-full rounded flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Camera className="w-6 h-6 text-amber-400" />
                    <span className="text-[10px] font-bold">Click to Upload Photo</span>
                  </label>
                )}
              </div>

              {image && (
                <label className="mt-2.5 text-[10px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span>Change Photo</span>
                </label>
              )}
            </div>
          </div> */}

          {/* Section 3: Item Type, Dimensions & Finish */}
          <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              2. ITEM TYPE & DIMENSIONS
            </span>

            {/* Item Type Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'custom_framed_poster', label: '🖼️ Framed Print' },
                { id: 'custom_poster', label: '🎨 Poster Only' },
                { id: 'custom_frame', label: '🔲 Frame Only' },
                { id: 'custom_sticker', label: '✨ Stickers' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setItemType(t.id);
                    if (t.id === 'custom_poster' || t.id === 'custom_sticker') {
                      handleFramedToggle(false);
                    } else {
                      handleFramedToggle(true);
                    }
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${itemType === t.id
                    ? 'bg-amber-400 text-zinc-950 shadow-md'
                    : 'bg-[#121215] text-zinc-400 border border-zinc-800 hover:text-white'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Size Selector */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                Size Tier
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {['A6', 'A5', 'A4', 'A3'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeTypeChange(sz)}
                    className={`py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer ${sizeType === sz
                      ? 'bg-amber-400 text-zinc-950 shadow-sm'
                      : 'bg-[#121215] text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                  >
                    {sz === '12x18' ? '12×18"' : sz === '18x24' ? '18×24"' : sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Dimensions Input if 'custom' selected */}
            {sizeType === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Width (Inches)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Width in"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121215] border border-zinc-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Height (Inches)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Height in"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121215] border border-zinc-700 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* Paper Finish & Orientation */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Paper / Print Finish
                </label>
                <select
                  value={paperFinish}
                  onChange={(e) => setPaperFinish(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#121215] border border-zinc-700 text-xs text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="matte_art">Matte Art Print (300 GSM)</option>
                  <option value="glossy_photo">Glossy Photo Paper (260 GSM)</option>
                  <option value="textured_canvas">Textured Canvas (380 GSM)</option>
                  <option value="metallic_pearl">Metallic Pearl Lustre</option>
                  <option value="holographic">Holographic Vinyl</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Orientation
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['portrait', 'landscape', 'square'].map((or) => (
                    <button
                      key={or}
                      type="button"
                      onClick={() => setOrientation(or)}
                      className={`py-2 rounded-xl text-[11px] font-bold capitalize transition-all cursor-pointer ${orientation === or
                        ? 'bg-zinc-700 text-amber-300 border border-amber-400/50'
                        : 'bg-[#121215] text-zinc-400 border border-zinc-800 hover:text-white'
                        }`}
                    >
                      {or}
                    </button>
                  ))}
                </div>
              </div>
            </div> */}
          </div>

          {/* Section 4: Framing Specifications (If Framed) */}
          {/* {isFramed && (
            <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                4. FRAMING & GLASS OPTIONS
              </span>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                  Frame Style / Material
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'matte_black', label: 'Solid Black', color: 'bg-zinc-900 border-zinc-700' },
                    { id: 'oak_wood', label: 'Oak Natural', color: 'bg-[#b5885c] border-[#8c6239]' },
                    { id: 'antique_gold', label: 'Antique Gold', color: 'bg-[#d4af37] border-[#aa8522]' },
                    { id: 'deep_walnut', label: 'Deep Walnut', color: 'bg-[#4a2e18] border-[#2e1c0e]' },
                    { id: 'pure_white', label: 'Pure White', color: 'bg-white border-zinc-300 text-zinc-950' },
                    { id: 'metallic_silver', label: 'Silver Metal', color: 'bg-zinc-400 border-zinc-500 text-zinc-950' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFrameColor(f.id)}
                      className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${frameColor === f.id
                        ? 'bg-[#2a281c] border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40'
                        : 'bg-[#121215] border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${f.color} shrink-0 border`} />
                      <span className="truncate">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Mount / Mat Board
                  </label>
                  <select
                    value={mountBoard}
                    onChange={(e) => {
                      setMountBoard(e.target.value);
                      recalculatePrice(sizeType, isFramed, e.target.value, glassType);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#121215] border border-zinc-700 text-xs text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="off_white">Off-White Mat (1.5" Border)</option>
                    <option value="pitch_black">Pitch Black Mat (1.5" Border)</option>
                    <option value="cream_dual">Dual Cream Accent Mat</option>
                    <option value="none">No Mat (Full Bleed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Glass Cover
                  </label>
                  <select
                    value={glassType}
                    onChange={(e) => {
                      setGlassType(e.target.value);
                      recalculatePrice(sizeType, isFramed, mountBoard, e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#121215] border border-zinc-700 text-xs text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="anti_reflective">Anti-Reflective Glass (Clear)</option>
                    <option value="clear_acrylic">Shatterproof Acrylic Cover</option>
                    <option value="museum_uv">Museum-Grade 99% UV Glass</option>
                    <option value="none">No Glass</option>
                  </select>
                </div>
              </div>
            </div>
          )} */}

          {/* Section 5: Pricing, Advance Paid & Balance Due */}
          <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              3. PRICING & DEPOSIT
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
                    value={totalPrice}
                    onChange={(e) => {
                      const newTotal = Number(e.target.value) || 0;
                      setTotalPrice(newTotal);
                      setAdvancePaid(Math.round(newTotal / 2)); // Auto half advance
                    }}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#121215] border border-zinc-700 text-sm font-black text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-zinc-300">
                    Adv Pay (₹)
                  </label>

                </div>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
                  <input
                    type="number"
                    min="0"
                    max={totalPrice}
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#121215] border border-zinc-700 text-sm font-black text-emerald-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Quick Deposit Presets */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => setAdvancePaid(Math.round(Number(totalPrice) / 2))}
                className="py-1 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-amber-300 transition-colors cursor-pointer"
              >
                Half Deposit (50%)
              </button>
              <button
                type="button"
                onClick={() => setAdvancePaid(Number(totalPrice))}
                className="py-1 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-emerald-400 transition-colors cursor-pointer"
              >
                Full Paid (100%)
              </button>
            </div>

            {/* Live Balance Summary Banner */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-semibold">Remaining Due Balance:</span>
              <span
                className={`font-black font-mono text-sm ${balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'
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
                placeholder="e.g. Add white margin around couple, high contrast print, gift wrap..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#121215] border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Bottom Submit Action */}
        <div className="p-6 pt-3 border-t border-zinc-800/80 bg-[#121215]">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-[#f59e0b] hover:bg-[#d97706] text-zinc-950 font-black text-sm sm:text-base shadow-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Saving Custom Order...' : isEditing ? 'Save Changes' : 'Create Custom Order'}
          </button>
        </div>
      </div>
    </div>
  );
};
