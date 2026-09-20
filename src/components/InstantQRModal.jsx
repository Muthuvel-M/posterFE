import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Printer, Sparkles, Store, Copy, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';

export const InstantQRModal = ({ isOpen, onClose, settings }) => {
  const { showToast } = useToast();
  const { shouldRender, isClosing, requestClose } = useModalAnimation(isOpen, onClose);
  const [copied, setCopied] = React.useState(false);

  if (!shouldRender) return null;

  const upiId = settings?.upiId || 'mmuthuvel126@ibl';
  const upiName = settings?.upiName || settings?.businessName || 'AuraFrame POS';
  const staticUpiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&cu=INR`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    showToast('UPI ID copied to clipboard', 'success', 2000);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md no-print ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={requestClose}
    >
      <div
        className={`w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl text-white ${
          isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Instant Counter QR</h3>
              <p className="text-[11px] text-zinc-400">Customer enters amount on phone</p>
            </div>
          </div>
          <button
            onClick={requestClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Display Card */}
        <div className="p-6 flex flex-col items-center text-center">
          <div className="p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center mb-4">
            <QRCodeSVG
              value={staticUpiUrl}
              size={190}
              level="H"
              includeMargin={false}
              className="rounded-lg"
            />
          </div>

          <h4 className="text-base font-extrabold text-white tracking-tight">{upiName}</h4>

          <button
            onClick={handleCopyUPI}
            className="mt-1 px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{upiId}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
          </button>

          <p className="text-[11px] text-zinc-500 mt-3">
            Supports GPay, PhonePe, Paytm, BHIM & all UPI apps
          </p>

          <div className="mt-5 w-full flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print QR Standee</span>
            </button>
            <button
              onClick={requestClose}
              className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
