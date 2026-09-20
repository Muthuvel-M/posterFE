import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider, useCart } from './context/CartContext';
import { BottomNav } from './components/BottomNav';
import { PayModal } from './components/PayModal';
import { ReceiptModal } from './components/ReceiptModal';
import { Login } from './pages/Login';
import { HomeBento } from './pages/HomeBento';
import { Checkout } from './pages/Checkout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { api } from './api/client';

// Lazy load secondary pages for ultra-lightweight initial mobile bundle
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Inventory = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const Products = lazy(() => import('./pages/Products').then(m => ({ default: m.Products })));
const Customers = lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })));
const SalesHistory = lazy(() => import('./pages/SalesHistory').then(m => ({ default: m.SalesHistory })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Customization = lazy(() => import('./pages/Customization').then(m => ({ default: m.Customization })));

// Lazy load conditional dialogs
const InstantQRModal = lazy(() => import('./components/InstantQRModal').then(m => ({ default: m.InstantQRModal })));
const InstagramQRModal = lazy(() => import('./components/InstagramQRModal').then(m => ({ default: m.InstagramQRModal })));
const ProductModal = lazy(() => import('./components/ProductModal').then(m => ({ default: m.ProductModal })));
const RawMaterialModal = lazy(() => import('./components/RawMaterialModal').then(m => ({ default: m.RawMaterialModal })));

const PageLoadingFallback = () => (
  <div className="max-w-xl mx-auto px-4 py-8 space-y-4 animate-pulse">
    <div className="h-8 w-48 bg-zinc-800/60 rounded-2xl" />
    <div className="h-36 w-full bg-zinc-800/40 rounded-3xl" />
    <div className="h-24 w-full bg-zinc-800/30 rounded-2xl" />
  </div>
);

const MainLayout = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { showReceipt } = useCart();

  const [activeTab, setActiveTab] = useState('home'); // Home Bento as default
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('auraframe_cached_settings');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [customers, setCustomers] = useState(() => {
    try {
      const cached = localStorage.getItem('auraframe_cached_customers');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [isInstantQROpen, setIsInstantQROpen] = useState(false);
  const [isInstagramQROpen, setIsInstagramQROpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isRawMaterialOpen, setIsRawMaterialOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialAppData();
    }
  }, [isAuthenticated]);

  const loadInitialAppData = async () => {
    try {
      const [settingsRes, custRes] = await Promise.all([
        api.getSettings().catch(() => ({})),
        api.getCustomers().catch(() => ({})),
      ]);

      if (settingsRes?.data) {
        setSettings(settingsRes.data);
        localStorage.setItem('auraframe_cached_settings', JSON.stringify(settingsRes.data));
      }
      if (custRes?.data) {
        setCustomers(custRes.data);
        localStorage.setItem('auraframe_cached_customers', JSON.stringify(custRes.data));
      }
      setCatalogVersion((prev) => prev + 1);
    } catch (err) {
      console.error('App init data error:', err);
    }
  };

  const handleCustomerCreated = (newCust) => {
    setCustomers((prev) => {
      const next = [newCust, ...prev];
      localStorage.setItem('auraframe_cached_customers', JSON.stringify(next));
      return next;
    });
  };

  const handleProductSaved = () => {
    setCatalogVersion((prev) => prev + 1);
    loadInitialAppData();
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0c0c0e]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-zinc-400">Loading AuraFrame POS...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-slate-100 flex flex-col selection:bg-amber-400 selection:text-black">
      {/* Main Screen Router */}
      <main className="flex-1 w-full">
        <ErrorBoundary onNavigateHome={() => setActiveTab('home')}>
          <div key={activeTab} className="animate-tab-slide">
            {activeTab === 'home' && (
              <HomeBento
                user={user}
                catalogVersion={catalogVersion}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenAddProduct={() => setIsAddProductOpen(true)}
                onOpenRawMaterial={() => setIsRawMaterialOpen(true)}
                onOpenInstantQR={() => setIsInstantQROpen(true)}
                onOpenInstagramQR={() => setIsInstagramQROpen(true)}
                onOpenReceipt={(sale) => showReceipt(sale)}
              />
            )}
            {activeTab === 'checkout' && (
              <Checkout
                catalogVersion={catalogVersion}
                customers={customers}
                onCustomerCreated={handleCustomerCreated}
                onOpenAddProduct={() => setIsAddProductOpen(true)}
              />
            )}
            {activeTab === 'dashboard' && (
              <Suspense fallback={<PageLoadingFallback />}>
                <Dashboard onOpenReceipt={(sale) => showReceipt(sale)} />
              </Suspense>
            )}
            {activeTab === 'inventory' && (
              <Suspense fallback={<PageLoadingFallback />}>
                <Inventory
                  catalogVersion={catalogVersion}
                  onProductUpdated={handleProductSaved}
                  onNavigateToProducts={() => setActiveTab('products')}
                  onOpenAddProduct={() => setIsAddProductOpen(true)}
                />
              </Suspense>
            )}
            {activeTab === 'products' && (
              <Suspense fallback={<PageLoadingFallback />}>
                <Products
                  catalogVersion={catalogVersion}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              </Suspense>
            )}
            {activeTab === 'customers' && (
              <Suspense fallback={<PageLoadingFallback />}>
                <Customers
                  onOpenReceipt={(sale) => showReceipt(sale)}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              </Suspense>
            )}
            {activeTab === 'sales' && (
              <Suspense fallback={<PageLoadingFallback />}>
                <SalesHistory
                  settings={settings}
                  onOpenReceipt={(sale) => showReceipt(sale)}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              </Suspense>
            )}
            {activeTab === 'settings' && (
              <Suspense fallback={<PageLoadingFallback />}>
                <Settings
                  user={user}
                  settings={settings}
                  onSettingsUpdated={(newSet) => {
                    setSettings(newSet);
                    localStorage.setItem('auraframe_cached_settings', JSON.stringify(newSet));
                  }}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              </Suspense>
            )}
            {activeTab === 'customization' && (
              <Suspense fallback={<PageLoadingFallback />}>
                <Customization onNavigate={(tab) => setActiveTab(tab)} />
              </Suspense>
            )}
          </div>
        </ErrorBoundary>
      </main>

      {/* Global Modals */}
      <PayModal
        settings={settings}
        onSaleSuccess={handleProductSaved}
        onNavigate={(tab) => setActiveTab(tab)}
      />
      <ReceiptModal settings={settings} />

      <Suspense fallback={null}>
        {isInstantQROpen && (
          <InstantQRModal
            isOpen={isInstantQROpen}
            onClose={() => setIsInstantQROpen(false)}
            settings={settings}
          />
        )}
        {isInstagramQROpen && (
          <InstagramQRModal
            isOpen={isInstagramQROpen}
            onClose={() => setIsInstagramQROpen(false)}
            settings={settings}
            user={user}
          />
        )}
        {isAddProductOpen && (
          <ProductModal
            isOpen={isAddProductOpen}
            onClose={() => setIsAddProductOpen(false)}
            onSaveSuccess={handleProductSaved}
          />
        )}
        {isRawMaterialOpen && (
          <RawMaterialModal
            isOpen={isRawMaterialOpen}
            onClose={() => setIsRawMaterialOpen(false)}
            onSaveSuccess={() => {
              setCatalogVersion((prev) => prev + 1);
              loadInitialAppData();
            }}
          />
        )}
      </Suspense>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <MainLayout />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
