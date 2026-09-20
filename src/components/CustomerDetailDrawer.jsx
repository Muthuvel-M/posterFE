import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  MessageCircle,
  Inbox,
  ShoppingBag,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { formatCurrency } from '../utils/formatters';
import { api } from '../api/client';

export const CustomerDetailDrawer = ({
  isOpen,
  onClose,
  customerId,
  onOpenReceipt,
  onCustomerDeleted,
}) => {
  const { showToast } = useToast();
  const { shouldRender, isClosing, requestClose } = useModalAnimation(isOpen, onClose);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails();
    } else {
      setCustomerData(null);
    }
  }, [isOpen, customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomerById(customerId);
      if (res.success) {
        setCustomerData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerData) return;
    if (!window.confirm(`Are you sure you want to delete customer "${customerData.name}"?`)) return;

    try {
      setDeleting(true);
      const res = await api.deleteCustomer(customerData._id);
      if (res.success) {
        showToast(`Customer "${customerData.name}" deleted`, 'success');
        if (onCustomerDeleted) onCustomerDeleted(customerData._id);
        requestClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete customer', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (!shouldRender) return null;

  const phone = customerData?.phone || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const whatsappMsg = encodeURIComponent(
    `Hello ${customerData?.name || 'there'}! Thank you for shopping with us at AuraFrame Posters & Frames. Feel free to message us here for any orders or framing inquiries.`
  );
  const whatsappUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${whatsappMsg}` : `https://wa.me/?text=${whatsappMsg}`;

  const initial = customerData?.name ? customerData.name.charAt(0).toUpperCase() : 'M';
  const orderCount = customerData?.orderCount || customerData?.sales?.length || 1;
  const totalSpent = customerData?.totalSpent || 0;
  const avgOrder = orderCount > 0 ? Math.round(totalSpent / orderCount) : totalSpent;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md no-print ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={requestClose}
    >
      <div
        className={`w-full max-w-md rounded-t-[32px] sm:rounded-[32px] bg-[#141417] border border-zinc-800/90 shadow-2xl overflow-hidden text-white max-h-[92vh] flex flex-col ${
          isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle Bar & Close */}
        <div className="pt-3 px-6 flex items-center justify-between">
          <div className="w-12 h-1.5 rounded-full bg-zinc-700 mx-auto" />
          <button
            onClick={requestClose}
            className="p-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer -mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : customerData ? (
          <div className="p-6 overflow-y-auto space-y-4 no-scrollbar flex-1">
            {/* Top Customer Info Card */}
            <div className="p-4 rounded-3xl bg-[#1c1c22] border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-[#f59e0b] text-zinc-950 font-black text-xl flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                  {initial}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {customerData.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                    {customerData.phone || 'No phone'}
                  </p>
                </div>
              </div>

              {/* Delete Trash Button */}
              <button
                onClick={handleDeleteCustomer}
                disabled={deleting}
                className="w-10 h-10 rounded-2xl bg-[#26262e] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Delete customer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
              </button>
            </div>

            {/* 3 Metrics Box Row (grid-cols-3) */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-4 rounded-2xl bg-[#1c1c22] border border-zinc-800/80 text-center">
                <div className="text-lg font-black text-white">
                  {orderCount}
                </div>
                <span className="text-[11px] text-zinc-400 mt-0.5 block font-medium">
                  Orders
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#1c1c22] border border-zinc-800/80 text-center">
                <div className="text-lg font-black text-emerald-400">
                  {formatCurrency(totalSpent)}
                </div>
                <span className="text-[11px] text-zinc-400 mt-0.5 block font-medium">
                  Spent
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#1c1c22] border border-zinc-800/80 text-center">
                <div className="text-lg font-black text-white">
                  {formatCurrency(avgOrder)}
                </div>
                <span className="text-[11px] text-zinc-400 mt-0.5 block font-medium">
                  Avg. order
                </span>
              </div>
            </div>

            {/* Big Green Send WhatsApp Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#22c55e] hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-white text-[#22c55e]" />
              <span>Send WhatsApp</span>
            </a>

            {/* Section: Purchase History */}
            <div className="pt-2 space-y-2.5">
              <h4 className="text-sm font-bold text-white">
                Purchase History
              </h4>

              {customerData.sales && customerData.sales.length > 0 ? (
                <div className="space-y-2">
                  {customerData.sales.map((sale) => {
                    const totalQty = sale.items?.reduce((acc, item) => acc + item.qty, 0) || 1;

                    return (
                      <div
                        key={sale._id}
                        onClick={() => onOpenReceipt && onOpenReceipt(sale)}
                        className="p-3.5 rounded-2xl bg-[#1c1c22] hover:bg-[#26262e] border border-zinc-800/80 flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                            <ShoppingBag className="w-4 h-4 text-zinc-400" />
                          </div>
                          <div>
                            <span className="text-xs font-mono font-bold text-white block group-hover:text-amber-300 transition-colors">
                              {sale.saleNumber}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {totalQty} {totalQty === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-400">
                            {formatCurrency(sale.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#1c1c22] text-center text-xs text-zinc-500">
                  No orders recorded yet.
                </div>
              )}
            </div>

            {/* Bottom Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={requestClose}
                className="w-full py-3.5 rounded-2xl bg-[#1c1c22] hover:bg-zinc-800 text-zinc-300 font-bold text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};


