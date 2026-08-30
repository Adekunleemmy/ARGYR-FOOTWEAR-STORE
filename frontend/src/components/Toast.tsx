import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast container floating at the bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 md:px-0">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 flex items-start gap-3 bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 shadow-md text-sm animate-in slide-in-from-right duration-250`}
          >
            {t.type === 'success' && <Check className="text-brand-clay dark:text-brand-gold shrink-0 mt-0.5" size={16} />}
            {t.type === 'error' && <AlertCircle className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" size={16} />}
            
            <div className="flex-1 text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
              {t.message}
            </div>
            
            <button
              onClick={() => removeToast(t.id)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors shrink-0"
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
