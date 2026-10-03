import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Plus,
  Trash2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { api } from '../api/client';
import { getProductInitial } from '../utils/formatters';

export const ProductModal = ({ isOpen, onClose, product, onSaveSuccess }) => {
  const { showToast } = useToast();
  const { shouldRender, isClosing, requestClose } = useModalAnimation(isOpen, onClose);
  const isEditing = Boolean(product && product._id);

  // Form states matching poster & frame catalog
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Poster');
  const [size, setSize] = useState('A4');

  // Prices & Stock
  const [sellPrice, setSellPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [operatingCost, setOperatingCost] = useState(0);
  const [stock, setStock] = useState(20);



  // Variations toggle & tiers
  const [hasVariations, setHasVariations] = useState(false);
  const [variations, setVariations] = useState([
    { size: 'A4', name: 'A4 Poster', sellPrice: 40, costPrice: 15, stock: 25 },
    { size: 'A5', name: 'A5 Poster', sellPrice: 25, costPrice: 10, stock: 30 },
    { size: 'A6', name: 'A6 Poster', sellPrice: 20, costPrice: 8, stock: 40 },
  ]);

  // Combo Offers
  const [comboTiers, setComboTiers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategory(product.category === 'frame' ? 'Frame' : product.category || 'Poster');
      setSize(product.size || 'A4');
      setSellPrice(product.sellPrice ?? 0);
      setCostPrice(product.costPrice ?? 0);
      setOperatingCost(product.operatingCost ?? 0);
      setStock(product.stock ?? 0);
      setHasVariations(Boolean(product.hasVariations));
      if (product.variations && product.variations.length > 0) {
        setVariations(product.variations);
      }
      if (product.comboOffers && product.comboOffers.length > 0) {
        setComboTiers(product.comboOffers);
      }
    } else {
      // Default new product
      setName('');
      setCategory('Poster');
      setSize('A4');
      setSellPrice(40);
      setCostPrice(15);
      setOperatingCost(0);
      setStock(25);
      setHasVariations(false);
      setVariations([
        { size: 'A4', name: 'A4 Size', sellPrice: 40, costPrice: 15, stock: 25 },
        { size: 'A5', name: 'A5 Size', sellPrice: 25, costPrice: 10, stock: 30 },
        { size: 'A6', name: 'A6 Size', sellPrice: 20, costPrice: 8, stock: 40 },
      ]);
      setComboTiers([]);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    const lower = cat.toLowerCase();
    if (lower.includes('sticker')) {
      // Stickers default to ₹15 and ₹30
      if (!isEditing) {
        setSellPrice(15);
        setCostPrice(5);
        setSize('₹15');
        setStock(50);
      }
      setVariations([
        { size: '₹15', name: '₹15 Small Sticker', sellPrice: 15, costPrice: 5, stock: 50 },
        { size: '₹30', name: '₹30 Premium Sticker', sellPrice: 30, costPrice: 10, stock: 50 },
      ]);
    } else if (lower.includes('frame')) {
      // Frames default to A4, A5
      if (!isEditing) {
        setSellPrice(180);
        setCostPrice(80);
        setSize('A4');
        setStock(15);
      }
      setVariations([
        { size: 'A4', name: 'A4 Frame', sellPrice: 180, costPrice: 80, stock: 15 },
        { size: 'A5', name: 'A5 Frame', sellPrice: 140, costPrice: 65, stock: 12 },
      ]);
    } else {
      // Posters default to A4, A5, A6
      if (!isEditing) {
        setSellPrice(40);
        setCostPrice(15);
        setSize('A4');
        setStock(25);
      }
      setVariations([
        { size: 'A4', name: 'A4 Poster', sellPrice: 40, costPrice: 15, stock: 25 },
        { size: 'A5', name: 'A5 Poster', sellPrice: 25, costPrice: 10, stock: 30 },
        { size: 'A6', name: 'A6 Poster', sellPrice: 20, costPrice: 8, stock: 40 },
      ]);
    }
  };

  const handleSelectStickerPreset = (presetPrice) => {
    setSellPrice(presetPrice);
    setSize(`₹${presetPrice}`);
    setCostPrice(presetPrice === 15 ? 5 : 10);
  };

  const handleAddComboTier = () => {
    const nextQty = comboTiers.length === 0 ? 3 : comboTiers[comboTiers.length - 1].minQty + 2;
    const nextPrice = Number(sellPrice) > 0 ? (Number(sellPrice) * nextQty * 0.85).toFixed(0) : 100;
    setComboTiers([...comboTiers, { minQty: nextQty, bundlePrice: Number(nextPrice) }]);
  };

  const handleRemoveComboTier = (index) => {
    setComboTiers(comboTiers.filter((_, i) => i !== index));
  };

  const handleUpdateComboTier = (index, field, val) => {
    const updated = [...comboTiers];
    updated[index] = { ...updated[index], [field]: Number(val) || 0 };
    setComboTiers(updated);
  };

  const handleUpdateVariation = (index, field, val) => {
    const updated = [...variations];
    updated[index] = {
      ...updated[index],
      [field]: field === 'name' || field === 'size' ? val : Number(val) || 0,
    };
    setVariations(updated);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const catLower = category.toLowerCase();
      const normalizedCategory = catLower.includes('frame')
        ? 'frame'
        : catLower.includes('sticker')
        ? 'sticker'
        : 'poster';

      const payload = {
        name: name.trim(),
        category: normalizedCategory,
        size: size || 'A4',
        image: '',
        costPrice: Number(costPrice) || 0,
        sellPrice: Number(sellPrice) || 0,
        operatingCost: Number(operatingCost) || 0,
        stock: Number(stock) || 0,
        hasVariations,
        variations: hasVariations ? variations : [],
        comboOffers: comboTiers,
        active: true,
      };

      let res;
      if (isEditing) {
        res = await api.updateProduct(product._id, payload);
      } else {
        res = await api.createProduct(payload);
      }

      if (res.success) {
        showToast(
          isEditing ? `Updated "${name}" successfully` : `Created "${name}" successfully`,
          'success'
        );
        if (onSaveSuccess) onSaveSuccess(res.data);
        requestClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
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
        className={`w-full max-w-md rounded-t-[32px] sm:rounded-[32px] bg-[#121215] border border-zinc-800 shadow-2xl overflow-hidden text-white max-h-[92vh] flex flex-col my-0 sm:my-auto ${
          isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-xl font-black tracking-tight text-white">
            {isEditing ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={requestClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 no-scrollbar flex-1">
          {/* Size initial preview (no product photo) */}
          <div className="flex justify-center">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#1c1c22] border border-zinc-800 flex flex-col items-center justify-center shadow-inner">
              <span
                className={`font-black tracking-tight ${
                  getProductInitial({ name, size, category, sellPrice }).length <= 2
                    ? 'text-4xl'
                    : 'text-3xl'
                } ${
                  category.toLowerCase().includes('sticker')
                    ? 'text-fuchsia-300'
                    : category.toLowerCase().includes('frame')
                    ? 'text-sky-300'
                    : 'text-amber-300'
                }`}
              >
                {getProductInitial({ name, size, category, sellPrice })}
              </span>
              <span className="text-[10px] font-semibold text-zinc-500 mt-1 uppercase tracking-wider">
                Preview
              </span>
            </div>
          </div>

          {/* Product Name * */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder={category.toLowerCase().includes('sticker') ? "e.g. Anime Holographic Sticker, Chibi Character" : "e.g. Cyberpunk Synthwave, Minimalist Frame"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#1c1c22] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
            />
          </div>

          {/* Category Selector: Poster, Frame & Sticker */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Category *
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleCategorySelect('Poster')}
                className={`py-3 px-2 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                  category.toLowerCase().includes('poster')
                    ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-400/20'
                    : 'bg-[#1c1c22] text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                🖼️ Poster
              </button>

              <button
                type="button"
                onClick={() => handleCategorySelect('Frame')}
                className={`py-3 px-2 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                  category.toLowerCase().includes('frame')
                    ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-400/20'
                    : 'bg-[#1c1c22] text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                🔲 Frame
              </button>

              <button
                type="button"
                onClick={() => handleCategorySelect('Sticker')}
                className={`py-3 px-2 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                  category.toLowerCase().includes('sticker')
                    ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-400/20'
                    : 'bg-[#1c1c22] text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                ✨ Sticker
              </button>
            </div>
          </div>

          {/* Sticker Price Presets (₹15 & ₹30) */}
          {category.toLowerCase().includes('sticker') && (
            <div className="p-3.5 rounded-2xl bg-[#1c1c22] border border-zinc-800 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                STICKER PRICING TIER (₹15 / ₹30)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectStickerPreset(15)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    Number(sellPrice) === 15
                      ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                      : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                >
                  <span>✨ ₹15 Sticker</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStickerPreset(30)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    Number(sellPrice) === 30
                      ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                      : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                >
                  <span>🌟 ₹30 Sticker</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-SKUs & Variations Card (Exact design from Image) */}
          {/* <div className="p-4 rounded-2xl bg-[#1c1c22] border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white">Sub-SKUs & Variations</span>
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Add sizes/options (A4, A5, A6) with separate prices & stock
                </p>
              </div>

              
              <button
                type="button"
                onClick={() => setHasVariations(!hasVariations)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${hasVariations ? 'bg-amber-400' : 'bg-zinc-700'
                  }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${hasVariations ? 'left-6.5' : 'left-0.5'
                    }`}
                />
              </button>
            </div>
            {hasVariations && (
              <div className="pt-2 space-y-2 border-t border-zinc-800">
                {variations.map((v, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#26262e] border border-zinc-700/60 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-white">
                      <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">
                        {v.size} Size
                      </span>
                      <span>Stock: {v.stock} units</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400">Sell Price (₹)</label>
                        <input
                          type="number"
                          value={v.sellPrice}
                          onChange={(e) => handleUpdateVariation(i, 'sellPrice', e.target.value)}
                          className="w-full mt-0.5 px-2 py-1 rounded bg-[#1c1c22] border border-zinc-700 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400">Cost Price (₹)</label>
                        <input
                          type="number"
                          value={v.costPrice}
                          onChange={(e) => handleUpdateVariation(i, 'costPrice', e.target.value)}
                          className="w-full mt-0.5 px-2 py-1 rounded bg-[#1c1c22] border border-zinc-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400">Stock (Units)</label>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => handleUpdateVariation(i, 'stock', e.target.value)}
                          className="w-full mt-0.5 px-2 py-1 rounded bg-[#1c1c22] border border-zinc-700 text-emerald-400 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div> */}

          {/* Row 1: Sell Price * & Cost Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Sell Price *
              </label>
              <input
                type="number"
                min="0"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1c1c22] border border-zinc-800 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Cost Price
              </label>
              <input
                type="number"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1c1c22] border border-zinc-800 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Row 2: Operating Cost & Stock * */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Operating Cost
              </label>
              <input
                type="number"
                min="0"
                value={operatingCost}
                onChange={(e) => setOperatingCost(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1c1c22] border border-zinc-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Stock *
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1c1c22] border border-zinc-800 text-sm font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* COMBO OFFERS Section (Exact layout from Image) */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                COMBO OFFERS
              </span>
              <button
                type="button"
                onClick={handleAddComboTier}
                className="px-3 py-1 rounded-xl bg-[#26262e] hover:bg-zinc-700 text-amber-400 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Tier</span>
              </button>
            </div>

            {comboTiers.length === 0 ? (
              <p className="text-center text-xs italic text-zinc-500 py-3">
                No combo offers set
              </p>
            ) : (
              <div className="space-y-2">
                {comboTiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1c1c22] border border-zinc-800 text-xs"
                  >
                    <span className="text-zinc-400 font-semibold">Buy</span>
                    <input
                      type="number"
                      min="2"
                      value={tier.minQty}
                      onChange={(e) => handleUpdateComboTier(idx, 'minQty', e.target.value)}
                      className="w-14 px-2 py-1 rounded bg-[#26262e] text-white font-bold text-center"
                    />
                    <span className="text-zinc-400 font-semibold">for ₹</span>
                    <input
                      type="number"
                      min="1"
                      value={tier.bundlePrice}
                      onChange={(e) => handleUpdateComboTier(idx, 'bundlePrice', e.target.value)}
                      className="w-20 px-2 py-1 rounded bg-[#26262e] text-emerald-400 font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveComboTier(idx)}
                      className="p-1 rounded text-rose-400 hover:bg-rose-500/10 ml-auto cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Large Rounded Bottom Action Button */}
        <div className="p-6 pt-2 border-t border-zinc-800/80 bg-[#121215]">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-[#8c6225] hover:bg-[#a1712a] text-white font-black text-base shadow-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
};
