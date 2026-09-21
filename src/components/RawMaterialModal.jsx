import React, { useState } from 'react';
import { X, Layers, Plus, CheckCircle2, IndianRupee, Sparkles, Box, Banknote, QrCode } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { formatCurrency } from '../utils/formatters';
import { api } from '../api/client';

export const RawMaterialModal = ({ isOpen, onClose, onSaveSuccess }) => {
  const { showToast } = useToast();
  const { shouldRender, isClosing, requestClose } = useModalAnimation(isOpen, onClose);

  const [category, setCategory] = useState('poster'); // 'poster' | 'frame'
  const [size, setSize] = useState('A4');
  const [count, setCount] = useState(50);
  const [cost, setCost] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'upi'
  const [supplier, setSupplier] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!shouldRender) return null;

  const unitCost = count > 0 && cost > 0 ? (cost / count).toFixed(2) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!count || count <= 0) {
      showToast('Please enter a valid count/quantity', 'error');
      return;
    }
    if (!cost || cost <= 0) {
      showToast('Please enter a valid total cost', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const title = `${count}x ${size} ${category === 'poster' ? 'Poster Paper' : 'Frame Moulding'}`;

      // Save to backend expense collection
      await api.createExpense({
        title,
        category: 'raw_material',
        amount: Number(cost),
        paymentMethod,
        vendor: supplier.trim(),
        isRawMaterial: true,
        rawMaterialDetails: {
          category,
          size,
          count: Number(count),
          unitCost: Number(unitCost),
        },
      }).catch((err) => {
        console.warn('Backend expense creation warning:', err);
      });

      const intakeEntry = {
        id: 'RM-' + Date.now(),
        category,
        size,
        count: Number(count),
        cost: Number(cost),
        unitCost: Number(unitCost),
        paymentMethod,
        supplier: supplier.trim(),
        createdAt: new Date().toISOString(),
      };

      const existingRaw = JSON.parse(localStorage.getItem('auraframe_raw_materials') || '[]');
      existingRaw.unshift(intakeEntry);
      localStorage.setItem('auraframe_raw_materials', JSON.stringify(existingRaw));

      showToast(
        `Added ${count} units of ${size} ${category === 'poster' ? 'Poster Paper' : 'Frame Moulding'} (₹${cost})`,
        'success',
        3000
      );

      if (onSaveSuccess) onSaveSuccess(intakeEntry);
      requestClose();
    } catch (err) {
      showToast('Failed to record raw material: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md no-print ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={requestClose}
    >
      <div
        className={`w-full max-w-md rounded-t-[32px] sm:rounded-[32px] bg-[#141418] border border-zinc-800 shadow-2xl overflow-hidden text-white ${
          isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-zinc-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Raw Material Intake</h3>
              <p className="text-[11px] text-zinc-400">Record incoming paper & frame materials</p>
            </div>
          </div>

          <button
            onClick={requestClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Material Category Switch */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Material Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('poster')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  category === 'poster'
                    ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-sm'
                    : 'bg-[#1c1c22] text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                🖼️ Poster Paper
              </button>

              <button
                type="button"
                onClick={() => setCategory('frame')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  category === 'frame'
                    ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-sm'
                    : 'bg-[#1c1c22] text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                🔲 Frame Moulding
              </button>
            </div>
          </div>

          {/* Size Pills */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Material Size *
            </label>
            <div className="flex gap-2">
              {['A4', 'A5', 'A6', 'Custom'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    size === s
                      ? 'bg-white text-zinc-950 border-white shadow-sm'
                      : 'bg-[#1c1c22] text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Count & Cost 2-Column */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Count (Units) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="50"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1c1c22] border border-zinc-800 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Total Cost (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="500"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1c1c22] border border-zinc-800 text-sm font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Unit Cost Info Box */}
          <div className="p-3.5 rounded-2xl bg-[#1c1c22] border border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Calculated Unit Cost:</span>
            <span className="font-mono font-bold text-amber-300">
              ₹{unitCost} / {category === 'poster' ? 'sheet' : 'piece'}
            </span>
          </div>

          {/* Payment Method Switcher */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Payment Outflow Mode *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-[#1c1c22] border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>💵 Cash Out</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-[#1c1c22] border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>📱 UPI / Online</span>
              </button>
            </div>
          </div>

          {/* Supplier / Notes (Optional) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Supplier / Batch Note (Optional)
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Metro Paper Mart, 300 GSM Matte"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1c1c22] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Record Raw Material</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

