import React, { useState, useEffect } from 'react';
import {
  Search,
  Inbox,
  Trash2,
  MessageCircle,
  ArrowLeft,
  RefreshCw,
  Clock,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { formatCurrency, generateWhatsAppReceiptUrl } from '../utils/formatters';
import { api } from '../api/client';

export const SalesHistory = ({ onOpenReceipt, onNavigate, settings }) => {
  const { showToast } = useToast();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.getSales();
      if (res.success) {
        setSales(res.data);
      }
    } catch (error) {
      showToast('Failed to load sales history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (sale, e) => {
    if (e) e.stopPropagation();

    if (!window.confirm(`Delete receipt "${sale.saleNumber}" for ${formatCurrency(sale.total)}? This will restore items to inventory.`)) {
      return;
    }

    try {
      let res;
      if (api.deleteSale) {
        res = await api.deleteSale(sale._id);
      } else {
        res = await api.voidSale(sale._id);
      }

      if (res.success) {
        showToast(`Sale "${sale.saleNumber}" removed & stock restored`, 'success');
        setSales((prev) => prev.filter((s) => s._id !== sale._id));
      }
    } catch (error) {
      showToast(error.message || 'Failed to delete sale', 'error');
    }
  };

  const handleWhatsAppShare = (sale, e) => {
    if (e) e.stopPropagation();
    const waUrl = generateWhatsAppReceiptUrl(sale, settings);
    if (waUrl) {
      window.open(waUrl, '_blank');
    } else {
      showToast('No customer contact found for WhatsApp', 'info');
    }
  };

  const filteredSales = sales.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesNum = s.saleNumber?.toLowerCase().includes(term);
    const matchesCust = s.customerSnapshot?.name?.toLowerCase().includes(term);
    const matchesPhone = s.customerSnapshot?.phone?.includes(term);
    const matchesItems = s.items?.some((i) => i.name?.toLowerCase().includes(term));
    const matchesMethod = s.paymentMethod?.toLowerCase().includes(term);
    return matchesNum || matchesCust || matchesPhone || matchesItems || matchesMethod;
  });

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 pb-32 space-y-4 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1 animate-card-in stagger-1">
        <div className="flex items-center gap-2.5">
          {onNavigate && (
            <button
              onClick={() => onNavigate('home')}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h1 className="text-2xl font-black tracking-tight text-white">
            Sales History
          </h1>
        </div>

        <button
          type="button"
          onClick={fetchSales}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Refresh Sales"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search Input Bar matching screenshot */}
      <div className="relative animate-card-in stagger-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by customer or receipt..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#17181f] border border-zinc-800/90 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
        />
      </div>

      {/* Sales List Container */}
      <div className="space-y-3 pt-1">
        {loading ? (
          <div className="space-y-2.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-3xl bg-[#16161b] animate-pulse" />
            ))}
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-[#16161b] border border-zinc-800/80 flex flex-col items-center gap-2 animate-card-in stagger-3">
            <Inbox className="w-8 h-8 text-zinc-600" />
            <p className="text-sm font-bold text-zinc-300">No sales records found</p>
            <p className="text-xs text-zinc-500">
              {searchTerm ? 'Try a different search term' : 'Sales will appear here after checkout'}
            </p>
          </div>
        ) : (
          filteredSales.map((sale, idx) => {
            // Determine primary item/title
            const primaryItemName =
              sale.items?.[0]?.name ||
              sale.customerSnapshot?.name ||
              'Poster Sale';

            const paymentMethodUpper = (sale.paymentMethod || 'UPI').toUpperCase();
            const customerName = sale.customerSnapshot?.name || 'Walk-in';
            const saleNum = sale.saleNumber || 'INV-0001';

            // Format date: e.g. 20 Sept 2026
            const saleDate = sale.createdAt ? new Date(sale.createdAt) : new Date();
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

            const isPaid = sale.paymentStatus === 'paid';
            const isVoided = sale.status === 'voided';

            return (
              <div
                key={sale._id}
                onClick={() => onOpenReceipt && onOpenReceipt(sale)}
                style={{ animationDelay: `${70 + idx * 35}ms` }}
                className="p-3.5 sm:p-4 rounded-[24px] bg-[#16161b] border border-zinc-800/80 hover:border-zinc-700/90 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-lg animate-card-in"
              >
                {/* Left Section: Icon + Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Left Rounded Box with Amber Inbox Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-[#20222a] border border-zinc-800/80 flex items-center justify-center shrink-0 shadow-inner">
                    <Inbox className="w-5 h-5 text-amber-400" />
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0 flex-1">
                    {/* Top Row: Title + Status Pill */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-white truncate max-w-[140px] sm:max-w-xs">
                        {primaryItemName}
                      </h3>

                      {isVoided ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-[#2b151a] text-rose-400 border border-rose-900/60">
                          VOIDED
                        </span>
                      ) : isPaid ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-[#14291f] text-[#22c55e] border border-[#1b4332]">
                          PAID
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-950/80 text-amber-400 border border-amber-800/60">
                          PENDING
                        </span>
                      )}
                    </div>

                    {/* Subtitle Row: CASH · muthu · INV-0002 · 20 Sept 2026 */}
                    <p className="text-[11px] text-zinc-400 mt-1 truncate">
                      {paymentMethodUpper} · {customerName} · {saleNum} · {dateStr}
                    </p>
                  </div>
                </div>

                {/* Right Section: Price/Time + Action Buttons */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {/* Price & Time Column */}
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-[#22c55e] block leading-tight">
                      ₹{sale.total}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium block mt-0.5">
                      {timeStr}
                    </span>
                  </div>

                  {/* WhatsApp Action Button (Green squircle) */}
                  <button
                    type="button"
                    onClick={(e) => handleWhatsAppShare(sale, e)}
                    className="w-9 h-9 rounded-xl bg-[#132e1e] hover:bg-[#1b432a] border border-[#1b4332] text-[#22c55e] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Share WhatsApp Receipt"
                  >
                    <MessageCircle className="w-4 h-4 fill-[#22c55e]/20" />
                  </button>

                  {/* Trash Action Button (Dark red squircle) */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSale(sale, e)}
                    className="w-9 h-9 rounded-xl bg-[#2b151a] hover:bg-[#3d1a21] border border-[#441a22] text-[#f43f5e] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Delete Sale"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
