import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type Size = 'md' | 'sm';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-fg-on-primary font-semibold hover:bg-primary-pressed active:bg-primary-pressed',
  secondary:
    'bg-surface-raised text-fg border border-hairline-strong hover:bg-surface-pressed active:bg-surface-pressed',
  destructive: 'bg-danger/12 text-danger border border-danger/25 hover:bg-danger/20',
  ghost: 'text-fg-secondary hover:text-fg hover:bg-surface-raised',
};

const sizes: Record<Size, string> = {
  md: 'h-11 px-4 text-body-md gap-2',
  sm: 'h-9 px-3 text-body-sm gap-1.5',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, icon, fullWidth, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-control font-medium whitespace-nowrap',
        'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name — required since there's no visible text. */
  label: string;
  variant?: Variant;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-control transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
