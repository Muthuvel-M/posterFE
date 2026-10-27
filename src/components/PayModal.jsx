import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  X,
  QrCode,
  Banknote,
  CheckCircle2,
  Check,
  AlertTriangle,
  ExternalLink,
  Settings as SettingsIcon,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { formatCurrency, generateWhatsAppReceiptUrl } from '../utils/formatters';
import { api } from '../api/client';

const UPI_REGEX = /^[\w.\-]{2,}@[\w]{2,}$/;

export const PayModal = ({ settings, onSaleSuccess, onNavigate }) => {
  const {
    isPayModalOpen,
    closePayModal,
    cartItems,
    customer,
    discount,
    freeDiscount,
    total,
    clearCart,
    showReceipt,
  } = useCart();
  const { deductStockForSale } = useCatalog();
  const { showToast } = useToast();
  const { shouldRender, isClosing, requestClose } = useModalAnimation(isPayModalOpen, closePayModal);

  const [activeSale, setActiveSale] = useState(null);
  const [completedSaleData, setCompletedSaleData] = useState(null);
  const [isSuccessView, setIsSuccessView] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null); // 'init' | 'mark_paid' | 'cash'
  const paymentCompletedRef = useRef(false);
  const initInFlightRef = useRef(false);
  const attemptIdRef = useRef(0);

  const rawUpiId = settings?.upiId?.trim() || 'mmuthuvel126@ibl';
  const isUpiConfigured = Boolean(rawUpiId && UPI_REGEX.test(rawUpiId));
  const businessName = settings?.businessName && !settings.businessName.includes('Muthuvel')
    ? settings.businessName.trim()
    : 'AuraFrame26';

  // Create a pending sale when the modal opens. Never wipe the success screen
  // when catalog/stock updates re-render this component.
  useEffect(() => {
    if (!isPayModalOpen) {
      paymentCompletedRef.current = false;
      initInFlightRef.current = false;
      setActiveSale(null);
      setIsSuccessView(false);
      setCompletedSaleData(null);
      setLoadingAction(null);
      return;
    }

    if (paymentCompletedRef.current) return;
    if (!cartItems.length) return;
    if (initInFlightRef.current) return;

    initSaleFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-init when modal opens or payable total changes before payment
  }, [isPayModalOpen, total]);

  const discardSaleIfUnpaid = async (saleId) => {
    if (!saleId || paymentCompletedRef.current) return;
    try {
      await api.deleteSale(saleId);
    } catch (err) {
      console.warn('Failed to discard unpaid sale:', err);
    }
  };

  const initSaleFlow = async () => {
    if (paymentCompletedRef.current || initInFlightRef.current) return;
    const attemptId = ++attemptIdRef.current;
    const previousSaleId = activeSale?._id;
    try {
      initInFlightRef.current = true;
      setLoadingAction('init');

      const payload = {
        items: cartItems.map((item) => ({
          productId: item.product._id,
          qty: item.qty,
          sellPrice: item.sellPrice,
        })),
        customerId: customer?._id || null,
        newCustomer: !customer?._id && customer?.name ? customer : null,
        discount: (Number(discount) || 0) + (Number(freeDiscount) || 0),
        paymentMethod: 'upi',
        paymentMode: 'direct',
        paymentStatus: 'pending',
        notes: '',
      };

      const res = await api.createSale(payload);
      const abandoned = attemptId !== attemptIdRef.current || paymentCompletedRef.current;
      if (abandoned) {
        if (!paymentCompletedRef.current && res?.success && res.data?._id) {
          await discardSaleIfUnpaid(res.data._id);
        }
        return;
      }
      if (res.success && res.data) {
        setActiveSale(res.data);
        if (previousSaleId && previousSaleId !== res.data._id) {
          discardSaleIfUnpaid(previousSaleId);
        }
      }
    } catch (err) {
      if (!paymentCompletedRef.current && attemptId === attemptIdRef.current) {
        showToast(err.message || 'Failed to initialize sale', 'error');
      }
    } finally {
      if (attemptId === attemptIdRef.current) {
        initInFlightRef.current = false;
        if (!paymentCompletedRef.current) {
          setLoadingAction(null);
        }
      }
    }
  };

  const handleDismissUnpaid = () => {
    if (paymentCompletedRef.current) {
      requestClose();
      return;
    }
    attemptIdRef.current += 1;
    initInFlightRef.current = false;
    const saleId = activeSale?._id;
    requestClose();
    if (saleId) {
      discardSaleIfUnpaid(saleId);
    }
  };

  const handlePaymentCompleted = (completedSale) => {
    paymentCompletedRef.current = true;
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#f59e0b', '#818cf8'],
      });
    } catch (e) {
      /* confetti optional */
    }

    try {
      deductStockForSale(completedSale);
    } catch (e) {
      console.warn('Local stock update failed:', e);
    }

    setCompletedSaleData(completedSale);
    setIsSuccessView(true);
    setLoadingAction(null);
    if (onSaleSuccess) onSaleSuccess(completedSale);
  };

  // "Payment Received" button handler: marks paid, decrements stock atomically
  const handlePaymentReceived = async () => {
    if (!activeSale || paymentCompletedRef.current) return;
    try {
      setLoadingAction('mark_paid');
      const res = await api.markSalePaid(activeSale._id, 'upi');
      if (res.success && res.data) {
        handlePaymentCompleted(res.data);
      } else {
        showToast(res.message || 'Failed to confirm payment', 'error');
        setLoadingAction(null);
      }
    } catch (error) {
      showToast(error.message || 'Failed to confirm payment', 'error');
      setLoadingAction(null);
    }
  };

  // "Cash" payment handler: marks paid with cash method, decrements stock
  const handleCashPayment = async () => {
    if (!activeSale || paymentCompletedRef.current) return;
    try {
      setLoadingAction('cash');
      const res = await api.markSalePaid(activeSale._id, 'cash');
      if (res.success && res.data) {
        handlePaymentCompleted(res.data);
      } else {
        showToast(res.message || 'Failed to record cash payment', 'error');
        setLoadingAction(null);
      }
    } catch (error) {
      showToast(error.message || 'Failed to record cash payment', 'error');
      setLoadingAction(null);
    }
  };

  const handleViewReceipt = () => {
    if (completedSaleData) {
      const saleToOpen = completedSaleData;
      requestClose();
      clearCart();
      setTimeout(() => {
        showReceipt(saleToOpen);
      }, 150);
    }
  };

  const handleSendWhatsApp = () => {
    const saleData = completedSaleData || activeSale;
    if (saleData) {
      const mergedSale = {
        ...saleData,
        customerSnapshot: {
          name: saleData.customerSnapshot?.name || customer?.name || 'Walk-in Customer',
          phone: saleData.customerSnapshot?.phone || customer?.phone || '',
          ...saleData.customerSnapshot,
        },
      };
      const waUrl = generateWhatsAppReceiptUrl(mergedSale, settings);
      if (waUrl) {
        window.open(waUrl, '_blank');
      }
    }
  };

  const handleStartNewSale = () => {
    requestClose();
    clearCart();
    if (onNavigate) {
      onNavigate('sales');
    }
  };

  const handleGoToSettings = () => {
    handleDismissUnpaid();
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  if (!shouldRender) return null;

  const orderId = activeSale?.saleNumber || 'AF-1001';
  const payable = Number(total) || 0;
  const directUpiUrl = `upi://pay?pa=${rawUpiId}&pn=${encodeURIComponent(businessName)}&am=${payable.toFixed(2)}&cu=INR&tn=${orderId}`;

  // ─────────────────────────────────────────────────────────────
  // SUCCESS VIEW: Payment Received!
  // ─────────────────────────────────────────────────────────────
  if (isSuccessView && completedSaleData) {
    const custDisplayName =
      completedSaleData.customerSnapshot?.name ||
      customer?.name ||
      'Walk-in Customer';
    const paidAmount = Number(completedSaleData.total) || payable;

    return (
      <div
        className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md no-print ${
          isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
        }`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div
          className={`w-full max-w-sm rounded-t-[36px] sm:rounded-[36px] bg-[#121215] border border-zinc-800/90 shadow-2xl p-8 flex flex-col items-center text-center text-white ${
            isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Circular Green Check Badge */}
          <div className="w-24 h-24 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mb-5 shadow-xl shadow-emerald-950/50">
            <div className="w-14 h-14 rounded-full bg-[#22c55e] flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Check className="w-8 h-8 text-zinc-950 stroke-[3.5]" />
            </div>
          </div>

          {/* Title & Amount · Customer */}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Payment Received!
          </h2>
          <p className="text-sm font-semibold text-zinc-400 mt-1 mb-8">
            {formatCurrency(paidAmount)} · {custDisplayName}
          </p>

          {/* 3 Action Buttons */}
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={handleViewReceipt}
              className="w-full py-4 px-5 rounded-2xl bg-[#f59e0b] hover:bg-[#d97706] text-zinc-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              View Receipt
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full py-4 px-5 rounded-2xl bg-[#22c55e] hover:bg-emerald-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-white text-[#22c55e]" />
              <span>Send WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleStartNewSale}
              className="w-full py-4 px-5 rounded-2xl bg-[#1c1c24] hover:bg-zinc-800 text-zinc-300 hover:text-white font-black text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>New Sale</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PAYMENT PROMPT VIEW: QR & Countertop Payment
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md no-print ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={handleDismissUnpaid}
    >
      <div
        className={`w-full max-w-md rounded-t-[32px] sm:rounded-[32px] bg-[#141417] border border-zinc-800/90 shadow-2xl overflow-hidden text-white ${
          isClosing ? 'animate-modal-slide-down' : 'animate-modal-slide-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-amber-400/20">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Direct UPI Payment</h3>
              <p className="text-[11px] text-zinc-400 font-mono">Order ID: {orderId}</p>
            </div>
          </div>

          <button
            onClick={handleDismissUnpaid}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 flex flex-col items-center">
          {/* Big ₹ Amount Display */}
          <div className="text-center mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Total Payable Amount
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight mt-0.5">
              {formatCurrency(total)}
            </div>
            {discount > 0 && (
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                ({formatCurrency(discount)} discount included)
              </p>
            )}
          </div>

          {/* Conditional QR View / Missing UPI ID Prompt */}
          {!isUpiConfigured ? (
            /* UPI ID Missing Prompt linking to Settings */
            <div className="w-full p-5 rounded-3xl bg-amber-950/30 border border-amber-800/50 flex flex-col items-center text-center my-2 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">UPI ID Not Configured</h4>
                <p className="text-xs text-zinc-300 mt-1 max-w-xs">
                  Please set your store's UPI ID in Settings (e.g.{' '}
                  <span className="font-mono text-amber-300">store@okhdfcbank</span>) to display countertop QR codes.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoToSettings}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Go to Settings →</span>
              </button>
            </div>
          ) : (
            /* QR Code Container with size 260 and level M */
            <div className="flex flex-col items-center w-full">
              <div className="p-4 rounded-3xl bg-white shadow-2xl flex flex-col items-center justify-center mb-3">
                {loadingAction === 'init' ? (
                  <div className="w-[260px] h-[260px] flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-zinc-700 font-bold">Creating Order QR...</span>
                  </div>
                ) : (
                  <QRCodeSVG
                    value={directUpiUrl}
                    size={260}
                    level="M"
                    includeMargin={false}
                    className="rounded-2xl"
                  />
                )}
              </div>

              {/* Merchant & Order Details */}
              <div className="text-center mb-3">
                <p className="text-xs font-black text-zinc-200">{businessName}</p>
                <p className="text-[11px] font-mono text-zinc-400">{rawUpiId}</p>
              </div>

              {/* Mobile "Pay with UPI app" Deep Link Button */}
              <div className="w-full mb-4">
                <a
                  href={directUpiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Pay with UPI app (Mobile)</span>
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons: Payment Received, Cash, Cancel */}
          <div className="w-full space-y-2 pt-1">
            {/* 1. Payment Received Button */}
            <button
              type="button"
              onClick={handlePaymentReceived}
              disabled={loadingAction !== null}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loadingAction === 'mark_paid' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Payment Received</span>
                </>
              )}
            </button>

            {/* 2. Cash & Cancel Row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCashPayment}
                disabled={loadingAction !== null}
                className="py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingAction === 'cash' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <span>Pay with Cash</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDismissUnpaid}
                className="py-3 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


