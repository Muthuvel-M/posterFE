import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  MessageCircle,
  Truck,
  Download,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { formatDate } from '../utils/formatters';
import { shareReceiptOnWhatsApp, directPrintReceipt } from '../utils/pdfReceiptGenerator';
import logoImg from '../assets/2.png';

export const CustomOrderReceiptModal = ({ isOpen, onClose, order, settings }) => {
  const { showToast } = useToast();
  const [sharing, setSharing] = useState(false);

  const { shouldRender, isClosing, requestClose } = useModalAnimation(isOpen, onClose);

  if (!shouldRender || !order) return null;

  const businessName = settings?.businessName && !settings.businessName.includes('Muthuvel')
    ? settings.businessName
    : 'AuraFrame26';
  const orderNumber = order.orderNumber || 'AF-CUST';
  const customerName =
    order.customerSnapshot?.name ||
    order.customer?.name ||
    order.customerName ||
    'Walk-in Customer';
  const customerPhone =
    order.customerSnapshot?.phone ||
    order.customer?.phone ||
    order.phone ||
    '';
  const customerInstagram =
    order.customerSnapshot?.instagramHandle ||
    order.customer?.instagramHandle ||
    order.instagram ||
    '';

  const placedDate = order.orderDate
    ? formatDate(order.orderDate)
    : formatDate(order.createdAt || new Date());
  const deliveryDate = order.deliveryDate
    ? formatDate(order.deliveryDate)
    : order.dueDate
    ? formatDate(order.dueDate)
    : null;

  const timeStr = order.createdAt
    ? new Date(order.createdAt)
        .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        .toLowerCase()
    : '';

  // Extract poster and frame tiers
  const posterTiersList =
    Array.isArray(order.posterTiers) && order.posterTiers.length > 0
      ? order.posterTiers
      : Array.isArray(order.sizeTiers)
      ? order.sizeTiers
          .filter((st) => st.type === 'poster' || (st.posterPrice && Number(st.posterPrice) > 0))
          .map((st) => ({
            size: st.size || 'A4',
            count: Number(st.count) || 1,
            price: Number(st.price) || Number(st.posterPrice) || 0,
          }))
      : [];

  const frameTiersList =
    Array.isArray(order.frameTiers) && order.frameTiers.length > 0
      ? order.frameTiers
      : Array.isArray(order.sizeTiers)
      ? order.sizeTiers
          .filter((st) => st.type === 'frame' || (st.framePrice && Number(st.framePrice) > 0))
          .map((st) => ({
            size: st.size || 'A4',
            count: Number(st.count) || 1,
            price: Number(st.price) || Number(st.framePrice) || 0,
          }))
      : [];

  const genericTiers =
    posterTiersList.length === 0 && frameTiersList.length === 0 && Array.isArray(order.sizeTiers)
      ? order.sizeTiers
      : [];

  const totalPrice = Number(order.pricing?.totalPrice) || 0;
  const advancePaid = Number(order.pricing?.advancePaid) || 0;
  const balanceDue = Number(order.pricing?.balanceDue) || Math.max(0, totalPrice - advancePaid);
  const paymentMethodStr = (order.paymentMethod || 'upi').toUpperCase();

  const handlePrint = async () => {
    await directPrintReceipt('printable-custom-receipt', showToast);
  };

  const handleWhatsAppSharePDF = async () => {
    try {
      setSharing(true);
      const combinedTiers =
        posterTiersList.length > 0 || frameTiersList.length > 0
          ? [
              ...posterTiersList.map((p) => ({ ...p, type: 'poster' })),
              ...frameTiersList.map((f) => ({ ...f, type: 'frame' })),
            ]
          : genericTiers;

      await shareReceiptOnWhatsApp({
        elementId: 'printable-custom-receipt',
        orderNumber,
        customerPhone,
        customerName,
        customerInstagram,
        dateStr: placedDate,
        timeStr,
        sizeTiers: combinedTiers,
        total: totalPrice,
        advancePaid,
        balanceDue,
        paymentMethod: paymentMethodStr,
        isCustom: true,
        deliveryDate,
        customNotes: order.customNotes || '',
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

          <h2 className="text-base font-bold text-zinc-900">Custom Order Receipt</h2>

          <button
            onClick={requestClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <span className="text-lg leading-none font-medium">&times;</span>
          </button>
        </div>

        {/* Scrollable Printable Receipt Card */}
        <div
          className="p-6 pb-8 overflow-y-auto space-y-4 no-scrollbar flex-1 print-card bg-white"
          id="printable-custom-receipt"
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

          {/* Metadata Row */}
          <div className="flex items-start justify-between gap-2 text-xs bg-zinc-50/90 p-3.5 rounded-2xl border border-zinc-100">
            <div className="min-w-0">
              <span className="text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider block">
                RECEIPT
              </span>
              <span className="font-bold text-xs sm:text-sm text-zinc-900 block mt-0.5 font-mono">
                #{orderNumber}
              </span>
            </div>

            <div className="text-center shrink-0 px-2">
              <span className="text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider block">
                PLACED DATE
              </span>
              <span className="font-bold text-xs sm:text-sm text-zinc-800 block mt-0.5 whitespace-nowrap">
                {placedDate}
              </span>
            </div>

            <div className="text-right min-w-0 max-w-[45%]">
              <span className="text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider block">
                CUSTOMER
              </span>
              <span className="font-bold text-xs sm:text-sm text-zinc-900 block mt-0.5 leading-snug break-words">
                {customerName}
              </span>
            </div>
          </div>

          {/* Contact Details & Expected Delivery Banner */}
          <div className="p-3 rounded-2xl bg-[#f8fafc] border border-zinc-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Customer Contact:</span>
              <span className="font-bold text-zinc-800 font-mono">
                {customerPhone || 'Walk-in'}
              </span>
            </div>

            {customerInstagram && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Instagram:</span>
                <span className="font-bold text-amber-600 font-mono">
                  @{customerInstagram.replace('@', '')}
                </span>
              </div>
            )}

            {deliveryDate && (
              <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 text-amber-800">
                <span className="flex items-center gap-1 font-semibold">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Expected Delivery:</span>
                </span>
                <span className="font-black text-amber-900">{deliveryDate}</span>
              </div>
            )}
          </div>

          {/* Order Specifications Table */}
          <div className="pt-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
              ORDER ITEMS
            </h4>

            <div className="space-y-3">
              {/* Poster Tiers */}
              {posterTiersList.length > 0 && (
                <div className="space-y-2">
                  {posterTiersList.map((pt, idx) => {
                    const count = Number(pt.count) || 1;
                    const price = Number(pt.price) || 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 text-xs border-b border-zinc-100 pb-2.5 last:border-0"
                      >
                        <div>
                          <h5 className="font-bold text-sm text-zinc-900 leading-snug">
                            {pt.size || 'A4'} Poster Print
                          </h5>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Size: <strong className="text-zinc-700">{pt.size || 'A4'}</strong> &times; {count} (@ ₹{price})
                          </p>
                        </div>
                        <span className="font-bold font-mono text-sm text-zinc-900 shrink-0">
                          ₹{count * price}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Frame Tiers */}
              {frameTiersList.length > 0 && (
                <div className="space-y-2 pt-1">
                  {frameTiersList.map((ft, idx) => {
                    const count = Number(ft.count) || 1;
                    const price = Number(ft.price) || 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 text-xs border-b border-zinc-100 pb-2.5 last:border-0"
                      >
                        <div>
                          <h5 className="font-bold text-sm text-zinc-900 leading-snug">
                            {ft.size || 'A4'} Custom Frame
                          </h5>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Size: <strong className="text-zinc-700">{ft.size || 'A4'}</strong> &times; {count} (@ ₹{price})
                          </p>
                        </div>
                        <span className="font-bold font-mono text-sm text-zinc-900 shrink-0">
                          ₹{count * price}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Generic Tiers fallback */}
              {genericTiers.length > 0 && (
                <div className="space-y-2">
                  {genericTiers.map((st, idx) => {
                    const count = Number(st.count) || 1;
                    const price = Number(st.unitPrice) || Number(st.price) || 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 text-xs border-b border-zinc-100 pb-2.5 last:border-0"
                      >
                        <div>
                          <h5 className="font-bold text-sm text-zinc-900 leading-snug">
                            {st.size || 'A4'} Custom Item
                          </h5>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Size: <strong className="text-zinc-700">{st.size || 'A4'}</strong> &times; {count} (@ ₹{price})
                          </p>
                        </div>
                        <span className="font-bold font-mono text-sm text-zinc-900 shrink-0">
                          ₹{count * price}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Custom Notes */}
          {order.customNotes && (
            <div className="p-3 rounded-xl bg-zinc-50 border-l-4 border-amber-500 text-zinc-700 text-xs italic">
              <span className="font-bold not-italic text-[10.5px] uppercase tracking-wider text-zinc-500 block mb-0.5">
                Notes & Instructions:
              </span>
              "{order.customNotes}"
            </div>
          )}

          {/* Totals Summary Box */}
          <div className="p-4 rounded-2xl bg-[#f8fafc] border border-zinc-200/80 space-y-2">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Subtotal Quoted</span>
              <span className="font-mono font-bold text-zinc-900 text-sm">₹{totalPrice}</span>
            </div>

            <div className="flex justify-between text-xs text-emerald-600 font-medium">
              <span>Advance Paid ({paymentMethodStr})</span>
              <span className="font-mono font-bold">₹{advancePaid}</span>
            </div>

            <div
              className={`flex justify-between items-center text-base font-bold pt-2 border-t border-zinc-200/80 ${
                balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              <span>{balanceDue > 0 ? 'Balance Due on Delivery' : 'Total Paid'}</span>
              <span className="text-lg font-black font-mono">
                {balanceDue > 0 ? `₹${balanceDue}` : `₹${totalPrice} (Fully Paid ✓)`}
              </span>
            </div>
          </div>

          {/* Status Banner */}
          <div className="p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-[#059669]">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span>
                Order Status: {(order.orderStatus || 'received').toUpperCase().replace('_', ' ')}
              </span>
            </div>
            <span className="text-[#059669] font-medium font-mono">
              {paymentMethodStr}
            </span>
          </div>

          {/* Custom Brand Glow & Tag Note Banner */}
          <div className="p-4 rounded-2xl bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] text-center space-y-1.5 mt-2">
            <p className="font-bold text-xs">Thank you, {customerName}! 💛</p>
            <p className="text-[11px] leading-relaxed text-amber-900">
              Your AuraFrame order is confirmed, and your receipt is attached. 🧾
            </p>
            <p className="text-[11px] text-amber-800">
              Hope your walls glow with your new posters! ✨
            </p>
            <p className="text-[11px] font-bold text-[#b45309] pt-1">
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
