import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  PieChart,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Sun,
  Layers,
  Check,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatWeekendRange } from '../utils/formatters';
import { api } from '../api/client';
import {
  ALLOCATION_KEYS,
  ALLOCATION_LABELS,
  validatePercentages,
} from '../utils/incomeSplit';

const WEEKDAY_LABELS = {
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const IncomeSplits = ({ onNavigate }) => {
  const { showToast } = useToast();

  // Filter Option 1 (Weekend Split) vs Filter Option 2 (Daily Day Basis)
  const [splitMode, setSplitMode] = useState('weekend'); // 'weekend' | 'daily'

  // Month & Year selection
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // Mode 1: Month Weekend Splits Data (All 4 Weeks)
  const [monthWeekendData, setMonthWeekendData] = useState(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState('all'); // 'all' | 0 | 1 | 2 | 3

  // Mode 2: Month Daily Splits Data (Day by Day)
  const [monthDailyData, setMonthDailyData] = useState(null);
  const [dailyFilter, setDailyFilter] = useState('active'); // 'active' | 'all'

  // History & loading state
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [monthRes, dailyRes, historyRes] = await Promise.all([
        api
          .getMonthWeekendSplits({ year: selectedYear, month: selectedMonth })
          .catch(() => ({ success: false })),
        api
          .getDailySplitsForMonth({ year: selectedYear, month: selectedMonth })
          .catch(() => ({ success: false })),
        api
          .getIncomeSplits({ limit: 20 })
          .catch(() => ({ success: false, data: [] })),
      ]);

      if (monthRes?.success) setMonthWeekendData(monthRes.data);
      if (dailyRes?.success) setMonthDailyData(dailyRes.data);
      if (historyRes?.success) setHistory(historyRes.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load income splits', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleSettle = async (weekPreview) => {
    if (!weekPreview?.canSettle) return;
    if (
      !window.confirm(
        `Settle weekend ${formatWeekendRange(
          weekPreview.weekStartDate,
          weekPreview.weekEndDate
        )} for ${formatCurrency(weekPreview.totalIncome)}?`
      )
    ) {
      return;
    }
    try {
      setSettling(true);
      const res = await api.settleIncomeSplit({
        weekStart: weekPreview.weekStartDate,
      });
      if (res.success) {
        showToast('Weekend income split settled successfully', 'success');
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to settle', 'error');
    } finally {
      setSettling(false);
    }
  };

  // Get active week preview if specific week selected
  const activeWeekPreview =
    monthWeekendData?.weeks && selectedWeekIndex !== 'all'
      ? monthWeekendData.weeks[selectedWeekIndex]
      : null;

  const weekendWeeksNewestFirst = [...(monthWeekendData?.weeks || [])]
    .map((w, idx) => ({ w, idx }))
    .reverse();

  const pctCheck = activeWeekPreview?.percentages
    ? validatePercentages(activeWeekPreview.percentages)
    : { valid: true, sum: 100 };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 pb-32 space-y-5 text-white">
      {/* Header */}
      <div className="flex items-center justify-between animate-card-in stagger-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('home')}
            className="w-9 h-9 rounded-xl bg-[#1c1c22] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight">Income Splits</h1>
            <p className="text-[11px] text-zinc-400 font-semibold">
              Filter by Weekend Splits (Fri–Sun) or Daily Basis
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="w-9 h-9 rounded-xl bg-[#1c1c22] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-amber-400 cursor-pointer"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Mode Filter Options (Option 1: Weekend Split vs Option 2: Daily Basis) */}
      <div className="p-1 rounded-2xl bg-[#161619] border border-zinc-800 grid grid-cols-2 gap-1 animate-card-in stagger-2">
        <button
          type="button"
          onClick={() => setSplitMode('weekend')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            splitMode === 'weekend'
              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Weekend Split (Fri–Sun)
        </button>

        <button
          type="button"
          onClick={() => setSplitMode('daily')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            splitMode === 'daily'
              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          Daily Day Basis
        </button>
      </div>

      {/* Month Selector Controls */}
      <div className="p-3 rounded-2xl bg-[#18181c] border border-zinc-800 flex items-center justify-between shadow-lg animate-card-in stagger-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-center">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-black text-white">
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {loading && !monthWeekendData && !monthDailyData ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-40 rounded-3xl bg-zinc-800/40" />
          <div className="h-28 rounded-3xl bg-zinc-800/30" />
        </div>
      ) : (
        <>
          {/* OPTION 1: WEEKEND SPLIT MODE (All 4 Weeks in Month) */}
          {splitMode === 'weekend' && (
            <div className="space-y-4 animate-card-in stagger-4">
              {/* Month Total Weekend Summary Card */}
              <div className="p-5 rounded-[28px] bg-gradient-to-br from-[#1c1917] to-[#121215] border border-amber-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                      {MONTH_NAMES[selectedMonth - 1]} Weekend Income
                    </span>
                    <div className="text-2xl font-black tracking-tight mt-1 text-white">
                      {formatCurrency(monthWeekendData?.monthTotalIncome || 0)}
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black">
                    {monthWeekendData?.weeksCount || 4} Weeks Window
                  </div>
                </div>

                {/* Cumulative 4-Way Split Allocations for Month */}
                {monthWeekendData?.monthAllocations && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                    {ALLOCATION_KEYS.map((key) => (
                      <div
                        key={key}
                        className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between"
                      >
                        <span className="text-[11px] font-semibold text-zinc-400">
                          {ALLOCATION_LABELS[key]} (25%)
                        </span>
                        <span className="text-xs font-black text-amber-400">
                          {formatCurrency(monthWeekendData.monthAllocations[key] || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weeks Filter Tabs (All 4 Weeks + Individual Week Pills) */}
              <div className="space-y-2">
                <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400 px-1">
                  Select Weekend Window
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedWeekIndex('all')}
                    className={`py-2 px-3 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer transition-all ${
                      selectedWeekIndex === 'all'
                        ? 'bg-amber-400 text-zinc-950 shadow'
                        : 'bg-[#18181c] border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    All {monthWeekendData?.weeksCount || 4} Weeks
                  </button>

                  {weekendWeeksNewestFirst.map(({ w, idx }) => (
                    <button
                      key={w.weekStartDate}
                      type="button"
                      onClick={() => setSelectedWeekIndex(idx)}
                      className={`py-2 px-3 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer transition-all ${
                        selectedWeekIndex === idx
                          ? 'bg-amber-400 text-zinc-950 shadow'
                          : 'bg-[#18181c] border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Week {w.weekNumber} (
                      {formatWeekendRange(w.weekStartDate, w.weekEndDate)})
                    </button>
                  ))}
                </div>
              </div>

              {/* View Selected Week or All 4 Weeks List */}
              {selectedWeekIndex === 'all' ? (
                /* ALL 4 WEEKS OVERVIEW CARDS */
                <div className="space-y-3">
                  {weekendWeeksNewestFirst.map(({ w }) => (
                    <div
                      key={w.weekStartDate}
                      className="p-4 rounded-2xl bg-[#1c1c22] border border-zinc-800 space-y-3 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-black text-amber-400 uppercase tracking-wider">
                            Week {w.weekNumber}
                          </div>
                          <div className="text-sm font-bold text-white mt-0.5">
                            {formatWeekendRange(w.weekStartDate, w.weekEndDate)}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                            w.alreadySettled
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : w.weekClosed
                                ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {w.alreadySettled
                            ? 'Settled'
                            : w.weekClosed
                              ? 'Ready to settle'
                              : 'Window open'}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1 border-t border-zinc-800/60">
                        <span className="text-xs text-zinc-400 font-semibold">
                          Total Weekend Income:
                        </span>
                        <span className="text-base font-black text-white">
                          {formatCurrency(w.totalIncome || 0)}
                        </span>
                      </div>

                      {/* Day Breakdown for this week */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {(w.dayBreakdown || []).map((day) => (
                          <div
                            key={day.date}
                            className={`p-2 rounded-xl border ${
                              day.isActive
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                            }`}
                          >
                            <div className="text-[9px] font-black uppercase">
                              {WEEKDAY_LABELS[day.weekday] || day.weekday}
                            </div>
                            <div className="text-xs font-black mt-0.5">
                              {formatCurrency(day.income)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 4-Way Allocations for this week */}
                      {w.allocations && (
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1">
                          {ALLOCATION_KEYS.map((key) => (
                            <div
                              key={key}
                              className="flex justify-between px-2.5 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60"
                            >
                              <span className="text-zinc-500">
                                {ALLOCATION_LABELS[key]}
                              </span>
                              <span className="font-black text-zinc-200">
                                {formatCurrency(w.allocations[key] || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Settle button for this week */}
                      {w.canSettle && (
                        <button
                          type="button"
                          disabled={settling}
                          onClick={() => handleSettle(w)}
                          className="w-full py-2.5 rounded-xl bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 hover:bg-amber-300 cursor-pointer shadow"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Settle Week {w.weekNumber} ({formatCurrency(w.totalIncome)})
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* INDIVIDUAL WEEK DETAILED PREVIEW CARD */
                activeWeekPreview && (
                  <div className="p-5 rounded-[28px] bg-gradient-to-br from-[#1c1917] to-[#121215] border border-amber-500/30 space-y-4 shadow-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                          Week {activeWeekPreview.weekNumber} Shop Weekend
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-sm font-bold text-white">
                          <Calendar className="w-4 h-4 text-zinc-400" />
                          {formatWeekendRange(
                            activeWeekPreview.weekStartDate,
                            activeWeekPreview.weekEndDate
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                          activeWeekPreview.alreadySettled
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : activeWeekPreview.weekClosed
                              ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {activeWeekPreview.alreadySettled
                          ? 'Settled'
                          : activeWeekPreview.weekClosed
                            ? 'Ready to settle'
                            : 'Window open'}
                      </span>
                    </div>

                    <div className="text-3xl font-black tracking-tight text-white">
                      {formatCurrency(activeWeekPreview.totalIncome || 0)}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Pool from {activeWeekPreview.activeDayCount || 0} active day
                      {(activeWeekPreview.activeDayCount || 0) === 1 ? '' : 's'}
                    </p>

                    {/* Day Breakdown */}
                    <div className="grid grid-cols-3 gap-2">
                      {(activeWeekPreview.dayBreakdown || []).map((day) => (
                        <div
                          key={day.date}
                          className={`p-3 rounded-2xl border ${
                            day.isActive
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-zinc-900/80 border-zinc-800'
                          }`}
                        >
                          <div className="text-[9px] font-black uppercase text-zinc-400">
                            {WEEKDAY_LABELS[day.weekday] || day.weekday}
                          </div>
                          <div className="text-sm font-black mt-1">
                            {formatCurrency(day.income)}
                          </div>
                          <div
                            className={`text-[9px] font-bold mt-1 ${
                              day.isActive ? 'text-emerald-400' : 'text-zinc-500'
                            }`}
                          >
                            {day.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Allocations Breakdown */}
                    {activeWeekPreview.allocations && (
                      <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          <PieChart className="w-3.5 h-3.5" />
                          4-Way Allocation Breakdown (25% each)
                        </div>
                        {ALLOCATION_KEYS.map((key) => {
                          const amount = activeWeekPreview.allocations[key] || 0;
                          const pct = activeWeekPreview.percentages?.[key] || 25;
                          const barPct =
                            activeWeekPreview.totalIncome > 0
                              ? Math.min(
                                  100,
                                  Math.round(
                                    (amount / activeWeekPreview.totalIncome) * 100
                                  )
                                )
                              : 0;
                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-zinc-300">
                                  {ALLOCATION_LABELS[key]}{' '}
                                  <span className="text-zinc-500">({pct}%)</span>
                                </span>
                                <span className="font-black text-white">
                                  {formatCurrency(amount)}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-amber-400"
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={!activeWeekPreview.canSettle || settling}
                      onClick={() => handleSettle(activeWeekPreview)}
                      className={`w-full py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
                        activeWeekPreview.canSettle
                          ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300 cursor-pointer shadow-lg'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {settling ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Settling…
                        </>
                      ) : activeWeekPreview.alreadySettled ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Already settled
                        </>
                      ) : activeWeekPreview.canSettle ? (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Settle Weekend {activeWeekPreview.weekNumber}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          {activeWeekPreview.weekClosed
                            ? 'Cannot settle'
                            : 'Available after Sunday'}
                        </>
                      )}
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {/* OPTION 2: DAILY DAY-BASIS MODE */}
          {splitMode === 'daily' && (
            <div className="space-y-4 animate-card-in stagger-4">
              {/* Month Daily Summary Card */}
              <div className="p-5 rounded-[28px] bg-gradient-to-br from-[#1c1917] to-[#121215] border border-amber-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                      {MONTH_NAMES[selectedMonth - 1]} Daily Total Income
                    </span>
                    <div className="text-2xl font-black tracking-tight mt-1 text-white">
                      {formatCurrency(monthDailyData?.monthTotalIncome || 0)}
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black">
                    {monthDailyData?.daysCount || 30} Days
                  </div>
                </div>

                {/* Cumulative Daily Allocations */}
                {monthDailyData?.monthAllocations && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                    {ALLOCATION_KEYS.map((key) => (
                      <div
                        key={key}
                        className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between"
                      >
                        <span className="text-[11px] font-semibold text-zinc-400">
                          {ALLOCATION_LABELS[key]} (25%)
                        </span>
                        <span className="text-xs font-black text-amber-400">
                          {formatCurrency(monthDailyData.monthAllocations[key] || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Tabs for Daily List */}
              <div className="flex items-center justify-between px-1">
                <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                  Daily Breakdowns
                </div>

                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#18181c] border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDailyFilter('active')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      dailyFilter === 'active'
                        ? 'bg-amber-400 text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Active Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setDailyFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      dailyFilter === 'all'
                        ? 'bg-amber-400 text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    All Days
                  </button>
                </div>
              </div>

              {/* Daily List Cards */}
              <div className="space-y-2.5">
                {(monthDailyData?.dailySplits || [])
                  .filter((d) => (dailyFilter === 'active' ? d.isActive : true))
                  .map((d) => (
                    <div
                      key={d.date}
                      className={`p-4 rounded-2xl border space-y-3 transition-all ${
                        d.isActive
                          ? 'bg-[#1c1c22] border-zinc-800 hover:border-zinc-700'
                          : 'bg-zinc-900/50 border-zinc-800/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              d.isActive ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-zinc-600'
                            }`}
                          />
                          <span className="text-xs font-black text-white">
                            {d.date} ({WEEKDAY_LABELS[d.weekday] || d.weekday})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              d.isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                            }`}
                          >
                            {d.isActive ? 'Active' : 'No Income'}
                          </span>
                          <span className="text-sm font-black text-amber-400">
                            {formatCurrency(d.income)}
                          </span>
                        </div>
                      </div>

                      {/* Day 4-Way Allocations */}
                      {d.isActive && d.allocations && (
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-2 border-t border-zinc-800/60">
                          {ALLOCATION_KEYS.map((key) => (
                            <div
                              key={key}
                              className="flex justify-between px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80"
                            >
                              <span className="text-zinc-500">
                                {ALLOCATION_LABELS[key]}
                              </span>
                              <span className="font-black text-zinc-200">
                                {formatCurrency(d.allocations[key] || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                {(monthDailyData?.dailySplits || []).filter((d) =>
                  dailyFilter === 'active' ? d.isActive : true
                ).length === 0 && (
                  <div className="p-6 rounded-2xl bg-[#151518] border border-zinc-800 text-center">
                    <p className="text-sm font-bold text-zinc-400">No active days found</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      No sales or custom orders recorded for the selected month filter.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settlement History */}
          <div className="space-y-2 animate-card-in stagger-5 pt-4 border-t border-zinc-800/80">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 px-1">
              Settlement History
            </h2>
            {history.length === 0 ? (
              <div className="p-6 rounded-3xl bg-[#151518] border border-zinc-800 text-center">
                <p className="text-sm font-bold text-zinc-400">No settlements yet</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Settlements appear here after each closed Fri–Sun window.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item._id}
                    className="p-4 rounded-2xl bg-[#1c1c22] border border-zinc-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-white">
                          {formatWeekendRange(item.weekStartDate, item.weekEndDate)}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                          {item.activeDayCount} active day
                          {item.activeDayCount === 1 ? '' : 's'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-amber-400">
                          {formatCurrency(item.totalIncome)}
                        </div>
                        <div className="text-[9px] font-bold uppercase text-emerald-400">
                          Settled
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      {ALLOCATION_KEYS.map((key) => (
                        <div
                          key={key}
                          className="flex justify-between px-2 py-1.5 rounded-lg bg-zinc-900/80"
                        >
                          <span className="text-zinc-500">{ALLOCATION_LABELS[key]}</span>
                          <span className="font-bold text-zinc-200">
                            {formatCurrency(item.allocations?.[key] || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
