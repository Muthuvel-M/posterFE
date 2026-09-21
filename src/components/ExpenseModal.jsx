import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  IndianRupee,
  Calendar,
  Tag,
  Building2,
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  Box,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { api } from '../api/client';

export const EXPENSE_CATEGORIES = [
  { id: 'raw_material', label: 'Raw Materials', icon: '📦', desc: 'Paper, frames, glass' },
  { id: 'printing_supplies', label: 'Printing & Inks', icon: '🖨️', desc: 'Inks, toners, heads' },
  { id: 'packaging', label: 'Packaging', icon: '🛍️', desc: 'Tapes, bubble wrap, boxes' },
  { id: 'rent', label: 'Shop Rent', icon: '🏪', desc: 'Monthly store rent' },
  { id: 'electricity_utilities', label: 'Electricity & Utilities', icon: '⚡', desc: 'Power, water, internet' },
  { id: 'salary', label: 'Salary / Labor', icon: '👥', desc: 'Staff wages & helpers' },
  { id: 'maintenance', label: 'Tools & Repairs', icon: '🔧', desc: 'Blades, framing tools' },
  { id: 'marketing', label: 'Marketing & Ads', icon: '📢', desc: 'Instagram ads, flyers' },
  { id: 'transport_shipping', label: 'Transport / Courier', icon: '🚚', desc: 'Logistics, delivery' },
  { id: 'other', label: 'Miscellaneous', icon: '💡', desc: 'Other store expenses' },
];

export const ExpenseModal = ({
  isOpen,
  onClose,
  expense = null,
  onSaveSuccess,
}) => {
  const { showToast } = useToast();
  const { shouldRender, isClosing, requestClose } = useModalAnimation(isOpen, onClose);
  const isEditing = Boolean(expense && expense._id);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('raw_material');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'upi'
  const [expenseDate, setExpenseDate] = useState('');
  const [vendor, setVendor] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const safeDateToInput = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (expense) {
      setTitle(expense.title || '');
      setCategory(expense.category || 'other');
      setAmount(expense.amount !== undefined ? String(expense.amount) : '');
      setPaymentMethod(expense.paymentMethod || 'cash');
      setExpenseDate(safeDateToInput(expense.expenseDate || expense.createdAt));
      setVendor(expense.vendor || '');
      setBillNumber(expense.billNumber || '');
      setNotes(expense.notes || '');
    } else {
      setTitle('');
      setCategory('raw_material');
      setAmount('');
      setPaymentMethod('cash');
      setExpenseDate(safeDateToInput(new Date()));
      setVendor('');
      setBillNumber('');
      setNotes('');
    }
  }, [expense, isOpen]);

  if (!shouldRender) return null;

  const handleDatePreset = (daysOffset) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    setExpenseDate(safeDateToInput(target));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter an expense title', 'error');
      return;
    }

    const numAmt = Number(amount);
    if (!amount || isNaN(numAmt) || numAmt <= 0) {
      showToast('Please enter a valid expense amount greater than 0', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        category,
        amount: numAmt,
        paymentMethod,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        vendor: vendor.trim(),
        billNumber: billNumber.trim(),
        notes: notes.trim(),
      };

      let res;
      if (isEditing) {
        res = await api.updateExpense(expense._id, payload);
      } else {
        res = await api.createExpense(payload);
      }

      if (res.success) {
        showToast(
          isEditing ? 'Expense updated successfully' : 'Expense recorded successfully',
          'success'
        );
        if (onSaveSuccess) onSaveSuccess(res.data);
        requestClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/20">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {isEditing ? 'Edit Expense' : 'Record Expense'}
              </h2>
              <p className="text-[11px] text-zinc-400">Track store outflows & in-hand cash</p>
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 no-scrollbar flex-1">
          {/* Amount Hero Input */}
          <div className="p-4 rounded-2xl bg-[#18181f] border border-zinc-800/80 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-rose-400">
              EXPENSE AMOUNT (₹) *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xl font-bold text-rose-400">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#121215] border border-zinc-700/80 text-2xl font-black text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Expense Description / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 300 GSM Matte Paper (100 sheets), Shop Rent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181f] border border-zinc-800 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Payment Method Switcher (Cash vs UPI) */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Payment Method (Affects In-Hand Cash) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-[#18181f] border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>💵 Cash Out (Drawer)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-[#18181f] border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>📱 UPI / Bank Online</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-400">
              {paymentMethod === 'cash'
                ? 'ℹ️ Paying via cash directly deducts from your physical in-hand cash balance.'
                : 'ℹ️ Paid online via UPI or Bank transfer (does not affect physical cash drawer).'}
            </p>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Category *
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2a281c] border-amber-400 text-white shadow-md ring-1 ring-amber-400/30'
                        : 'bg-[#18181f] border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-base shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold block truncate">{cat.label}</span>
                      <span className="text-[9px] text-zinc-400 block truncate">{cat.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker + Shortcuts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Expense Date *
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDatePreset(0)}
                  className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-amber-300 transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset(-1)}
                  className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-400 transition-colors"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181f] border border-zinc-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 [color-scheme:dark]"
            />
          </div>

          {/* Vendor & Bill Number (2-Column) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                Vendor / Supplier
              </label>
              <input
                type="text"
                placeholder="e.g. Metro Paper Mart"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#18181f] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
                Bill / Invoice #
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2024-99"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#18181f] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Additional Notes
            </label>
            <textarea
              rows={2}
              placeholder="Any additional notes or batch details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18181f] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-500 hover:from-rose-400 hover:to-yellow-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isEditing ? 'Update Expense' : 'Save Expense Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
