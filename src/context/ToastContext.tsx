import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Toast = { id: number; message: string; color: 'success' | 'danger' };

const ToastContext = createContext<{
  showToast: (message: string, color?: 'success' | 'danger') => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, color: 'success' | 'danger' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, color }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, color === 'success' ? 1800 : 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-${toast.color}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider');
  return context;
}
