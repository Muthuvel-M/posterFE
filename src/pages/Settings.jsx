import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Sun,
  Moon,
  LogOut,
  Crown,
  Zap,
  Pencil,
  Users,
  FileText,
  Bell,
  Upload,
  Sliders,
  DollarSign,
  Check,
  ChevronRight,
  Shield,
  CreditCard,
  Save,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { InstagramIcon } from '../components/InstagramIcon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export const Settings = ({ user: propUser, settings, onSettingsUpdated, onNavigate }) => {
  const { user: authUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const user = propUser || authUser;

  const [formData, setFormData] = useState({
    businessName: '',
    paymentMode: 'direct', // 'direct' | 'gateway'
    upiId: '',
    secondaryUpiId: '',
    instagramUrl: '',
    phone: '',
    tagline: '',
    address: '',
    currency: 'INR',
    accentColor: 'amber',
    appearanceMode: isDark ? 'dark' : 'light',
    showLogoOnReceipts: true,
    showUpiQrOnReceipt: true,
    autoSendWhatsappReceipt: true,
    receiptFooterNote: 'Thank you for shopping!',
    quickSaleAi: false,
    floatingCalculator: false,
    lowStockThreshold: 5,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        businessName: settings.businessName || 'Muthuvel M',
        paymentMode: settings.paymentMode || 'direct',
        upiId: settings.upiId || '',
        secondaryUpiId: settings.secondaryUpiId || '',
        instagramUrl: settings.instagramUrl || 'https://instagram.com/mybusiness',
        phone: settings.phone || '+91 9876543210',
        tagline: settings.tagline || 'Posters & Custom Framing',
        address: settings.address || '',
        currency: settings.currency || 'INR',
        receiptFooterNote: settings.receiptFooterNote || 'Thank you for shopping!',
        lowStockThreshold: settings.lowStockThreshold || 5,
      }));
    }
  }, [settings]);

  const upiIdRegex = /^[\w.\-]{2,}@[\w]{2,}$/;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (formData.upiId && !upiIdRegex.test(formData.upiId)) {
      showToast('Invalid UPI ID format. Expected format: name@bank (e.g. store@okhdfcbank)', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.updateSettings(formData);
      if (res.success) {
        showToast('Settings saved successfully', 'success');
        if (onSettingsUpdated) onSettingsUpdated(res.data);
      }
    } catch (error) {
      showToast(error.message || 'Failed to update settings', 'error');
    } finally {
      setSubmitting(false);
    }
  };


  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  const handleExportData = async () => {
    try {
      showToast('Preparing live data export from database...', 'info');
      const [prodsRes, salesRes, custsRes] = await Promise.all([
        api.getProducts({ active: 'all' }).catch(() => ({ data: [] })),
        api.getSales().catch(() => ({ data: [] })),
        api.getCustomers().catch(() => ({ data: [] })),
      ]);

      const data = {
        exportedAt: new Date().toISOString(),
        businessName: formData.businessName,
        upiId: formData.upiId,
        products: prodsRes?.data || [],
        sales: salesRes?.data || [],
        customers: custsRes?.data || [],
      };

      const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `auraframe_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Database export downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to export data: ' + err.message, 'error');
    }
  };

  const userName = user?.name || formData.businessName || 'Muthuvel M';
  const userEmail = user?.email || 'mmuthuvel126@gmail.com';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'MU';

  const accentColors = [
    { id: 'purple', class: 'bg-[#818cf8]' },
    { id: 'red', class: 'bg-[#ef4444]' },
    { id: 'blue', class: 'bg-[#3b82f6]' },
    { id: 'green', class: 'bg-[#10b981]' },
    { id: 'amber', class: 'bg-[#f59e0b]' },
    { id: 'pink', class: 'bg-[#ec4899]' },
    { id: 'slate', class: 'bg-[#64748b]' },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 pb-32 space-y-5 text-white">
      {/* ─────────────────────────────────────────────────────────────
          TOP HEADER: Settings Title & Save Button (Image 1)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1 animate-card-in stagger-1">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          Settings
        </h1>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-1.5 rounded-xl bg-zinc-800/95 hover:bg-zinc-700/90 text-amber-300 font-bold border border-zinc-700/80 text-xs shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-60"
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          USER PROFILE CARD (Image 1)
         ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-3xl bg-[#1c1c22] border border-zinc-800/80 flex items-center gap-4 shadow-lg animate-card-in stagger-2">
        {/* Avatar with Edit Pencil Badge */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-zinc-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-400/20">
            {userInitials}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-sm">
            <Pencil className="w-2.5 h-2.5 text-zinc-300" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-white tracking-tight truncate">
            {userName}
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            {formData.upiId ? formData.upiId : 'No UPI'} · {formData.currency}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION: BUSINESS (Image 1)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2 animate-card-in stagger-3">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 px-1">
          BUSINESS & PAYMENTS
        </h2>

        <div className="p-4 rounded-3xl bg-[#1c1c22] border border-zinc-800/80 space-y-4 shadow-lg">
          {/* Business Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                Business Name
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Business Name"
                className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Primary UPI */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                  Primary UPI ID (VPA)
                </label>
                {formData.upiId && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(formData.upiId) && (
                  <span className="text-[10px] font-bold text-rose-400">
                    Format: name@bank
                  </span>
                )}
              </div>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="name@upi"
                className={`w-full bg-transparent text-sm font-mono focus:outline-none placeholder:text-zinc-600 ${formData.upiId && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(formData.upiId)
                  ? 'text-rose-400 font-semibold'
                  : 'text-zinc-200'
                  }`}
              />
            </div>
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Secondary UPI */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                Secondary UPI
              </label>
              <input
                type="text"
                value={formData.secondaryUpiId}
                onChange={(e) => setFormData({ ...formData, secondaryUpiId: e.target.value })}
                placeholder="name@bank"
                className="w-full bg-transparent text-sm font-mono text-zinc-200 focus:outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Address */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Shop address"
                className="w-full bg-transparent text-sm text-zinc-200 focus:outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Instagram Link */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
              <InstagramIcon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                Instagram Link
              </label>
              <input
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/mybusiness"
                className="w-full bg-transparent text-sm text-zinc-200 focus:outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Currency */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block">
                  Currency
                </label>
                <span className="text-sm font-bold text-white">{formData.currency}</span>
              </div>
            </div>

            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="bg-zinc-800/90 text-xs font-bold text-white px-3 py-1.5 rounded-xl border border-zinc-700/80 focus:outline-none cursor-pointer"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION: RECEIPT & BRANDING (Image 2)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2 animate-card-in stagger-4">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 px-1">
          RECEIPT & BRANDING
        </h2>

        <div className="p-4 rounded-3xl bg-[#1c1c22] border border-zinc-800/80 space-y-4 shadow-lg">
          {/* Show logo on receipts */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">Show logo on receipts</p>
              <p className="text-[11px] text-zinc-400">Displays your business logo</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, showLogoOnReceipts: !formData.showLogoOnReceipts })
              }
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${formData.showLogoOnReceipts ? 'bg-amber-400' : 'bg-zinc-800'
                }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${formData.showLogoOnReceipts ? 'left-6' : 'left-1'
                  }`}
              />
            </button>
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Show UPI QR on receipt */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">Show UPI QR on receipt</p>
              <p className="text-[11px] text-zinc-400">Digital & printed receipts</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, showUpiQrOnReceipt: !formData.showUpiQrOnReceipt })
              }
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${formData.showUpiQrOnReceipt ? 'bg-amber-400' : 'bg-zinc-800'
                }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${formData.showUpiQrOnReceipt ? 'left-6' : 'left-1'
                  }`}
              />
            </button>
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Auto-send WhatsApp receipt */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">
                Auto-send WhatsApp receipt
              </p>
              <p className="text-[11px] text-zinc-400">After each paid sale</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  autoSendWhatsappReceipt: !formData.autoSendWhatsappReceipt,
                })
              }
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${formData.autoSendWhatsappReceipt ? 'bg-amber-400' : 'bg-zinc-800'
                }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${formData.autoSendWhatsappReceipt ? 'left-6' : 'left-1'
                  }`}
              />
            </button>
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Receipt footer note */}
          <div>
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-bold mb-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Receipt footer note</span>
            </div>
            <input
              type="text"
              value={formData.receiptFooterNote}
              onChange={(e) => setFormData({ ...formData, receiptFooterNote: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION: CRM (Image 2)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2 animate-card-in stagger-5">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 px-1">CRM</h2>

        <div
          onClick={() => onNavigate && onNavigate('customers')}
          className="p-4 rounded-3xl bg-[#1c1c22] hover:bg-[#23232b] border border-zinc-800/80 flex items-center justify-between cursor-pointer transition-all group shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">Manage Customers</h3>
              <p className="text-[11px] text-zinc-400">View profiles & purchase history</p>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION: INVENTORY (Image 3)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2 animate-card-in stagger-6">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 px-1">
          INVENTORY
        </h2>

        <div className="p-4 rounded-3xl bg-[#1c1c22] border border-zinc-800/80 space-y-4 shadow-lg">
          {/* Low stock alert threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Bell className="w-3.5 h-3.5 text-zinc-400" />
                <span>Low stock alert threshold</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300">
                {formData.lowStockThreshold} units
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="20"
              value={formData.lowStockThreshold}
              onChange={(e) =>
                setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })
              }
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
          </div>

          <div className="h-px bg-zinc-800/80" />

          {/* Export all data */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white">Export all data</p>
                <p className="text-[11px] text-zinc-400">Inventory, sales & customers (.json)</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportData}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-emerald-400 border border-zinc-700/80 transition-colors cursor-pointer active:scale-95"
            >
              Export Live Data
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION: ACCOUNT (Image 3)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2 animate-card-in stagger-7">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 px-1">
          ACCOUNT
        </h2>

        {/* Account Email Card */}
        <div className="p-4 rounded-3xl bg-[#1c1c22] border border-zinc-800/80 flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-white">Google Account</p>
            <p className="text-xs text-zinc-400 truncate">{userEmail}</p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full p-4 rounded-3xl bg-rose-950/20 hover:bg-rose-950/30 border border-rose-900/50 flex items-center justify-center gap-2 text-rose-400 font-bold text-sm transition-all active:scale-[0.99] cursor-pointer shadow-lg"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>

      {/* Footer Text */}
      <div className="text-center pt-2 pb-4">
        <p className="text-[11px] font-medium text-zinc-400">
          AuraFrame POS v1.0.0 · Made with care
        </p>
      </div>
    </div>
  );
};
