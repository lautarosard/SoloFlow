import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button, IconButton } from './Button';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Bottom sheet on mobile, centered modal on desktop (level-3 overlay). */
export function Sheet({ open, onClose, title, description, children, footer }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>('input, textarea, select, button:not([data-close])');
    (first ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel) trapFocus(e, panel);
    };
    document.addEventListener('keydown', onKeyDown);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[90dvh] w-full flex-col rounded-t-xl border border-hairline-focus bg-surface-raised/95 pb-[env(safe-area-inset-bottom)] shadow-raised backdrop-blur-md lg:max-w-lg lg:rounded-xl lg:pb-0"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-hairline-focus lg:hidden" aria-hidden />
        <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-headline-sm text-fg">
              {title}
            </h2>
            {description && <p className="text-body-md text-fg-secondary">{description}</p>}
          </div>
          <IconButton label="Cerrar" data-close onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </header>
        <div className="overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-hairline px-5 py-3">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

function trapFocus(e: KeyboardEvent, container: HTMLElement) {
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** For irreversible actions only — reversible ones use an undo toast instead. */
export function ConfirmDialog({ open, title, description, confirmLabel, destructive, loading, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={destructive ? 'destructive' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-body-md text-fg-secondary">{description}</p>
    </Sheet>
  );
}
