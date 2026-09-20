import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider, useCart } from './context/CartContext';
import { BottomNav } from './components/BottomNav';
import { PayModal } from './components/PayModal';
import { ReceiptModal } from './components/ReceiptModal';
import { InstantQRModal } from './components/InstantQRModal';
import { InstagramQRModal } from './components/InstagramQRModal';
import { ProductModal } from './components/ProductModal';
import { RawMaterialModal } from './components/RawMaterialModal';
import { Login } from './pages/Login';
import { HomeBento } from './pages/HomeBento';
import { Checkout } from './pages/Checkout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Products } from './pages/Products';
import { Customers } from './pages/Customers';
import { SalesHistory } from './pages/SalesHistory';
import { Settings } from './pages/Settings';
import { api } from './api/client';

const MainLayout = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { showReceipt } = useCart();

  const [activeTab, setActiveTab] = useState('home'); // Home Bento as default
  const [settings, setSettings] = useState(null);
  const [customers, setCustomers] = useState([]);
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

      if (settingsRes?.data) setSettings(settingsRes.data);
      if (custRes?.data) setCustomers(custRes.data);
      setCatalogVersion((prev) => prev + 1);
    } catch (err) {
      console.error('App init data error:', err);
    }
  };

  const handleCustomerCreated = (newCust) => {
    setCustomers((prev) => [newCust, ...prev]);
  };

  const handleProductSaved = () => {
    setCatalogVersion((prev) => prev + 1);
    loadInitialAppData();
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">Loading AuraFrame POS...</span>
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
            <Dashboard onOpenReceipt={(sale) => showReceipt(sale)} />
          )}
          {activeTab === 'inventory' && (
            <Inventory
              catalogVersion={catalogVersion}
              onProductUpdated={handleProductSaved}
              onNavigateToProducts={() => setActiveTab('products')}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
            />
          )}
          {activeTab === 'products' && (
            <Products
              catalogVersion={catalogVersion}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'customers' && (
            <Customers
              onOpenReceipt={(sale) => showReceipt(sale)}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'sales' && (
            <SalesHistory
              settings={settings}
              onOpenReceipt={(sale) => showReceipt(sale)}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'settings' && (
            <Settings
              user={user}
              settings={settings}
              onSettingsUpdated={(newSet) => setSettings(newSet)}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
        </div>
      </main>

      {/* Global Modals */}
      <PayModal
        settings={settings}
        onSaleSuccess={handleProductSaved}
        onNavigate={(tab) => setActiveTab(tab)}
      />
      <ReceiptModal settings={settings} />
      <InstantQRModal
        isOpen={isInstantQROpen}
        onClose={() => setIsInstantQROpen(false)}
        settings={settings}
      />
      <InstagramQRModal
        isOpen={isInstagramQROpen}
        onClose={() => setIsInstagramQROpen(false)}
        settings={settings}
        user={user}
      />
      <ProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSaveSuccess={handleProductSaved}
      />
      <RawMaterialModal
        isOpen={isRawMaterialOpen}
        onClose={() => setIsRawMaterialOpen(false)}
        onSaveSuccess={() => {
          setCatalogVersion((prev) => prev + 1);
          loadInitialAppData();
        }}
      />


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
