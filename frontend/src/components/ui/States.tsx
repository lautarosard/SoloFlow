import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-10 text-center',
        className,
      )}
    >
      {icon && <div className="text-fg-muted [&_svg]:size-8">{icon}</div>}
      <div className="flex flex-col gap-1">
        <p className="text-headline-sm text-fg">{title}</p>
        {description && <p className="max-w-sm text-body-md text-fg-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-card border border-danger/25 bg-danger/8 p-4">
      <p className="flex items-center gap-2 text-body-md text-danger">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        {message}
      </p>
      {onRetry && (
        <Button size="sm" variant="secondary" icon={<RotateCw className="size-3.5" />} onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx('animate-pulse rounded-card bg-surface-raised/60', className)} />;
}

/** N skeleton rows for list loading states. */
export function SkeletonList({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Cargando" className={clsx('flex flex-col gap-2', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-[72px]" />
      ))}
    </div>
  );
}
