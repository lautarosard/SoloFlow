import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { NAV_ITEMS } from '../nav';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Shows the weekly flow stepper with this step active. */
  step?: number;
}

export function PageHeader({ title, description, actions, step }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:mb-8">
      {step && <FlowStepper current={step} />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-xl-mobile text-fg lg:text-headline-xl">{title}</h1>
          {description && <p className="text-body-md text-fg-secondary">{description}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** 1 Captura › 2 Triaje › 3 Redactor › 4 Despacho */
function FlowStepper({ current }: { current: number }) {
  const steps = [
    ...NAV_ITEMS.filter((i) => i.step && i.step < 4).map((i) => ({ step: i.step!, label: i.label, to: i.to })),
    { step: 4, label: 'Despacho', to: '/reports' },
  ];
  return (
    <nav aria-label="Flujo semanal">
      <ol className="flex items-center gap-1 overflow-x-auto text-label-ui">
        {steps.map((s, index) => {
          const done = s.step < current;
          const active = s.step === current;
          return (
            <li key={s.step} className="flex shrink-0 items-center gap-1">
              {index > 0 && <span className="text-fg-muted" aria-hidden>›</span>}
              <Link
                to={s.to}
                aria-current={active ? 'step' : undefined}
                className={clsx(
                  'flex items-center gap-1.5 rounded-control px-2 py-1 transition-colors',
                  active ? 'bg-primary/12 text-primary' : done ? 'text-success hover:text-fg' : 'text-fg-muted hover:text-fg',
                )}
              >
                <span
                  className={clsx(
                    'flex size-4 items-center justify-center rounded-full border font-mono text-[10px]',
                    active ? 'border-primary' : done ? 'border-success' : 'border-hairline-strong',
                  )}
                >
                  {done ? <Check className="size-2.5" aria-hidden /> : s.step}
                </span>
                {s.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
