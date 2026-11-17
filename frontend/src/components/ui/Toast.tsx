import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export interface ToastOptions {
  message: string;
  tone?: 'success' | 'error' | 'neutral';
  /** e.g. { label: 'Deshacer', onClick: undo } */
  action?: { label: string; onClick: () => void };
  durationMs?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      // Keep at most 3 on screen.
      setToasts((all) => [...all.slice(-2), { ...options, id }]);
      setTimeout(() => dismiss(id), options.durationMs ?? (options.action ? 6000 : 3500));
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-card border border-hairline-focus bg-surface-raised/95 px-4 py-3 shadow-raised backdrop-blur-md"
          >
            {toast.tone === 'error' ? (
              <AlertTriangle className="size-4 shrink-0 text-danger" aria-hidden />
            ) : toast.tone === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
            ) : null}
            <p className="flex-1 text-body-md text-fg">{toast.message}</p>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id);
                }}
                className={clsx('text-body-md font-semibold text-primary hover:text-primary-pressed')}
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" aria-label="Cerrar" onClick={() => dismiss(toast.id)} className="text-fg-muted hover:text-fg">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used inside <ToastProvider>');
  return show;
}
