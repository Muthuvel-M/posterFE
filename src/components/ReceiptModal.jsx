import React from 'react';
import {
  ArrowLeft,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { generateWhatsAppReceiptUrl } from '../utils/formatters';
import logoImg from '../assets/2.png';

export const ReceiptModal = ({ settings }) => {
  const { completedSale, isReceiptModalOpen, closeReceiptModal } = useCart();
  const { shouldRender, isClosing, requestClose } = useModalAnimation(
    isReceiptModalOpen,
    closeReceiptModal
  );

  if (!shouldRender || !completedSale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const url = generateWhatsAppReceiptUrl(completedSale, settings);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const businessName = settings?.businessName || 'Muthuvel M';
  const initials =
    businessName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'MU';

  const saleNumber = completedSale.saleNumber || 'INV-0001';
  const customerName =
    completedSale.customerSnapshot?.name ||
    completedSale.customer?.name ||
    'muthu';

  // Format date: e.g. 20 Sept 2026
  const saleDate = completedSale.createdAt
    ? new Date(completedSale.createdAt)
    : new Date();
  const dateStr = saleDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Format time: e.g. 09:16 pm
  const timeStr = saleDate
    .toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();

  const paymentMethodStr = completedSale.paymentMethod?.toUpperCase() || 'UPI';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md no-print overflow-hidden ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={requestClose}
    >
      <div
        className={`w-full max-w-md rounded-t-[32px] sm:rounded-[32px] bg-[#fafaf9] text-zinc-900 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] ${
          isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-200/70 bg-white no-print">
          <button
            onClick={requestClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <h2 className="text-base font-bold text-zinc-900">Receipt</h2>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-200"
            title="Save or Print PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Save PDF</span>
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div
          className="p-6 overflow-y-auto space-y-5 no-scrollbar flex-1 print-card bg-white"
          id="printable-receipt"
        >
          {/* Store Squircle Avatar & Title */}
          <div className="text-center pt-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto shadow-md mb-3 border border-zinc-200/80 bg-red-600 flex items-center justify-center">
              <img src={logoImg} alt="Aura Frame" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-zinc-900">
              {businessName}
            </h3>
          </div>

          {/* Dotted Separator */}
          <div className="text-center text-zinc-300 text-xs tracking-widest select-none py-1">
            ••••••••••••••••••••••••••
          </div>

          {/* 3-Column Metadata Row */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[11px] text-zinc-400 font-normal block">
                Receipt no.
              </span>
              <span className="font-bold text-sm text-zinc-900 block mt-1">
                #{saleNumber}
              </span>
            </div>

            <div className="text-center">
              <span className="text-[11px] text-zinc-400 font-normal block">
                Date
              </span>
              <span className="font-bold text-sm text-zinc-900 block mt-1">
                {dateStr}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-zinc-400 font-normal block">
                Customer
              </span>
              <span className="font-bold text-sm text-zinc-900 block mt-1 truncate">
                {customerName}
              </span>
            </div>
          </div>

          {/* Items Section */}
          <div className="pt-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              ITEMS
            </h4>

            <div className="space-y-4">
              {(completedSale.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <h5 className="font-bold text-base text-zinc-900">
                      {item.name}
                    </h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      × {item.qty} · {item.sku || `SKU-${9000 + idx}`}
                    </p>
                  </div>

                  <span className="font-bold text-base text-zinc-900 shrink-0">
                    ₹{item.qty * item.sellPrice}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary Box */}
          <div className="p-4 rounded-2xl bg-[#f5f5f2] space-y-3">
            <div className="flex justify-between text-sm text-zinc-500 font-normal">
              <span>Subtotal</span>
              <span className="text-zinc-700 font-medium">₹{completedSale.subtotal}</span>
            </div>

            {completedSale.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span>Discount Applied</span>
                <span>-₹{completedSale.discount}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-lg font-bold text-zinc-950 pt-1">
              <span>Total paid</span>
              <span className="text-xl font-bold">₹{completedSale.total}</span>
            </div>
          </div>

          {/* Paid Via Status Banner */}
          <div className="p-3.5 rounded-2xl bg-[#ebfbf3] border border-[#a7f3d0] flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-semibold text-[#059669]">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span>Paid via {paymentMethodStr}</span>
            </div>
            <span className="text-[#059669] font-normal text-xs">{timeStr}</span>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 pb-1 space-y-1">
            <p className="text-sm italic text-zinc-400 font-serif">
              Thank you for shopping! ✦
            </p>
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wide">
              TXN · {saleNumber}
            </p>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 pt-3 border-t border-zinc-200/70 bg-white grid grid-cols-2 gap-3 no-print">
          <button
            onClick={handleWhatsAppShare}
            className="py-3.5 px-4 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white/20" />
            <span>Message</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-3.5 px-4 rounded-2xl bg-[#18181b] hover:bg-[#27272a] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Send PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
