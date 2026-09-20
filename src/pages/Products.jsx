import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Check,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useCatalog } from '../context/CatalogContext';
import { ProductModal } from '../components/ProductModal';
import { formatCurrency } from '../utils/formatters';
import { api } from '../api/client';

export const Products = ({ onNavigate }) => {
  const { showToast } = useToast();
  const {
    products,
    updateProductLocally,
    deleteProductLocally,
    isSyncing,
    refreshCatalog,
  } = useCatalog();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = (savedProd) => {
    updateProductLocally(savedProd);
  };

  const handleToggleActive = async (product) => {
    try {
      const updated = { ...product, active: !product.active };
      updateProductLocally(updated);
      const res = await api.updateProduct(product._id, { active: !product.active });
      if (res.success) {
        showToast(
          `Product "${product.name}" ${!product.active ? 'activated' : 'deactivated'}`,
          'info'
        );
      }
    } catch (error) {
      showToast(error.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    try {
      deleteProductLocally(product._id);
      const res = await api.deleteProduct(product._id);
      if (res.success) {
        showToast(`Product "${product.name}" deleted`, 'success');
      }
    } catch (error) {
      showToast(error.message || 'Failed to delete product', 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSize = sizeFilter === 'all' || p.size === sizeFilter;
    return matchesSearch && matchesCat && matchesSize;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-32 space-y-6 text-white">
      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-card-in stagger-1">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer shrink-0"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Product Catalog
            </h1>
            <p className="text-xs text-zinc-400">Manage posters, frames, pricing & margins</p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="self-start sm:self-auto py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Catalog Table Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#16161b] border border-zinc-800/80 space-y-4 shadow-xl animate-card-in stagger-2">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search catalog by title, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs font-semibold text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="poster">Posters</option>
              <option value="frame">Frames</option>
              <option value="sticker">Stickers</option>
            </select>

            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs font-semibold text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Sizes</option>
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="A6">A6</option>
              <option value="₹15">₹15</option>
              <option value="₹30">₹30</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-400 font-semibold uppercase text-[10px] border-b border-zinc-800">
                <th className="text-left pb-2.5">Artwork & Title</th>
                <th className="text-center pb-2.5">Category</th>
                <th className="text-center pb-2.5">Size</th>
                <th className="text-right pb-2.5">Cost</th>
                <th className="text-right pb-2.5">Price</th>
                <th className="text-center pb-2.5">Margin %</th>
                <th className="text-center pb-2.5">Stock</th>
                <th className="text-center pb-2.5">Active</th>
                <th className="text-right pb-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredProducts.map((p, idx) => {
                const profit = p.sellPrice - p.costPrice;
                const margin = p.sellPrice > 0 ? ((profit / p.sellPrice) * 100).toFixed(1) : 0;

                return (
                  <tr
                    key={p._id}
                    style={{ animationDelay: `${90 + idx * 25}ms` }}
                    className={`hover:bg-zinc-800/40 animate-card-in ${
                      !p.active ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-11 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-base">
                              {p.category === 'sticker' ? '✨' : p.category === 'frame' ? '🔲' : <ImageIcon className="w-4 h-4" />}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-white block">
                            {p.name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">{p.sku}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 text-center capitalize text-zinc-300 font-semibold">
                      {p.category === 'sticker' ? '✨ Sticker' : p.category === 'frame' ? '🔲 Frame' : '🖼️ Poster'}
                    </td>

                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300">
                        {p.size}
                      </span>
                    </td>

                    <td className="py-3 text-right text-zinc-400">₹{p.costPrice}</td>

                    <td className="py-3 text-right font-bold text-amber-400">
                      ₹{p.sellPrice}
                    </td>

                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          margin >= 50
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                            : margin > 20
                            ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                        }`}
                      >
                        {margin}% (₹{profit})
                      </span>
                    </td>

                    <td className="py-3 text-center font-bold text-zinc-200">
                      {p.stock}
                    </td>

                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          p.active
                            ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50'
                            : 'text-zinc-500 bg-zinc-900 border border-zinc-800'
                        }`}
                        title={p.active ? 'Click to Deactivate' : 'Click to Activate'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
