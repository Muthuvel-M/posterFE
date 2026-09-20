import React, { useState, useEffect } from 'react';
import {
  Hexagon,
  Plus,
  GripVertical,
  Trash2,
  Package,
  Edit2,
  PackagePlus,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useCatalog } from '../context/CatalogContext';
import { RestockModal } from '../components/RestockModal';
import { ProductModal } from '../components/ProductModal';
import { formatCurrency } from '../utils/formatters';
import { api } from '../api/client';

export const Inventory = () => {
  const { showToast } = useToast();
  const {
    products,
    updateProductLocally,
    deleteProductLocally,
    isSyncing,
    refreshCatalog,
  } = useCatalog();

  const [activeFilter, setActiveFilter] = useState('poster'); // 'poster' | 'frame'
  const [selectedProductForRestock, setSelectedProductForRestock] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleDelete = async (prod, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${prod.name}" from catalog?`)) return;

    try {
      deleteProductLocally(prod._id);
      const res = await api.deleteProduct(prod._id);
      if (res.success) {
        showToast(`Product "${prod.name}" removed`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const handleRestockSuccess = (updated) => {
    updateProductLocally(updated);
  };

  const handleProductSaved = (saved) => {
    updateProductLocally(saved);
  };

  // Filtered Products by category ('poster', 'frame', 'sticker')
  const filteredProducts = products.filter((p) => {
    if (activeFilter === 'poster') {
      return !p.category || p.category.toLowerCase() === 'poster';
    }
    if (activeFilter === 'frame') {
      return p.category && p.category.toLowerCase() === 'frame';
    }
    if (activeFilter === 'sticker') {
      return p.category && p.category.toLowerCase() === 'sticker';
    }
    return true;
  });

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 pb-32 space-y-5 text-white">
      {/* Modals */}
      <RestockModal
        isOpen={Boolean(selectedProductForRestock)}
        onClose={() => setSelectedProductForRestock(null)}
        product={selectedProductForRestock}
        onRestockSuccess={handleRestockSuccess}
      />

      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSaveSuccess={handleProductSaved}
      />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between animate-card-in stagger-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
            Inventory
            <Hexagon className="w-5 h-5 text-zinc-400 fill-zinc-700" />
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Product Button */}
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-1.5 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-white text-xs font-extrabold flex items-center gap-1 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ADD PRODUCT</span>
          </button>
        </div>
      </div>

      {/* Category Chips: Poster, Frame & Sticker */}
      <div className="flex items-center gap-2 pb-1 animate-card-in stagger-2">
        <button
          type="button"
          onClick={() => setActiveFilter('poster')}
          className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeFilter === 'poster'
              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
              : 'bg-[#151518] text-zinc-400 border border-zinc-800 hover:text-white'
          }`}
        >
          🖼️ Poster
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('frame')}
          className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeFilter === 'frame'
              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
              : 'bg-[#151518] text-zinc-400 border border-zinc-800 hover:text-white'
          }`}
        >
          🔲 Frame
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('sticker')}
          className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeFilter === 'sticker'
              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
              : 'bg-[#151518] text-zinc-400 border border-zinc-800 hover:text-white'
          }`}
        >
          ✨ Sticker
        </button>
      </div>

      {/* Products List Rows */}
      <div key={activeFilter} className="space-y-2.5">
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-[#151518] animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-[#151518] border border-zinc-800/80 animate-card-in stagger-3">
            <Package className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-400">No {activeFilter}s in inventory.</p>
          </div>
        ) : (
          filteredProducts.map((p, idx) => {
            const isLow = p.stock <= p.lowStockThreshold;

            return (
              <div
                key={p._id}
                onClick={() => {
                  setEditingProduct(p);
                  setIsAddModalOpen(true);
                }}
                style={{ animationDelay: `${70 + idx * 30}ms` }}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#151518] hover:bg-[#1a1a1f] border border-zinc-800/80 flex items-center justify-between gap-3 cursor-pointer group transition-all shadow-md animate-card-in"
              >
                {/* Left: Drag Handle & Thumbnail & Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <GripVertical className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 shrink-0" />

                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {p.sku} • {p.size || 'Standard'}
                    </p>
                  </div>
                </div>

                {/* Right: Price, Stock Units, Quick Restock, Edit & Delete */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-white">
                      ₹{p.sellPrice}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductForRestock(p);
                      }}
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md transition-colors cursor-pointer hover:underline ${
                        isLow ? 'text-amber-400 bg-amber-950/40' : 'text-emerald-400 bg-emerald-950/40'
                      }`}
                      title="Click to adjust stock"
                    >
                      {p.stock} units
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Restock Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductForRestock(p);
                      }}
                      className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-emerald-950/60 text-zinc-400 hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer border border-zinc-800/80 hover:border-emerald-700/50"
                      title="Restock units"
                    >
                      <PackagePlus className="w-4 h-4" />
                    </button>

                    {/* Edit Product Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduct(p);
                        setIsAddModalOpen(true);
                      }}
                      className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-amber-950/60 text-zinc-400 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer border border-zinc-800/80 hover:border-amber-500/50"
                      title="Edit product details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Product Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(p, e)}
                      className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer border border-zinc-800/80 hover:border-rose-700/50"
                      title="Delete product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

