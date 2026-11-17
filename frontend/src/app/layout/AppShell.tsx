import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { clsx } from 'clsx';
import { Activity, MoreHorizontal } from 'lucide-react';
import { NAV_ITEMS, type NavItem } from '../nav';
import { useDraftLogs } from '../../hooks/useDraftLogs';
import { usePreferences } from '../../hooks/usePreferences';
import { getWeekPeriod, weekLabel } from '../../domain/week';
import { formatHours, sumMinutes } from '../../domain/duration';
import { env } from '../../config/env';
import { Sheet } from '../../components/ui/Sheet';

/** Responsive shell: side rail on desktop (≥1024px), top bar + bottom tab bar on mobile. */
export function AppShell() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      <SideRail />
      <div className="flex min-w-0 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function useWeekSummary() {
  const [prefs] = usePreferences();
  const period = getWeekPeriod(new Date(), prefs.week_starts_on);
  const week = useDraftLogs({
    status: ['pending', 'grouped'],
    from: period.start.toISOString(),
    to: period.end.toISOString(),
  });
  const pending = useDraftLogs({ status: 'pending' });
  return {
    label: weekLabel(),
    hours: week.data ? formatHours(sumMinutes(week.data)) : '—',
    pendingCount: pending.data?.length ?? 0,
  };
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-control bg-primary text-fg-on-primary">
        <Activity className="size-4" aria-hidden />
      </span>
      <span className="text-headline-sm text-fg">SoloFlow</span>
    </div>
  );
}

function WeekBadge() {
  const { label, hours } = useWeekSummary();
  return (
    <span className="rounded-control border border-hairline bg-surface px-2 py-1 font-mono text-mono-sm text-fg-secondary">
      {label} · <span className="text-primary">{hours}</span>
    </span>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-hairline bg-canvas/90 px-4 backdrop-blur-md lg:hidden">
      <Brand />
      <WeekBadge />
    </header>
  );
}

function SideRail() {
  const { pendingCount } = useWeekSummary();
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-hairline bg-surface/40 p-4 lg:flex">
      <div className="flex flex-col gap-3 px-2 pt-2">
        <Brand />
        <WeekBadge />
      </div>
      <nav aria-label="Principal" className="flex flex-1 flex-col gap-1">
        <p className="px-3 pb-1 text-label-ui text-fg-muted">Flujo semanal</p>
        {NAV_ITEMS.filter((i) => i.step).map((item) => (
          <RailLink key={item.to} item={item} badge={item.to === '/triage' ? pendingCount : 0} />
        ))}
        <p className="px-3 pt-4 pb-1 text-label-ui text-fg-muted">Gestión</p>
        {NAV_ITEMS.filter((i) => !i.step).map((item) => (
          <RailLink key={item.to} item={item} />
        ))}
      </nav>
      {env.dataSource === 'mock' && (
        <p className="px-3 text-body-sm text-fg-muted">
          Datos de demo · <span className="font-mono text-mono-sm">mock</span>
        </p>
      )}
    </aside>
  );
}

function RailLink({ item, badge = 0 }: { item: NavItem; badge?: number }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        clsx(
          'flex h-10 items-center gap-3 rounded-control px-3 text-body-md transition-colors',
          isActive ? 'bg-surface-raised text-fg' : 'text-fg-secondary hover:bg-surface hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={clsx('size-4', isActive && 'text-primary')} aria-hidden />
          <span className="flex-1">{item.label}</span>
          {item.step && !badge && <span className="font-mono text-mono-sm text-fg-muted">{item.step}</span>}
          {badge > 0 && <Badge count={badge} />}
        </>
      )}
    </NavLink>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="min-w-5 rounded-full bg-primary/15 px-1.5 text-center font-mono text-mono-sm leading-5 text-primary">
      {count}
      <span className="sr-only"> pendientes</span>
    </span>
  );
}

function BottomNav() {
  const { pendingCount } = useWeekSummary();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const secondary = NAV_ITEMS.filter((i) => !i.primary);
  const secondaryActive = secondary.some((i) => location.pathname.startsWith(i.to));

  return (
    <>
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-hairline bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {NAV_ITEMS.filter((i) => i.primary).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx('relative flex h-16 flex-col items-center justify-center gap-1 text-label-ui', isActive ? 'text-primary' : 'text-fg-secondary')
              }
            >
              <Icon className="size-5" aria-hidden />
              {item.label}
              {item.to === '/triage' && pendingCount > 0 && (
                <span className="absolute top-2 left-1/2 ml-2 min-w-4 rounded-full bg-primary px-1 font-mono text-[10px] leading-4 text-fg-on-primary">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={clsx('flex h-16 flex-col items-center justify-center gap-1 text-label-ui', secondaryActive ? 'text-primary' : 'text-fg-secondary')}
        >
          <MoreHorizontal className="size-5" aria-hidden />
          Más
        </button>
      </nav>
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Más">
        <div className="flex flex-col gap-1">
          {secondary.map((item) => (
            <div key={item.to} onClick={() => setMoreOpen(false)}>
              <RailLink item={item} />
            </div>
          ))}
        </div>
      </Sheet>
    </>
  );
}
