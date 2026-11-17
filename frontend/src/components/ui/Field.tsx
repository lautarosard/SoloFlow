import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { clsx } from 'clsx';

const control =
  'w-full rounded-control border bg-field text-body-md text-fg placeholder:text-fg-muted ' +
  'transition-colors focus:border-primary focus:outline-none disabled:opacity-50 aria-invalid:border-danger';

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  /** Receives the generated id and aria props to spread on the control. */
  children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode;
}

/** Label + control + hint/error with accessible wiring. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-label-ui text-fg-secondary">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-body-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-body-sm text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={clsx(control, 'h-[42px] border-hairline-strong px-3', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={clsx(control, 'min-h-24 resize-y border-hairline-strong px-3 py-2.5', className)}
        {...rest}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...rest },
  ref,
) {
  return <select ref={ref} className={clsx(control, 'h-[42px] border-hairline-strong px-3', className)} {...rest} />;
});
