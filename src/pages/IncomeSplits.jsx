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
};

export const IncomeSplits = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [previewRes, historyRes] = await Promise.all([
        api.previewIncomeSplit().catch(() => ({ success: false })),
        api.getIncomeSplits({ limit: 20 }).catch(() => ({ success: false, data: [] })),
      ]);
      if (previewRes?.success) setPreview(previewRes.data);
      if (historyRes?.success) setHistory(historyRes.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load income splits', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSettle = async () => {
    if (!preview?.canSettle) return;
    if (
      !window.confirm(
        `Settle weekend ${formatWeekendRange(preview.weekStartDate, preview.weekEndDate)} for ${formatCurrency(preview.totalIncome)}?`
      )
    ) {
      return;
    }
    try {
      setSettling(true);
      const res = await api.settleIncomeSplit({ weekStart: preview.weekStartDate });
      if (res.success) {
        showToast('Weekend income split settled', 'success');
        await load();
      }
    } catch (err) {
      showToast(err.message || 'Failed to settle', 'error');
    } finally {
      setSettling(false);
    }
  };

  const pctCheck = preview?.percentages
    ? validatePercentages(preview.percentages)
    : { valid: false, sum: 0 };

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
            <h1 className="text-lg font-black tracking-tight">Weekend Income Split</h1>
            <p className="text-[11px] text-zinc-400 font-semibold">
              Fri–Sun shop window · active days only
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="w-9 h-9 rounded-xl bg-[#1c1c22] border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-amber-400 cursor-pointer"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !preview ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-36 rounded-3xl bg-zinc-800/40" />
          <div className="h-24 rounded-3xl bg-zinc-800/30" />
        </div>
      ) : (
        <>
          {/* Week preview hero */}
          <div className="p-5 rounded-[28px] bg-gradient-to-br from-[#1c1917] to-[#121215] border border-amber-500/30 space-y-4 shadow-xl animate-card-in stagger-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  This shop weekend
                </span>
                <div className="flex items-center gap-2 mt-1 text-sm font-bold text-white">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  {formatWeekendRange(preview?.weekStartDate, preview?.weekEndDate)}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                  preview?.alreadySettled
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : preview?.weekClosed
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                {preview?.alreadySettled
                  ? 'Settled'
                  : preview?.weekClosed
                    ? 'Ready to settle'
                    : 'Window open'}
              </span>
            </div>

            <div className="text-3xl font-black tracking-tight">
              {formatCurrency(preview?.totalIncome || 0)}
            </div>
            <p className="text-[11px] text-zinc-400">
              Pool from {preview?.activeDayCount || 0} active day
              {(preview?.activeDayCount || 0) === 1 ? '' : 's'}
              {preview?.allocationError ? ` · ${preview.allocationError}` : ''}
            </p>

            {/* Day breakdown */}
            <div className="grid grid-cols-3 gap-2">
              {(preview?.dayBreakdown || []).map((day) => (
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
                  <div className="text-sm font-black mt-1">{formatCurrency(day.income)}</div>
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

            {/* Allocations */}
            {preview?.allocations && pctCheck.valid && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <PieChart className="w-3.5 h-3.5" />
                  Allocation breakdown
                </div>
                {ALLOCATION_KEYS.map((key) => {
                  const amount = preview.allocations[key] || 0;
                  const pct = preview.percentages?.[key] || 0;
                  const barPct =
                    preview.totalIncome > 0
                      ? Math.min(100, Math.round((amount / preview.totalIncome) * 100))
                      : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-300">
                          {ALLOCATION_LABELS[key]}{' '}
                          <span className="text-zinc-500">({pct}%)</span>
                        </span>
                        <span className="font-black text-white">{formatCurrency(amount)}</span>
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
              disabled={!preview?.canSettle || settling}
              onClick={handleSettle}
              className={`w-full py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
                preview?.canSettle
                  ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {settling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Settling…
                </>
              ) : preview?.alreadySettled ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Already settled
                </>
              ) : preview?.canSettle ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Settle weekend
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  {preview?.weekClosed
                    ? 'Cannot settle'
                    : 'Available after Sunday (Mon 12:00 AM IST)'}
                </>
              )}
            </button>

            {!pctCheck.valid && (
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('settings')}
                className="w-full text-[11px] font-bold text-rose-400 flex items-center justify-center gap-1 cursor-pointer"
              >
                Fix percentages in Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* History */}
          <div className="space-y-2 animate-card-in stagger-3">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 px-1">
              Settlement history
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
