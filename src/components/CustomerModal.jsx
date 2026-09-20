import React, { useState, useEffect } from 'react';
import { X, User, Phone, FileText } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { api } from '../api/client';

export const CustomerModal = ({ isOpen, onClose, customer, onSaveSuccess }) => {
  const { showToast } = useToast();
  const { shouldRender, isClosing, requestClose } = useModalAnimation(isOpen, onClose);
  const isEditing = Boolean(customer && customer._id);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    instagramHandle: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        instagramHandle: customer.instagramHandle || '',
        notes: customer.notes || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        instagramHandle: '',
        notes: '',
      });
    }
  }, [customer, isOpen]);

  if (!shouldRender) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('Name and phone number are required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const cleanData = {
        ...formData,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        instagramHandle: formData.instagramHandle.trim().replace(/^@/, ''),
        notes: formData.notes.trim(),
      };

      let res;
      if (isEditing) {
        res = await api.updateCustomer(customer._id, cleanData);
      } else {
        res = await api.createCustomer(cleanData);
      }

      if (res.success) {
        showToast(
          isEditing ? `Customer "${formData.name}" updated` : `Customer "${formData.name}" added`,
          'success'
        );
        if (onSaveSuccess) onSaveSuccess(res.data);
        requestClose();
      }
    } catch (error) {
      showToast(error.message || 'Failed to save customer', 'error');
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
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {isEditing ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <p className="text-xs text-zinc-400">Manage buyer details & preferences</p>
            </div>
          </div>
          <button
            onClick={requestClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c22] border border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Phone Number (WhatsApp) *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9811223344"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c22] border border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Instagram Handle (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">@</span>
              <input
                type="text"
                placeholder="username"
                value={formData.instagramHandle}
                onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-[#1c1c22] border border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Notes & Preferences (Optional)
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Loves cyberpunk posters, asks for discounts on framing..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c22] border border-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder-zinc-500 resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Create Customer'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

