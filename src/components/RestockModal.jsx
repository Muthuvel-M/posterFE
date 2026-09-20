import React, { useState } from 'react';
import { X, PackagePlus, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { api } from '../api/client';

export const RestockModal = ({ isOpen, onClose, product, onRestockSuccess }) => {
  const { showToast } = useToast();
  const { shouldRender, isClosing, requestClose } = useModalAnimation(isOpen, onClose);
  const [adjustment, setAdjustment] = useState(10);
  const [isDeduct, setIsDeduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!shouldRender || !product) return null;

  const currentStock = product.stock;
  const changeValue = isDeduct ? -Math.abs(Number(adjustment) || 0) : Math.abs(Number(adjustment) || 0);
  const projectedStock = Math.max(0, currentStock + changeValue);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (changeValue === 0) {
      showToast('Adjustment must not be zero', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.updateStock(product._id, changeValue);
      if (res.success) {
        showToast(
          isDeduct
            ? `Deducted ${Math.abs(changeValue)} units from "${product.name}"`
            : `Restocked +${changeValue} units of "${product.name}"`,
          'success'
        );
        if (onRestockSuccess) onRestockSuccess(res.data);
        requestClose();
      }
    } catch (error) {
      showToast(error.message || 'Failed to update stock', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md no-print ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={requestClose}
    >
      <div
        className={`glass-modal w-full max-w-sm rounded-t-[32px] sm:rounded-3xl overflow-hidden shadow-2xl ${
          isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Adjust Stock</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{product.name}</p>
            </div>
          </div>
          <button
            onClick={requestClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current vs Projected Stock Preview */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100/80 dark:bg-slate-800/60 p-3 rounded-2xl text-center border border-slate-200/60 dark:border-slate-700/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Current</span>
              <div className="text-xl font-extrabold text-slate-700 dark:text-slate-300">{currentStock}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">New Total</span>
              <div
                className={`text-xl font-extrabold ${
                  projectedStock > currentStock
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : projectedStock < currentStock
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-700'
                }`}
              >
                {projectedStock}
              </div>
            </div>
          </div>

          {/* Restock vs Deduct Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsDeduct(false)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                !isDeduct
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Restock (+)
            </button>
            <button
              type="button"
              onClick={() => setIsDeduct(true)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                isDeduct
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> Deduct (-)
            </button>
          </div>

          {/* Quick Preset Pills */}
          <div className="flex gap-2">
            {[5, 10, 25, 50].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setAdjustment(num)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  adjustment === num
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {isDeduct ? `-${num}` : `+${num}`}
              </button>
            ))}
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quantity Quantity
            </label>
            <input
              type="number"
              min="1"
              required
              value={adjustment}
              onChange={(e) => setAdjustment(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100 text-center"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-60 ${
              isDeduct
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Confirm {isDeduct ? 'Deduction' : 'Restock'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
