import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Top-Center Floating Toast Chip Container */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4 w-auto max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-center gap-2 py-1.5 px-3.5 rounded-full shadow-2xl backdrop-blur-xl border transition-all duration-300 select-none animate-modal-slide-down cursor-pointer hover:scale-105 active:scale-95 ${
              toast.type === 'success'
                ? 'bg-zinc-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-zinc-950/90 text-rose-300 border-rose-500/40 shadow-rose-950/50'
                : 'bg-zinc-950/90 text-amber-300 border-amber-400/40 shadow-black/60'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />}
            {toast.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 stroke-[2.5]" />}
            {toast.type === 'info' && <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 stroke-[2.5]" />}
            <span className="text-[11.5px] font-bold text-white/95 tracking-tight leading-none whitespace-nowrap">
              {toast.message}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="ml-0.5 text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded-full"
              title="Dismiss"
            >
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
