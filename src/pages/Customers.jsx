import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { CustomerModal } from '../components/CustomerModal';
import { CustomerDetailDrawer } from '../components/CustomerDetailDrawer';
import { formatCurrency } from '../utils/formatters';
import { api } from '../api/client';

export const Customers = ({ onOpenReceipt, onNavigate }) => {
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers();
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (error) {
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = (savedCust) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c._id === savedCust._id);
      if (exists) {
        return prev.map((c) => (c._id === savedCust._id ? savedCust : c));
      }
      return [savedCust, ...prev];
    });
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.instagramHandle && c.instagramHandle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 pb-32 space-y-5 text-white">
      {/* Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={editingCustomer}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Slide-over Customer Purchase History Drawer (Screenshot 3) */}
      <CustomerDetailDrawer
        isOpen={Boolean(selectedCustomerId)}
        onClose={() => setSelectedCustomerId(null)}
        customerId={selectedCustomerId}
        onOpenReceipt={onOpenReceipt}
        onCustomerDeleted={(deletedId) => {
          setCustomers((prev) => prev.filter((c) => c._id !== deletedId));
          setSelectedCustomerId(null);
        }}
      />

      {/* Page Header matching Screenshot 2 */}
      <div className="flex items-center justify-between animate-card-in stagger-1">
        <div className="flex items-center gap-2.5">
          {onNavigate && (
            <button
              onClick={() => onNavigate('home')}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Customers
          </h1>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-1.5 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-zinc-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>ADD</span>
        </button>
      </div>

      {/* Search Input matching Screenshot 2 */}
      <div className="relative animate-card-in stagger-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#16161a] border border-zinc-800/80 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
        />
      </div>

      {/* Customer Cards List matching Screenshot 2 */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="space-y-2.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-[#16161a] border border-zinc-800/80 animate-pulse" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-[#16161a] border border-zinc-800/80 animate-card-in stagger-3">
            <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-300">No customers found</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Add a new customer to get started.</p>
          </div>
        ) : (
          filteredCustomers.map((cust, idx) => {
            const initial = cust.name ? cust.name.charAt(0).toUpperCase() : 'M';
            const orderCount = cust.orderCount || 1;

            return (
              <div
                key={cust._id}
                onClick={() => setSelectedCustomerId(cust._id)}
                style={{ animationDelay: `${70 + idx * 35}ms` }}
                className="p-3.5 sm:p-4 rounded-2xl bg-[#1c1c22] hover:bg-[#22222a] border border-zinc-800/80 flex items-center justify-between cursor-pointer transition-all group shadow-md animate-card-in"
              >
                {/* Left: Yellow Initial Avatar & Info */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#f59e0b] text-zinc-950 font-black text-lg flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    {initial}
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-tight">
                      {cust.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                      {cust.phone || 'No phone'}
                    </p>
                  </div>
                </div>

                {/* Right: Spend & Order Count */}
                <div className="text-right shrink-0">
                  <div className="text-sm sm:text-base font-black text-[#22c55e]">
                    {formatCurrency(cust.totalSpent || 0)}
                  </div>
                  <div className="text-xs text-zinc-400 font-medium mt-0.5">
                    {orderCount} {orderCount === 1 ? 'order' : 'orders'}
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

