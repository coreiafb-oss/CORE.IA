import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw } from 'lucide-react';

// ─── Toast Component ──────────────────────────────────────────────────────────
interface ToastProps {
  message: string;
  onUndo?: () => void;
  onDismiss: () => void;
  duration?: number;
}

const Toast = ({ message, onUndo, onDismiss, duration = 4500 }: ToastProps) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const step = 100 / (duration / 50);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p - step <= 0) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return p - step;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] min-w-[320px] max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#1c1c1e] shadow-2xl"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <span className="text-sm text-gray-200 font-medium">{message}</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          {onUndo && (
            <button
              onClick={() => { onUndo(); onDismiss(); }}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Desfazer
            </button>
          )}
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="h-[3px] bg-[#333]">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

// ─── useToast Hook ────────────────────────────────────────────────────────────
interface ToastState {
  id: number;
  message: string;
  onUndo?: () => void;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, onUndo?: () => void) => {
    setToast({ id: Date.now(), message, onUndo });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  const ToastContainer = useCallback(
    () => (
      <AnimatePresence mode="wait">
        {toast && (
          <React.Fragment key={toast.id}>
            <Toast
              message={toast.message}
              onUndo={toast.onUndo}
              onDismiss={hideToast}
            />
          </React.Fragment>
        )}
      </AnimatePresence>
    ),
    [toast, hideToast]
  );

  return { showToast, hideToast, ToastContainer };
};

export default Toast;
