import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** Use the mono font (codes, durations). */
  mono?: boolean;
  icon?: ReactNode;
}

/** Toggleable chip. Inactive: surface + hairline; active: amber tint + amber border. */
export function Chip({ selected = false, mono, icon, className, children, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={clsx(
        'inline-flex h-9 items-center gap-1.5 rounded-control border px-3 transition-colors',
        mono ? 'font-mono text-mono-md' : 'text-body-sm',
        selected
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-hairline bg-surface text-fg-secondary hover:border-hairline-focus hover:text-fg',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
