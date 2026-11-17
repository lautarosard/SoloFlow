import { clsx } from 'clsx';
import type { KeyboardEvent, ReactNode } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: ReadonlyArray<SegmentOption<T>>;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Single-choice radiogroup with arrow-key navigation. */
export function SegmentedControl<T extends string>({ value, options, onChange, label, className }: SegmentedControlProps<T>) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const index = options.findIndex((o) => o.value === value);
    const next = options[(index + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length];
    if (next) onChange(next.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={clsx('inline-flex rounded-control border border-hairline bg-surface p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={clsx(
              'flex-1 rounded-[4px] px-3 py-1.5 text-body-sm whitespace-nowrap transition-colors',
              active ? 'bg-surface-raised text-fg shadow-raised' : 'text-fg-secondary hover:text-fg',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
