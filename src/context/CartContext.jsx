import React, { createContext, useContext, useState, useMemo } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const { showToast } = useToast();

  const addToCart = (product, qty = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product._id === product._id);

      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].qty;
        const newQty = currentQty + qty;

        if (newQty > product.stock) {
          showToast(`Only ${product.stock} in stock for "${product.name}"`, 'error');
          return prev;
        }

        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: newQty,
        };
        return updated;
      } else {
        if (qty > product.stock) {
          showToast(`Only ${product.stock} in stock for "${product.name}"`, 'error');
          return prev;
        }

        return [
          ...prev,
          {
            product,
            qty,
            freeQty: 0,
            sellPrice: product.sellPrice,
            costPrice: product.costPrice,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const updateQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product._id !== productId) return item;
        if (newQty > item.product.stock) {
          showToast(`Max available stock is ${item.product.stock}`, 'error');
          return item;
        }
        const currentFree = Number(item.freeQty) || 0;
        const clampedFree = Math.min(newQty, currentFree);
        return { ...item, qty: newQty, freeQty: clampedFree };
      })
    );
  };

  const setFreeQuantities = (updates) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (updates && updates[item.product._id] !== undefined) {
          const rawFree = Math.max(0, Number(updates[item.product._id]) || 0);
          const clampedFree = Math.min(item.qty, rawFree);
          return { ...item, freeQty: clampedFree };
        }
        return item;
      })
    );
  };

  const setFreeQty = (productId, nextFreeQty) => {
    setFreeQuantities({ [productId]: nextFreeQty });
  };

  const updateCustomPrice = (productId, price) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product._id === productId ? { ...item, sellPrice: Number(price) || 0 } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCustomer(null);
    setDiscount(0);
    setNotes('');
  };

  // Calculations
  const { subtotal, grossSubtotal, freeDiscount, estimatedCost, estimatedProfit, total, itemCount, marginPct } = useMemo(() => {
    let paidSub = 0;
    let freeValue = 0;
    let cost = 0;
    let count = 0;

    cartItems.forEach((item) => {
      const freeQty = Number(item.freeQty) || 0;
      const paid = Math.max(0, item.qty - freeQty);
      paidSub += item.sellPrice * paid;
      freeValue += item.sellPrice * freeQty;
      cost += item.product.costPrice * item.qty;
      count += item.qty;
    });

    const disc = Math.min(paidSub, Math.max(0, Number(discount) || 0));
    const tot = Math.max(0, paidSub - disc);
    const profit = Math.max(0, (paidSub - cost) - disc);
    const margin = tot > 0 ? Number(((profit / tot) * 100).toFixed(1)) : 0;

    return {
      subtotal: paidSub,
      grossSubtotal: paidSub + freeValue,
      freeDiscount: freeValue,
      estimatedCost: cost,
      estimatedProfit: profit,
      total: tot,
      itemCount: count,
      marginPct: margin,
    };
  }, [cartItems, discount]);

  const openPayModal = () => {
    if (cartItems.length === 0) {
      showToast('Cart is empty. Add products to checkout.', 'error');
      return;
    }
    setIsPayModalOpen(true);
  };

  const closePayModal = () => {
    setIsPayModalOpen(false);
  };

  const showReceipt = (sale) => {
    setCompletedSale(sale);
    setIsReceiptModalOpen(true);
  };

  const closeReceiptModal = () => {
    setIsReceiptModalOpen(false);
    setCompletedSale(null);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        customer,
        discount,
        notes,
        subtotal,
        grossSubtotal,
        freeDiscount,
        estimatedCost,
        estimatedProfit,
        total,
        itemCount,
        marginPct,
        isPayModalOpen,
        completedSale,
        isReceiptModalOpen,
        addToCart,
        removeFromCart,
        updateQty,
        setFreeQty,
        setFreeQuantities,
        updateCustomPrice,
        setDiscount,
        setCustomer,
        setNotes,
        clearCart,
        openPayModal,
        closePayModal,
        showReceipt,
        closeReceiptModal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
