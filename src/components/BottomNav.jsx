import React from 'react';
import { Home, Boxes, Plus, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const BottomNav = ({ activeTab, setActiveTab }) => {
  const { itemCount } = useCart();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'checkout', label: 'SELL', isFab: true },
    { id: 'dashboard', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 no-print pointer-events-none app-safe-bottom">
      <div className="pointer-events-auto bg-[#141417]/95 backdrop-blur-xl border border-zinc-800/90 rounded-full px-3 py-1.5 shadow-2xl flex items-center justify-between gap-1 sm:gap-4 max-w-md w-full relative animate-bottombar-slide">
        {navItems.map((item) => {
          if (item.isFab) {
            const isSellActive = activeTab === 'checkout';
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab('checkout')}
                className="flex flex-col items-center -mt-6 group focus:outline-none relative cursor-pointer px-2"
                title="New Sale (POS Checkout)"
              >
                {itemCount > 0 && (
                  <span className="absolute -top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center ring-2 ring-zinc-950 z-20 animate-bounce">
                    {itemCount}
                  </span>
                )}

                <div
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-zinc-950 flex items-center justify-center font-black ring-4 ring-zinc-950 transition-all duration-300 ${
                    isSellActive
                      ? 'scale-110 shadow-xl shadow-amber-400/50 ring-amber-400/30 -translate-y-1'
                      : 'shadow-lg shadow-amber-400/30 group-hover:scale-105 group-active:scale-95'
                  }`}
                >
                  <Plus className={`w-7 h-7 stroke-[2.5] transition-transform duration-300 ${isSellActive ? 'rotate-90' : ''}`} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider mt-1 transition-colors duration-200 ${
                  isSellActive ? 'text-amber-300 font-extrabold' : 'text-amber-400/80'
                }`}>
                  SELL
                </span>
              </button>
            );
          }

          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-300 relative cursor-pointer select-none group ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {/* Active Tab Ambient Pill Glow */}
              {isActive && (
                <span className="absolute inset-0 bg-white/5 rounded-2xl -z-10 animate-fade-in transition-all duration-300" />
              )}

              {/* Icon with smooth translation/lift */}
              <div className={`transition-transform duration-300 ${isActive ? '-translate-y-0.5 scale-110' : 'group-hover:scale-105'}`}>
                <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-amber-400' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
              </div>

              {/* Label */}
              <span className={`text-[10px] mt-0.5 transition-all duration-200 ${isActive ? 'font-black text-white' : 'font-medium text-zinc-400'}`}>
                {item.label}
              </span>

              {/* Sliding Active Golden Dot Indicator */}
              <span
                className={`h-1 rounded-full bg-amber-400 absolute -bottom-0.5 transition-all duration-300 ${
                  isActive ? 'w-4 opacity-100 shadow-sm shadow-amber-400/80' : 'w-0 opacity-0'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

