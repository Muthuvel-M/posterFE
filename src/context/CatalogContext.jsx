import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

const CatalogContext = createContext(null);

const STORAGE_KEYS = {
  PRODUCTS: 'auraframe_cached_products',
  SUMMARY: 'auraframe_cached_summary',
  SALES: 'auraframe_cached_sales',
  SETTINGS: 'auraframe_cached_settings',
  CUSTOMERS: 'auraframe_cached_customers',
  LAST_SYNC: 'auraframe_last_sync_timestamp',
  OWNER: 'auraframe_cached_owner_id',
  COUNTS: 'auraframe_cached_counts',
};

const SYNC_INTERVAL = 30 * 60 * 1000; // 30 Minutes
const SYNC_FAILURE_COOLDOWN = 60 * 1000;

function clearCatalogLocalStorage() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  });
}

function readCachedOwnerId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.OWNER) || null;
  } catch {
    return null;
  }
}

function readAuthUserId() {
  try {
    const raw = localStorage.getItem('auraframe_user');
    if (!raw || raw === 'undefined') return null;
    const user = JSON.parse(raw);
    return user?._id || user?.id || null;
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Catalog cache write failed:', err.message);
  }
}

export const CatalogProvider = ({ children }) => {
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
  const [dashboardCounts, setDashboardCounts] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.COUNTS);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const lastSyncTimeRef = useRef(lastSyncTime);
  const productsCountRef = useRef(products.length);
  const isSyncingRef = useRef(false);
  const lastFailureAtRef = useRef(0);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    lastSyncTimeRef.current = lastSyncTime;
  }, [lastSyncTime]);

  useEffect(() => {
    productsCountRef.current = products.length;
  }, [products.length]);

  const resetLocalCatalogState = useCallback(() => {
    bootstrappedRef.current = false;
    lastSyncTimeRef.current = 0;
    productsCountRef.current = 0;
    lastFailureAtRef.current = 0;
    setProducts([]);
    setTodaySummary({ revenue: 0, profit: 0, count: 0 });
    setRecentSales([]);
    setSettings(null);
    setCustomers([]);
    setDashboardCounts(null);
    setLastSyncTime(0);
  }, []);

  const applyBootstrapData = useCallback((data) => {
    if (!data) return;

    if (Array.isArray(data.products)) {
      setProducts(data.products);
      safeSet(STORAGE_KEYS.PRODUCTS, data.products);
    }

    if (data.settings) {
      setSettings(data.settings);
      safeSet(STORAGE_KEYS.SETTINGS, data.settings);
    }

    if (Array.isArray(data.customers)) {
      setCustomers(data.customers);
      safeSet(STORAGE_KEYS.CUSTOMERS, data.customers);
    }

    if (Array.isArray(data.recentSales)) {
      setRecentSales(data.recentSales);
      safeSet(STORAGE_KEYS.SALES, data.recentSales);
    }

    if (data.todaySummary) {
      setTodaySummary(data.todaySummary);
      safeSet(STORAGE_KEYS.SUMMARY, data.todaySummary);
    }

    if (data.counts) {
      const countsPayload = {
        cashInHand: data.counts.cashFlow?.cashInHand ?? 0,
        cashFlow: data.counts.cashFlow || null,
        customOrders: data.counts.customOrders || null,
        lifetime: data.counts.lifetime || null,
        cachedAt: Date.now(),
      };
      setDashboardCounts(countsPayload);
      safeSet(STORAGE_KEYS.COUNTS, countsPayload);
    }

    const now = Date.now();
    setLastSyncTime(now);
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(now));
    } catch {
      /* ignore */
    }
    bootstrappedRef.current = true;
  }, []);

  /** Single round-trip cold start via GET /api/bootstrap */
  const bootstrapFromApi = useCallback(async () => {
    const token = localStorage.getItem('auraframe_token');
    if (!token || isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      setIsSyncing(true);
      const res = await api.getBootstrap();
      if (res?.success && res.data) {
        applyBootstrapData(res.data);
        lastFailureAtRef.current = 0;
      }
    } catch (err) {
      lastFailureAtRef.current = Date.now();
      console.warn('Bootstrap warning:', err.message);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [applyBootstrapData]);

  /** Light 30-minute refresh: products + settings only */
  const refreshCatalog = useCallback(async (force = false) => {
    const now = Date.now();
    const token = localStorage.getItem('auraframe_token');
    if (!token) return;
    if (isSyncingRef.current) return;

    if (
      !force &&
      lastFailureAtRef.current &&
      now - lastFailureAtRef.current < SYNC_FAILURE_COOLDOWN
    ) {
      return;
    }

    if (
      !force &&
      lastSyncTimeRef.current &&
      now - lastSyncTimeRef.current < SYNC_INTERVAL &&
      productsCountRef.current > 0
    ) {
      return;
    }

    try {
      isSyncingRef.current = true;
      setIsSyncing(true);
      const [prodsRes, settingsRes] = await Promise.all([
        api.getProducts({ active: 'all' }),
        api.getSettings(),
      ]);

      if (prodsRes?.data && Array.isArray(prodsRes.data)) {
        setProducts(prodsRes.data);
        safeSet(STORAGE_KEYS.PRODUCTS, prodsRes.data);
      }

      if (settingsRes?.data) {
        setSettings(settingsRes.data);
        safeSet(STORAGE_KEYS.SETTINGS, settingsRes.data);
      }

      lastFailureAtRef.current = 0;
      setLastSyncTime(now);
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(now));
      } catch {
        /* ignore */
      }
    } catch (err) {
      lastFailureAtRef.current = Date.now();
      console.warn('Background sync warning:', err.message);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    const token = localStorage.getItem('auraframe_token');
    if (!token || isSyncingRef.current) return;
    try {
      isSyncingRef.current = true;
      setIsSyncing(true);
      const prodsRes = await api.getProducts({ active: 'all' });
      if (prodsRes?.data && Array.isArray(prodsRes.data)) {
        setProducts(prodsRes.data);
        safeSet(STORAGE_KEYS.PRODUCTS, prodsRes.data);
      }
    } catch (err) {
      console.warn('Products refresh warning:', err.message);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  const bootstrapForCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('auraframe_token');
    if (!token) return;

    const userId = readAuthUserId();
    const cachedOwner = readCachedOwnerId();
    if (userId && cachedOwner && userId !== cachedOwner) {
      clearCatalogLocalStorage();
      resetLocalCatalogState();
    }
    if (userId) {
      try {
        localStorage.setItem(STORAGE_KEYS.OWNER, String(userId));
      } catch {
        /* ignore */
      }
    }

    await bootstrapFromApi();
  }, [bootstrapFromApi, resetLocalCatalogState]);

  useEffect(() => {
    const token = localStorage.getItem('auraframe_token');
    if (token) {
      bootstrapForCurrentUser();
    }

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      refreshCatalog(true);
    }, SYNC_INTERVAL);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshCatalog(false);
      }
    };

    const onAuthLogin = () => {
      bootstrapForCurrentUser();
    };

    const onAuthLogout = () => {
      clearCatalogLocalStorage();
      resetLocalCatalogState();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('auraframe_login', onAuthLogin);
    window.addEventListener('auraframe_logout', onAuthLogout);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('auraframe_login', onAuthLogin);
      window.removeEventListener('auraframe_logout', onAuthLogout);
    };
  }, [bootstrapForCurrentUser, refreshCatalog, resetLocalCatalogState]);

  const deductStockForSale = useCallback((sale) => {
    if (!sale || !Array.isArray(sale.items)) return;

    const matchProductId = (item, productId) => {
      const candidates = [item.productId, item.product?._id, item.product];
      return candidates.some((id) => id != null && String(id) === String(productId));
    };

    setProducts((prev) => {
      const updated = prev.map((p) => {
        const itemMatch = sale.items.find(
          (it) => matchProductId(it, p._id) || (it.name && it.name === p.name)
        );
        if (itemMatch) {
          const newStock = Math.max(0, (p.stock || 0) - (Number(itemMatch.qty) || 0));
          return { ...p, stock: newStock };
        }
        return p;
      });
      safeSet(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });

    setTodaySummary((prev) => {
      const next = {
        revenue: (prev.revenue || 0) + (Number(sale.total) || 0),
        profit:
          (prev.profit || 0) +
          (Number(sale.profit) || Math.max(0, (Number(sale.total) || 0) - (Number(sale.cost) || 0))),
        count: (prev.count || 0) + 1,
      };
      safeSet(STORAGE_KEYS.SUMMARY, next);
      return next;
    });

    setRecentSales((prev) => {
      let plainSale;
      try {
        plainSale = JSON.parse(JSON.stringify(sale));
      } catch {
        plainSale = {
          _id: sale._id,
          saleNumber: sale.saleNumber,
          total: sale.total,
          profit: sale.profit,
          paymentMethod: sale.paymentMethod,
          paymentStatus: sale.paymentStatus,
          createdAt: sale.createdAt || new Date().toISOString(),
          customerSnapshot: sale.customerSnapshot || null,
          items: (sale.items || []).map((it) => ({
            name: it.name,
            qty: it.qty,
            sellPrice: it.sellPrice,
            product: it.product?._id || it.product || it.productId,
          })),
        };
      }
      const next = [plainSale, ...(Array.isArray(prev) ? prev.slice(0, 19) : [])];
      safeSet(STORAGE_KEYS.SALES, next);
      return next;
    });

    // Keep cash-in-hand cache roughly in sync for cash sales
    setDashboardCounts((prev) => {
      if (!prev) return prev;
      const method = String(sale.paymentMethod || '').toLowerCase();
      if (method !== 'cash') return prev;
      const next = {
        ...prev,
        cashInHand: Math.max(0, (Number(prev.cashInHand) || 0) + (Number(sale.total) || 0)),
        cachedAt: Date.now(),
      };
      safeSet(STORAGE_KEYS.COUNTS, next);
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
      safeSet(STORAGE_KEYS.PRODUCTS, next);
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
      safeSet(STORAGE_KEYS.PRODUCTS, next);
      return next;
    });
  }, []);

  const deleteProductLocally = useCallback((productId) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p._id !== productId);
      safeSet(STORAGE_KEYS.PRODUCTS, next);
      return next;
    });
  }, []);

  const updateSettingsLocally = useCallback((newSettings) => {
    setSettings(newSettings);
    safeSet(STORAGE_KEYS.SETTINGS, newSettings);
  }, []);

  const addCustomerLocally = useCallback((newCustomer) => {
    setCustomers((prev) => {
      const next = [newCustomer, ...prev];
      safeSet(STORAGE_KEYS.CUSTOMERS, next);
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
        dashboardCounts,
        isSyncing,
        lastSyncTime,
        refreshCatalog,
        refreshProducts,
        bootstrapFromApi,
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
