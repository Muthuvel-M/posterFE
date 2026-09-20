import React, { useState } from 'react';
import { X, Search, UserPlus, Check, User, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { api } from '../api/client';

export const QuickCustomerModal = ({ isOpen, onClose, customers = [], onCustomerCreated }) => {
  const { customer, setCustomer } = useCart();
  const { showToast } = useToast();
  const { shouldRender, isClosing, requestClose } = useModalAnimation(isOpen, onClose);

  const [mode, setMode] = useState('select'); // 'select' | 'create'
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!shouldRender) return null;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.instagramHandle && c.instagramHandle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (cust) => {
    setCustomer(cust);
    showToast(`Attached customer "${cust.name}"`, 'success');
    requestClose();
  };

  const handleClearCustomer = () => {
    setCustomer(null);
    showToast('Customer detached (Walk-in mode)', 'info');
    requestClose();
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast('Name and phone are required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        instagramHandle: instagramHandle.trim().replace(/^@/, ''),
      });

      if (res.success && res.data) {
        showToast(`Customer "${res.data.name}" added and attached!`, 'success');
        setCustomer(res.data);
        if (onCustomerCreated) onCustomerCreated(res.data);
        requestClose();
      }
    } catch (error) {
      showToast(error.message || 'Failed to create customer', 'error');
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
        className={`glass-modal w-full max-w-md rounded-t-[32px] sm:rounded-3xl overflow-hidden shadow-2xl ${
          isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
              <User className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {mode === 'select' ? 'Select Customer' : 'Add New Customer'}
            </h3>
          </div>
          <button
            onClick={requestClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="p-3 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('select')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'select'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Search Directory ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'create'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            + Quick Add
          </button>
        </div>

        {mode === 'select' ? (
          <div className="p-4 sm:p-5">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, phone or @instagram..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {customer && (
                <div className="mb-2 p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-brand-700 dark:text-brand-300 block">
                      Currently Attached: {customer.name}
                    </span>
                    <span className="text-slate-500">{customer.phone}</span>
                  </div>
                  <button
                    onClick={handleClearCustomer}
                    className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    Detach
                  </button>
                </div>
              )}

              {filteredCustomers.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No customers found. Switch to "+ Quick Add" to create one.
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleSelect(c)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      customer?._id === c._id
                        ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-400 dark:border-brand-600'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-brand-400'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {c.phone} {c.instagramHandle && `• @${c.instagramHandle}`}
                      </p>
                    </div>
                    {customer?._id === c._id && (
                      <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateCustomer} className="p-4 sm:p-5 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number (WhatsApp) *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9811223344"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instagram Handle (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-600/25 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Save & Attach Customer</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
