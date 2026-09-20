import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useToast } from './ToastContext';

const CatalogContext = createContext(null);

const STORAGE_KEYS = {
  PRODUCTS: 'auraframe_cached_products',
  SUMMARY: 'auraframe_cached_summary',
  SALES: 'auraframe_cached_sales',
  SETTINGS: 'auraframe_cached_settings',
  CUSTOMERS: 'auraframe_cached_customers',
  LAST_SYNC: 'auraframe_last_sync_timestamp',
};

const SYNC_INTERVAL = 30 * 60 * 1000; // 30 Minutes

export const CatalogProvider = ({ children }) => {
  const { showToast } = useToast();

  // Local-First State Initializers
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [todaySummary, setTodaySummary] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.SUMMARY);
      return cached ? JSON.parse(cached) : { revenue: 0, profit: 0, count: 0 };
    } catch {
      return { revenue: 0, profit: 0, count: 0 };
    }
  });

  const [recentSales, setRecentSales] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.SALES);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [customers, setCustomers] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [lastSyncTime, setLastSyncTime] = useState(() => {
    try {
      const t = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return t ? Number(t) : 0;
    } catch {
      return 0;
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // Background Sync function (does not block local UI)
  const refreshCatalog = useCallback(async (force = false) => {
    const now = Date.now();
    const token = localStorage.getItem('auraframe_token');
    if (!token) return;

    // Skip if cache is still fresh within 30 minutes, unless force=true
    if (!force && lastSyncTime && now - lastSyncTime < SYNC_INTERVAL && products.length > 0) {
      return;
    }

    try {
      setIsSyncing(true);
      const [prodsRes, analyticsRes, settingsRes, custRes] = await Promise.all([
        api.getProducts({ active: 'all' }).catch(() => ({})),
        api.getAnalytics({ timeframe: 'today' }).catch(() => ({})),
        api.getSettings().catch(() => ({})),
        api.getCustomers().catch(() => ({})),
      ]);

      if (prodsRes?.data && Array.isArray(prodsRes.data)) {
        setProducts(prodsRes.data);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prodsRes.data));
      }

      if (analyticsRes?.data) {
        const sales = analyticsRes.data.recentSales || [];
        setRecentSales(sales);
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));

        const sum = {
          revenue: analyticsRes.data.summary?.totalRevenue || 0,
          profit: analyticsRes.data.summary?.totalProfit || 0,
          count: analyticsRes.data.summary?.orderCount || 0,
        };
        setTodaySummary(sum);
        localStorage.setItem(STORAGE_KEYS.SUMMARY, JSON.stringify(sum));
      }

      if (settingsRes?.data) {
        setSettings(settingsRes.data);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsRes.data));
      }

      if (custRes?.data && Array.isArray(custRes.data)) {
        setCustomers(custRes.data);
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(custRes.data));
      }

      setLastSyncTime(now);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(now));
    } catch (err) {
      console.warn('Background sync warning:', err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [lastSyncTime, products.length]);

  // Initial Sync & 30-Minute Recurring Interval
  useEffect(() => {
    const token = localStorage.getItem('auraframe_token');
    if (token) {
      // Refresh only if empty or expired (>30m)
      refreshCatalog(false);
    }

    // Auto-refresh every 30 minutes
    const interval = setInterval(() => {
      refreshCatalog(true);
    }, SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [refreshCatalog]);

  // Local Stock & Sales Calculations (Instant 0ms update)
  const deductStockForSale = useCallback((sale) => {
    if (!sale || !sale.items) return;

    // 1. Deduct Stock locally
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const itemMatch = sale.items.find(
          (it) => it.productId === p._id || it.product?._id === p._id || it.name === p.name
        );
        if (itemMatch) {
          const newStock = Math.max(0, (p.stock || 0) - itemMatch.qty);
          return { ...p, stock: newStock };
        }
        return p;
      });
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated;
    });

    // 2. Increment Today's Summary locally
    setTodaySummary((prev) => {
      const next = {
        revenue: (prev.revenue || 0) + (sale.total || 0),
        profit: (prev.profit || 0) + (sale.profit || (sale.total - (sale.cost || 0))),
        count: (prev.count || 0) + 1,
      };
      localStorage.setItem(STORAGE_KEYS.SUMMARY, JSON.stringify(next));
      return next;
    });

    // 3. Prepend to Recent Sales locally
    setRecentSales((prev) => {
      const next = [sale, ...prev.slice(0, 19)];
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateProductLocally = useCallback((savedProduct) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p._id === savedProduct._id);
      let next;
      if (idx > -1) {
        next = [...prev];
        next[idx] = savedProduct;
      } else {
        next = [savedProduct, ...prev];
      }
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(next));
      return next;
    });
  }, []);

  const restockProductLocally = useCallback((productId, adjustment) => {
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p._id === productId) {
          const newStock = Math.max(0, (p.stock || 0) + Number(adjustment));
          return { ...p, stock: newStock };
        }
        return p;
      });
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteProductLocally = useCallback((productId) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p._id !== productId);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateSettingsLocally = useCallback((newSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  }, []);

  const addCustomerLocally = useCallback((newCustomer) => {
    setCustomers((prev) => {
      const next = [newCustomer, ...prev];
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <CatalogContext.Provider
      value={{
        products,
        todaySummary,
        recentSales,
        settings,
        customers,
        isSyncing,
        lastSyncTime,
        refreshCatalog,
        deductStockForSale,
        updateProductLocally,
        restockProductLocally,
        deleteProductLocally,
        updateSettingsLocally,
        addCustomerLocally,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used within a CatalogProvider');
  return context;
};
