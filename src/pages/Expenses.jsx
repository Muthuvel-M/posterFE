import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Plus,
  Search,
  Calendar,
  Banknote,
  QrCode,
  Tag,
  Trash2,
  Edit2,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  TrendingDown,
  Building2,
  RefreshCw,
  Box,
  Layers,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ExpenseModal, EXPENSE_CATEGORIES } from '../components/ExpenseModal';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { api } from '../api/client';

export const Expenses = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    cashAmount: 0,
    upiAmount: 0,
    count: 0,
  });
  const [stats, setStats] = useState(null);
  const [cashFlow, setCashFlow] = useState({
    cashInHand: 0,
    lifetimeCashInflow: 0,
    lifetimeCashOutflow: 0,
    todayCashInflow: 0,
    todayCashOutflow: 0,
    todayNetCash: 0,
  });

  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d'); // 'today' | '7d' | '30d' | 'this_month' | 'all'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'cash' | 'upi'
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    fetchExpensesAndStats();
  }, [timeframe, categoryFilter, paymentFilter]);

  const fetchExpensesAndStats = async () => {
    try {
      setLoading(true);
      const params = {
        timeframe,
        category: categoryFilter,
        paymentMethod: paymentFilter,
        search: searchTerm,
      };

      const [expRes, statsRes, analyticsRes] = await Promise.all([
        api.getExpenses(params).catch(() => ({ success: false, data: [] })),
        api.getExpenseStats({ timeframe }).catch(() => ({ success: false, data: null })),
        api.getDashboardCounts().catch(() => ({ success: false, data: null })),
      ]);

      if (expRes?.success && expRes.data) {
        setExpenses(expRes.data);
        if (expRes.summary) {
          setSummary(expRes.summary);
        }
      }

      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (analyticsRes?.success && analyticsRes.data?.cashFlow) {
        setCashFlow(analyticsRes.data.cashFlow);
      }
    } catch (err) {
      showToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp) => {
    setEditingExpense(exp);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    fetchExpensesAndStats();
  };

  const handleDelete = async (exp) => {
    if (!exp?._id) return;
    if (!window.confirm(`Delete expense "${exp.title}" (₹${exp.amount})?`)) {
      return;
    }

    try {
      const res = await api.deleteExpense(exp._id);
      if (res.success) {
        showToast('Expense deleted successfully', 'success');
        fetchExpensesAndStats();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  const getCategoryInfo = (catId) => {
    return EXPENSE_CATEGORIES.find((c) => c.id === catId) || {
      id: catId,
      label: catId || 'Expense',
      icon: '💡',
    };
  };

  const filteredExpenses = expenses.filter((exp) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      exp.title?.toLowerCase().includes(term) ||
      exp.vendor?.toLowerCase().includes(term) ||
      exp.billNumber?.toLowerCase().includes(term) ||
      exp.notes?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 pb-32 space-y-5 text-white">
      {/* Header Bar */}
      <div className="flex items-center justify-between animate-card-in stagger-1">
        <div className="flex items-center gap-2.5">
          {onNavigate && (
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 block">
              FINANCIAL OUTFLOWS
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Expenses & Cash
            </h1>
          </div>
        </div>

        {/* Record Expense Button */}
        <button
          onClick={handleOpenAddModal}
          className="py-2 px-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. HERO CARD: LIVE IN-HAND CASH
         ───────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-[#1c1917] via-[#141417] to-[#121215] border border-amber-500/30 shadow-xl space-y-4 animate-card-in stagger-2 relative overflow-hidden">
        {/* Glow Ambient Effect */}
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                LIVE IN-HAND CASH (DRAWER)
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
              {formatCurrency(cashFlow.cashInHand)}
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
          </span>
        </div>

        {/* Cash Inflow & Outflow Breakdown */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-zinc-800/80">
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/60">
            <div className="flex items-center gap-1 text-[9.5px] uppercase font-bold text-emerald-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Total Cash Inflow</span>
            </div>
            <div className="text-sm font-black text-white mt-0.5">
              +{formatCurrency(cashFlow.lifetimeCashInflow)}
            </div>
            <span className="text-[9px] text-zinc-400">Sales + Custom deposits</span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/60">
            <div className="flex items-center gap-1 text-[9.5px] uppercase font-bold text-rose-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Total Cash Outflow</span>
            </div>
            <div className="text-sm font-black text-rose-300 mt-0.5">
              -{formatCurrency(cashFlow.lifetimeCashOutflow)}
            </div>
            <span className="text-[9px] text-zinc-400">Cash paid expenses</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. EXPENSE SUMMARY STATS
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5 animate-card-in stagger-3">
        {/* Total Expense in Period */}
        <div className="p-3.5 rounded-2xl bg-[#151518] border border-zinc-800 text-center shadow-md">
          <span className="text-[9.5px] font-bold uppercase text-zinc-400 block">Total Outflow</span>
          <div className="text-base sm:text-lg font-black text-rose-400 mt-0.5 truncate">
            {formatCurrency(summary.totalAmount)}
          </div>
          <span className="text-[9px] text-zinc-400 font-semibold">{summary.count} records</span>
        </div>

        {/* Cash Outflow */}
        <div className="p-3.5 rounded-2xl bg-[#151518] border border-zinc-800 text-center shadow-md">
          <span className="text-[9.5px] font-bold uppercase text-zinc-400 block">Cash Paid</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 truncate">
            {formatCurrency(summary.cashAmount)}
          </div>
          <span className="text-[9px] text-zinc-400 font-semibold">From drawer</span>
        </div>

        {/* UPI Outflow */}
        <div className="p-3.5 rounded-2xl bg-[#151518] border border-zinc-800 text-center shadow-md">
          <span className="text-[9.5px] font-bold uppercase text-zinc-400 block">UPI / Bank</span>
          <div className="text-base sm:text-lg font-black text-amber-300 mt-0.5 truncate">
            {formatCurrency(summary.upiAmount)}
          </div>
          <span className="text-[9px] text-zinc-400 font-semibold">Online transfer</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CATEGORY DISTRIBUTION BAR
         ───────────────────────────────────────────────────────────── */}
      {stats?.categories && stats.categories.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#151518] border border-zinc-800 space-y-2.5 shadow-md animate-card-in stagger-4">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-400 text-[10px] uppercase font-black tracking-wider">
              CATEGORY BREAKDOWN ({timeframe.toUpperCase()})
            </span>
            <span className="text-amber-400 font-mono">{stats.categories.length} Categories</span>
          </div>

          {/* Progress Stack Bar */}
          <div className="h-2 w-full rounded-full overflow-hidden bg-zinc-800 flex gap-0.5">
            {stats.categories.slice(0, 5).map((cat, idx) => {
              const colors = ['bg-rose-500', 'bg-amber-400', 'bg-emerald-400', 'bg-indigo-400', 'bg-purple-400'];
              return (
                <div
                  key={cat.category}
                  style={{ width: `${cat.percentage}%` }}
                  className={`h-full ${colors[idx % colors.length]} transition-all duration-500`}
                  title={`${cat.label}: ${cat.percentage}%`}
                />
              );
            })}
          </div>

          {/* Top Categories Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {stats.categories.slice(0, 4).map((cat) => (
              <span
                key={cat.category}
                className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[9.5px] font-semibold text-zinc-300 flex items-center gap-1"
              >
                <span>{getCategoryInfo(cat.category).icon}</span>
                <span>{getCategoryInfo(cat.category).label}:</span>
                <span className="font-bold text-white">{formatCurrency(cat.amount)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. FILTER & TIMEFRAME CONTROLS
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2.5 animate-card-in stagger-5">
        {/* Timeframe selector */}
        <div className="p-1 rounded-2xl bg-[#151518] border border-zinc-800 flex items-center">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'this_month', label: 'Month' },
            { id: 'all', label: 'All Time' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                timeframe === tf.id
                  ? 'bg-white text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Search Bar + Payment Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search expenses by title, vendor, bill #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#151518] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl bg-[#151518] border border-zinc-800 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            <option value="all">All Modes</option>
            <option value="cash">💵 Cash Only</option>
            <option value="upi">📱 UPI Only</option>
          </select>
        </div>

        {/* Category Horizontal Scroll Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all border cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-sm'
                : 'bg-[#151518] text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            ✨ All ({expenses.length})
          </button>

          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all border flex items-center gap-1 cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-sm'
                  : 'bg-[#151518] text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. EXPENSE RECORDS LIST
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2.5 animate-card-in stagger-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
            TRANSACTION LOG ({filteredExpenses.length})
          </h2>
          <button
            onClick={fetchExpensesAndStats}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && expenses.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#151518] border border-zinc-800 text-center space-y-2">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400">Loading expense records...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#151518] border border-zinc-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto text-xl">
              💸
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No expenses found</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {searchTerm
                  ? 'No matching expenses for your search criteria'
                  : 'No expenses recorded for this timeframe.'}
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-yellow-300 text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Expense</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExpenses.map((exp, idx) => {
              const cat = getCategoryInfo(exp.category);
              const isCash = exp.paymentMethod === 'cash';

              return (
                <div
                  key={exp._id}
                  style={{ animationDelay: `${150 + idx * 30}ms` }}
                  className="p-3.5 sm:p-4 rounded-2xl bg-[#151518] hover:bg-[#1a1a1f] border border-zinc-800/80 transition-all flex items-center justify-between gap-3 group animate-card-in shadow-md"
                >
                  {/* Left info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0 shadow-inner">
                      {cat.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {exp.title}
                        </h4>
                        {exp.billNumber && (
                          <span className="px-1.5 py-0.2 rounded-md bg-zinc-800 text-[9px] font-mono text-zinc-400">
                            #{exp.billNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        <span>{formatDateTime(exp.expenseDate || exp.createdAt)}</span>
                        {exp.vendor && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-300 font-medium truncate">{exp.vendor}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Amount & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm sm:text-base font-black text-rose-400 block">
                        -{formatCurrency(exp.amount)}
                      </span>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase ${
                          isCash
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                        }`}
                      >
                        {isCash ? '💵 Cash Out' : '📱 UPI / Bank'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(exp)}
                        className="p-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(exp)}
                        className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expense Modal (Add / Edit) */}
      {isModalOpen && (
        <ExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          expense={editingExpense}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
};
