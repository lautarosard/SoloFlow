import type { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { formatDuration, formatHours } from '../../domain/duration';
import { formatMoney } from '../../domain/money';

/** Level-1 surface: micro-cards and list modules. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-card border border-hairline bg-surface', className)} {...rest} />;
}

type Tone = 'neutral' | 'primary' | 'success' | 'info' | 'danger';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-raised text-fg-secondary border-hairline',
  primary: 'bg-primary/12 text-primary border-primary/25',
  success: 'bg-success/12 text-success border-success/25',
  info: 'bg-info/12 text-info border-info/25',
  danger: 'bg-danger/12 text-danger border-danger/25',
};

/** Binary/status label — the only place pill radius is used. */
export function StatusPill({ tone = 'neutral', icon, children }: { tone?: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-label-ui whitespace-nowrap',
        toneClasses[tone],
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function ProgressBar({ value, tone = 'primary', label }: { value: number; tone?: Tone; label: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const bar = { neutral: 'bg-fg-muted', primary: 'bg-primary', success: 'bg-success', info: 'bg-info', danger: 'bg-danger' }[tone];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised"
    >
      <div className={clsx('h-full rounded-full transition-[width] duration-300', bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatTile({ label, value, hint, icon, tone }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: 'primary' | 'success' | 'info' }) {
  const toneText = tone ? { primary: 'text-primary', success: 'text-success', info: 'text-info' }[tone] : 'text-fg';
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="flex items-center gap-1.5 text-label-ui text-fg-secondary">
        {icon}
        {label}
      </span>
      <span className={clsx('font-mono text-mono-lg tabular-nums', toneText)}>{value}</span>
      {hint && <span className="text-body-sm text-fg-muted">{hint}</span>}
    </Card>
  );
}

/** Mono, tabular numbers so values don't shift. */
export function Money({ amount, className }: { amount: number; className?: string }) {
  return <span className={clsx('font-mono tabular-nums', className)}>{formatMoney(amount)}</span>;
}

export function Duration({ minutes, format = 'duration', className }: { minutes: number; format?: 'duration' | 'hours'; className?: string }) {
  return (
    <span className={clsx('font-mono tabular-nums', className)}>
      {format === 'hours' ? formatHours(minutes) : formatDuration(minutes)}
    </span>
  );
}

/** Small mono code tag, e.g. client code or log id. */
export function CodeTag({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-[4px] border border-hairline bg-surface-raised px-1.5 py-0.5 font-mono text-mono-sm text-fg-secondary"
      style={color ? { color, borderColor: `color-mix(in srgb, ${color} 35%, transparent)` } : undefined}
    >
      {children}
    </span>
  );
}
