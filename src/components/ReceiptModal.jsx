import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  MessageCircle,
  Share2,
  Download,
  Check,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { shareReceiptOnWhatsApp, directPrintReceipt } from '../utils/pdfReceiptGenerator';
import logoImg from '../assets/2.png';

export const ReceiptModal = ({ settings }) => {
  const { completedSale, isReceiptModalOpen, closeReceiptModal } = useCart();
  const { showToast } = useToast();
  const [sharing, setSharing] = useState(false);

  const { shouldRender, isClosing, requestClose } = useModalAnimation(
    isReceiptModalOpen,
    closeReceiptModal
  );

  if (!shouldRender || !completedSale) return null;

  const businessName = settings?.businessName && !settings.businessName.includes('Muthuvel')
    ? settings.businessName
    : 'AuraFrame26';
  const saleNumber = completedSale.saleNumber || 'INV-0001';
  const customerName =
    completedSale.customerSnapshot?.name ||
    completedSale.customer?.name ||
    completedSale.customerName ||
    'Walk-in Customer';
  const customerPhone =
    completedSale.customerSnapshot?.phone ||
    completedSale.customer?.phone ||
    completedSale.phone ||
    completedSale.customerPhone ||
    '';

  const saleDate = completedSale.createdAt
    ? new Date(completedSale.createdAt)
    : new Date();

  const dateStr = saleDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const timeStr = saleDate
    .toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();

  const paymentMethodStr = completedSale.paymentMethod?.toUpperCase() || 'UPI';

  const handlePrint = async () => {
    await directPrintReceipt('printable-receipt', showToast);
  };

  const handleWhatsAppSharePDF = async () => {
    try {
      setSharing(true);
      await shareReceiptOnWhatsApp({
        elementId: 'printable-receipt',
        orderNumber: saleNumber,
        customerPhone,
        customerName,
        isCustom: false,
        showToast,
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md print-modal-overlay overflow-hidden ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={requestClose}
    >
      <div
        className={`w-full max-w-md rounded-t-[32px] sm:rounded-[32px] bg-[#fafaf9] text-zinc-900 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] print-modal-container ${
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

          <h2 className="text-base font-bold text-zinc-900">Digital Receipt</h2>

          <button
            onClick={requestClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <span className="text-lg leading-none font-medium">&times;</span>
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div
          className="p-6 overflow-y-auto space-y-4 no-scrollbar flex-1 print-card bg-white"
          id="printable-receipt"
        >
          {/* Store Logo & Title */}
          <div className="text-center pt-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto shadow-md mb-2.5 border border-zinc-200/80 bg-red-600 flex items-center justify-center">
              <img src={logoImg} alt="Aura Frame" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-zinc-900">
              {businessName}
            </h3>
            <p className="text-[11px] text-zinc-500 font-medium">
              Posters &middot; Framing &middot; Art Decor
            </p>
          </div>

          {/* Dotted Separator */}
          <div className="text-center text-zinc-300 text-xs tracking-widest select-none py-0.5">
            ••••••••••••••••••••••••••••••••••••
          </div>

          {/* 3-Column Metadata Row */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">
                Receipt
              </span>
              <span className="font-bold text-xs sm:text-sm text-zinc-900 block mt-0.5 font-mono">
                #{saleNumber}
              </span>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">
                Date
              </span>
              <span className="font-bold text-xs sm:text-sm text-zinc-900 block mt-0.5">
                {dateStr}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">
                Customer
              </span>
              <span className="font-bold text-xs sm:text-sm text-zinc-900 block mt-0.5 truncate">
                {customerName}
              </span>
            </div>
          </div>

          {/* Items Section */}
          <div className="pt-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
              ORDER ITEMS
            </h4>

            <div className="space-y-3">
              {(completedSale.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 text-xs border-b border-zinc-100 pb-2.5 last:border-0"
                >
                  <div>
                    <h5 className="font-bold text-sm text-zinc-900 leading-snug">
                      {item.name}
                    </h5>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Size: <strong className="text-zinc-700">{item.size || 'Standard'}</strong> &times; {item.qty} (@ ₹{item.sellPrice})
                    </p>
                  </div>

                  <span className="font-bold font-mono text-sm text-zinc-900 shrink-0">
                    ₹{item.qty * item.sellPrice}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary Box */}
          <div className="p-4 rounded-2xl bg-[#f8fafc] border border-zinc-200/80 space-y-2">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Subtotal</span>
              <span className="font-mono font-medium text-zinc-800">₹{completedSale.subtotal}</span>
            </div>

            {completedSale.discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-medium">
                <span>Discount Applied</span>
                <span className="font-mono">-₹{completedSale.discount}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-base font-bold text-zinc-950 pt-1.5 border-t border-zinc-200/80">
              <span>Total Paid</span>
              <span className="text-lg font-black font-mono text-zinc-950">₹{completedSale.total}</span>
            </div>
          </div>

          {/* Paid Via Status Banner */}
          <div className="p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-[#059669]">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span>Paid via {paymentMethodStr}</span>
            </div>
            <span className="text-[#059669] font-medium">{timeStr}</span>
          </div>

          {/* Custom Brand Glow & Tag Note Banner */}
          <div className="p-3.5 rounded-2xl bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] text-center space-y-1">
            <p className="font-bold text-xs">Thank you, {customerName}! 💛</p>
            <p className="text-[11px] leading-relaxed">
              Your AuraFrame order is confirmed, and your receipt is attached. 🧾
            </p>
            <p className="text-[11px]">
              Hope your walls glow with your new posters! ✨
            </p>
            <p className="text-[11px] font-bold text-[#b45309] pt-0.5">
              Tag us @aura.frame26 when you put them up 📸
            </p>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 pt-3 border-t border-zinc-200/70 bg-white flex items-center gap-2.5 no-print">
          {/* WhatsApp Share PDF Button */}
          <button
            onClick={handleWhatsAppSharePDF}
            disabled={sharing}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-green-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Share PDF Receipt on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-white/20 shrink-0" />
            <span>{sharing ? 'Generating PDF...' : 'WhatsApp Share PDF'}</span>
          </button>

          {/* Save / Print PDF */}
          <button
            onClick={handlePrint}
            className="py-3 px-4 rounded-2xl bg-[#18181b] hover:bg-[#27272a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer border border-zinc-800 shrink-0"
            title="Save PDF / Print"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
