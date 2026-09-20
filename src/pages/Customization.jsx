import React, { useState, useEffect } from 'react';
import {
  Palette,
  Plus,
  Search,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Edit2,
  Trash2,
  ArrowLeft,
  Calendar,
  IndianRupee,
  Layers,
  Sparkles,
  Phone,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { CustomOrderModal } from '../components/CustomOrderModal';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { api } from '../api/client';

export const Customization = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    received: 0,
    inProduction: 0,
    readyForPickup: 0,
    completed: 0,
    totalBalanceDue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'received' | 'in_production' | 'ready_for_pickup' | 'completed'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    fetchOrdersAndStats();
  }, [statusFilter]);

  const fetchOrdersAndStats = async () => {
    try {
      setLoading(true);
      const [ordersRes, statsRes] = await Promise.all([
        api
          .getCustomOrders({
            status: statusFilter === 'in_production' ? 'active' : statusFilter,
          })
          .catch((err) => {
            console.error('getCustomOrders error:', err);
            return { success: false, data: [] };
          }),
        api.getCustomOrderStats().catch((err) => {
          console.error('getCustomOrderStats error:', err);
          return { success: false, data: {} };
        }),
      ]);

      if (ordersRes?.data && Array.isArray(ordersRes.data)) {
        setOrders(ordersRes.data);
      } else if (Array.isArray(ordersRes)) {
        setOrders(ordersRes);
      } else {
        setOrders([]);
      }

      if (statsRes?.data) {
        setStats({
          total: statsRes.data.total || 0,
          received: statsRes.data.received || 0,
          inProduction: statsRes.data.inProduction || 0,
          readyForPickup: statsRes.data.readyForPickup || 0,
          completed: statsRes.data.completed || 0,
          totalBalanceDue: statsRes.data.totalBalanceDue || 0,
        });
      }
    } catch (err) {
      console.error('fetchOrdersAndStats error:', err);
      showToast('Failed to load custom orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (order) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    fetchOrdersAndStats();
  };

  const handleAdvanceStatus = async (order) => {
    if (!order?._id) return;
    let nextStatus = 'in_printing';
    if (order.orderStatus === 'received') nextStatus = 'in_printing';
    else if (order.orderStatus === 'in_printing') nextStatus = 'framing';
    else if (order.orderStatus === 'framing') nextStatus = 'ready_for_pickup';
    else if (order.orderStatus === 'ready_for_pickup') nextStatus = 'completed';

    try {
      const res = await api.updateCustomOrderStatus(order._id, {
        orderStatus: nextStatus,
        paymentStatus: nextStatus === 'completed' ? 'paid' : order.paymentStatus,
      });

      if (res.success) {
        showToast(`Order status updated to "${nextStatus.replace('_', ' ')}"`, 'success');
        setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data : o)));
        fetchOrdersAndStats();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (order) => {
    if (!order?._id) return;
    const custName = order.customerSnapshot?.name || order.customer?.name || 'Customer';
    if (!window.confirm(`Delete custom order ${order.orderNumber || ''} for "${custName}"?`)) {
      return;
    }

    try {
      const res = await api.deleteCustomOrder(order._id);
      if (res.success) {
        showToast('Custom order deleted', 'success');
        setOrders((prev) => prev.filter((o) => o._id !== order._id));
        fetchOrdersAndStats();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete order', 'error');
    }
  };

  const handleOpenWhatsApp = (order) => {
    const phone = (order.customerSnapshot?.phone || order.customer?.phone || '').replace(/[^0-9]/g, '');
    if (!phone) {
      showToast('No phone number recorded for customer', 'error');
      return;
    }
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone.startsWith('91') ? phone : `91${phone}`;
    const custName = order.customerSnapshot?.name || order.customer?.name || 'Customer';
    const text = encodeURIComponent(
      `Hello ${custName}! Regarding your AuraFrame custom order (${order.orderNumber || ''} - "${order.title || 'Custom Order'}"): Your order status is currently "${(order.orderStatus || '').toUpperCase()}". Remaining balance due: ₹${order.pricing?.balanceDue || 0}. Thank you!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const safeOrders = Array.isArray(orders) ? orders : [];
  const filteredOrders = safeOrders.filter((o) => {
    if (!o) return false;
    const query = (searchTerm || '').toLowerCase().trim();
    if (!query) return true;
    const matchesSearch =
      o.orderNumber?.toLowerCase().includes(query) ||
      o.title?.toLowerCase().includes(query) ||
      o.customerSnapshot?.name?.toLowerCase().includes(query) ||
      o.customerSnapshot?.phone?.toLowerCase().includes(query) ||
      o.customer?.name?.toLowerCase().includes(query) ||
      o.customer?.phone?.toLowerCase().includes(query);

    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'received':
        return { label: 'Received', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'in_printing':
        return { label: 'In Printing', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'framing':
        return { label: 'Framing', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'ready_for_pickup':
        return { label: 'Ready for Pickup', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'completed':
        return { label: 'Completed', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
      default:
        return { label: (status || 'Active').replace('_', ' '), color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
  };

  const getItemTypeBadge = (type) => {
    switch (type) {
      case 'custom_framed_poster':
        return { label: '🖼️ Framed Print', color: 'bg-amber-400/10 text-amber-300 border-amber-400/30' };
      case 'custom_poster':
        return { label: '🎨 Poster', color: 'bg-blue-400/10 text-blue-300 border-blue-400/30' };
      case 'custom_frame':
        return { label: '🔲 Frame', color: 'bg-purple-400/10 text-purple-300 border-purple-400/30' };
      case 'custom_sticker':
        return { label: '✨ Stickers', color: 'bg-pink-400/10 text-pink-300 border-pink-400/30' };
      default:
        return { label: '🖼️ Print', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
  };

  const formatDateOnly = (dateInput) => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-32 space-y-5 text-white">
      {/* Custom Order Creator/Editor Modal */}
      <CustomOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={editingOrder}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 animate-card-in stagger-1">
        <div className="flex items-center gap-3 min-w-0">
          {onNavigate && (
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer shrink-0 border border-zinc-800"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 truncate">
            <span>Custom Orders</span>
            <Palette className="w-5 h-5 text-amber-400 shrink-0" />
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchOrdersAndStats}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800 shadow-sm"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-card-in stagger-2">
        <div className="p-4 rounded-2xl bg-[#16161b] border border-zinc-800/80 shadow-md">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Orders</span>
          <div className="text-2xl font-black text-white mt-1">{stats?.total || 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#16161b] border border-zinc-800/80 shadow-md">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">In Production</span>
          <div className="text-2xl font-black text-amber-300 mt-1">{stats?.inProduction || 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#16161b] border border-zinc-800/80 shadow-md">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">Ready for Pickup</span>
          <div className="text-2xl font-black text-emerald-300 mt-1">{stats?.readyForPickup || 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#16161b] border border-zinc-800/80 shadow-md">
          <span className="text-[10px] uppercase font-bold text-rose-400 block">Balance Pending</span>
          <div className="text-2xl font-black text-rose-400 mt-1">
            {formatCurrency(stats?.totalBalanceDue || 0)}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3 animate-card-in stagger-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search custom orders by customer, phone, order #, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#151518] border border-zinc-800/80 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'received', label: '🟡 Received' },
            { id: 'in_production', label: '⚙️ In Production' },
            { id: 'ready_for_pickup', label: '🟢 Ready' },
            { id: 'completed', label: '✓ Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${statusFilter === tab.id
                  ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                  : 'bg-[#151518] text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Orders List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-3xl bg-[#16161b] animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-[#151518] border border-zinc-800/80 flex flex-col items-center gap-2 animate-card-in stagger-4 shadow-lg">
            <Palette className="w-8 h-8 text-zinc-600" />
            <p className="text-xs font-semibold text-zinc-400">No custom orders found</p>
          </div>
        ) : (
          filteredOrders.map((order, idx) => {
            const badge = getStatusBadge(order?.orderStatus);
            const balanceDue = order?.pricing?.balanceDue || 0;
            const custName = order?.customerSnapshot?.name || order?.customer?.name || 'Walk-in Customer';
            const custPhone = order?.customerSnapshot?.phone || order?.customer?.phone || '';

            // Multi-selected item types list
            const rawTypes =
              Array.isArray(order?.itemTypes) && order.itemTypes.length > 0
                ? order.itemTypes
                : [order?.itemType || 'custom_framed_poster'];

            // Size tiers list
            const sizeTiersList =
              Array.isArray(order?.sizeTiers) && order.sizeTiers.length > 0
                ? order.sizeTiers
                : [
                  {
                    size: order?.dimensions?.sizeType || 'A4',
                    count: 1,
                    unitPrice: order?.pricing?.totalPrice || 150,
                  },
                ];

            const totalUnits = sizeTiersList.reduce((acc, c) => acc + (Number(c.count) || 1), 0);

            const placedDate = formatDateOnly(order?.orderDate || order?.createdAt);
            const deliveryDate = formatDateOnly(order?.deliveryDate || order?.dueDate);

            return (
              <div
                key={order?._id || idx}
                style={{ animationDelay: `${70 + idx * 30}ms` }}
                className="p-4 sm:p-5 rounded-3xl bg-[#16161b] border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-lg animate-card-in space-y-3"
              >
                {/* Row 1: Header - Order ID, Status, Placed Date & Delivery Date */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 font-mono text-xs font-black text-amber-300">
                      {order?.orderNumber || 'AF-CUST'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Dates Row: Placed & Delivery */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-zinc-400">
                    {placedDate && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Placed: <strong className="text-zinc-200">{placedDate}</strong></span>
                      </span>
                    )}

                    {deliveryDate && (
                      <span className="flex items-center gap-1 text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20 font-bold">
                        <Truck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Delivery: {deliveryDate}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Customer, Multi-Item Types, Size Tiers Breakdown & Pricing */}
                <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                  {/* Left Column: Customer & Specifications */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Customer Name & WhatsApp */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-sm sm:text-base font-black text-white">{custName}</span>
                      {custPhone && (
                        <>
                          <span className="text-zinc-500">•</span>
                          <span className="font-mono text-xs text-zinc-400 font-medium">{custPhone}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(order)}
                            className="px-2 py-0.5 rounded-lg bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Open WhatsApp chat"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Multi-Item Types Badges */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {rawTypes.map((t, i) => {
                        const typeInfo = getItemTypeBadge(t);
                        return (
                          <span
                            key={i}
                            className={`px-2.5 py-0.5 rounded-xl text-[11px] font-bold border ${typeInfo.color}`}
                          >
                            {typeInfo.label}
                          </span>
                        );
                      })}
                      <span className="text-[10px] text-zinc-500 font-semibold font-mono">
                        ({totalUnits} {totalUnits === 1 ? 'unit' : 'units'})
                      </span>
                    </div>

                    {/* Size Tiers Breakdown (Count & Unit Prices) */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                        Size Tiers & Rates:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sizeTiersList.map((st, i) => {
                          const posterP = Number(st.posterPrice) || 0;
                          const frameP = Number(st.framePrice) || 0;
                          const unitP = Number(st.unitPrice) || (posterP + frameP);
                          const count = Number(st.count) || 1;
                          const rowTotal = count * unitP;

                          return (
                            <div
                              key={i}
                              className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 text-xs font-bold"
                            >
                              <span className="text-amber-400 font-mono font-black">{count}×</span>
                              <span className="text-white uppercase">{st.size || 'A4'}</span>
                              {posterP > 0 && frameP > 0 ? (
                                <span className="text-zinc-400 font-normal text-[10.5px]">
                                  (P: ₹{posterP} + F: ₹{frameP})
                                </span>
                              ) : (
                                <span className="text-zinc-400 font-normal text-[11px]">
                                  @ ₹{unitP}
                                </span>
                              )}
                              <span className="text-emerald-400 font-mono font-bold text-[11px]">
                                = ₹{rowTotal}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Notes */}
                    {order?.customNotes && (
                      <p className="text-xs text-zinc-400 italic pt-0.5 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/60">
                        "{order.customNotes}"
                      </p>
                    )}
                  </div>

                  {/* Right Column: Pricing Summary Card */}
                  <div className="text-left sm:text-right shrink-0 space-y-1 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto bg-zinc-950/60 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-zinc-800/60">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Quoted</span>
                      <div className="text-lg sm:text-xl font-black text-amber-300">
                        {formatCurrency(order?.pricing?.totalPrice || 0)}
                      </div>
                    </div>

                    <div className="text-xs text-emerald-400 font-semibold">
                      Advance: {formatCurrency(order?.pricing?.advancePaid || 0)}
                    </div>

                    <div
                      className={`text-xs font-black ${balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                    >
                      {balanceDue > 0 ? `Due: ₹${balanceDue}` : 'Fully Paid ✓'}
                    </div>
                  </div>
                </div>

                {/* Row 3: Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(order)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
                      title="Edit specifications"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(order)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer border border-zinc-800"
                      title="Delete order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status Advance Button */}
                  {order?.orderStatus !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(order)}
                      className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      {order?.orderStatus === 'received' && <span>Start Printing →</span>}
                      {order?.orderStatus === 'in_printing' && <span>Start Framing →</span>}
                      {order?.orderStatus === 'framing' && <span>Mark Ready for Pickup ✓</span>}
                      {order?.orderStatus === 'ready_for_pickup' && (
                        <span>Complete & Settle ✓</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) for New Custom Order */}
      {!isModalOpen && (
        <div className="fixed bottom-24 right-4 sm:right-8 sm:bottom-28 z-30 pointer-events-auto no-print">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="py-3 px-3 sm:py-3.5 sm:px-6 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-[0_10px_35px_rgba(245,158,11,0.45)] ring-4 ring-[#0c0c0e] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group"
            title="Create New Custom Order"
          >
            <div className="w-6 h-6 rounded-full bg-zinc-950 text-amber-300 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300 shadow-md">
              <Plus className="w-4 h-4 stroke-[3.5]" />
            </div>
            <span className="hidden sm:inline font-black uppercase tracking-wider text-xs">
              New Custom Order
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
