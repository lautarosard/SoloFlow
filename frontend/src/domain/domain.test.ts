import { describe, expect, it } from 'vitest';
import { clampDuration, formatDuration, formatHours, sumMinutes } from './duration';
import { amountFor, formatMoney, formatRate } from './money';
import { dayLabel, groupByDay, periodLabel, relativeDayLabel } from './week';
import { milestoneProgress } from './milestone-stats';
import { clientColorIndex, clientInitials } from './client-color';
import type { DraftLog } from '../types/draft-log';
import type { Milestone } from '../types/milestone';

describe('duration', () => {
  it('formats minutes', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(120)).toBe('2h 00m');
    expect(formatHours(1710)).toBe('28.5h');
    expect(formatHours(720)).toBe('12h');
  });

  it('clamps to 15m..8h', () => {
    expect(clampDuration(0)).toBe(15);
    expect(clampDuration(1000)).toBe(480);
  });

  it('sums durations', () => {
    expect(sumMinutes([{ duration_minutes: 30 }, { duration_minutes: 45 }])).toBe(75);
  });
});

describe('money', () => {
  it('formats USD and rates', () => {
    expect(formatMoney(2422.5)).toBe('$2,422.50');
    expect(formatRate(85)).toBe('$85/h');
  });

  it('computes billable amount', () => {
    expect(amountFor(90, 90)).toBe(135);
    expect(amountFor(1710, 85)).toBe(2422.5);
  });
});

describe('week', () => {
  it('labels days in Spanish', () => {
    expect(dayLabel('2025-03-14T10:00:00')).toBe('Viernes • 14 Mar');
    expect(relativeDayLabel('2025-03-14T10:00:00', new Date('2025-03-14T18:00:00'))).toBe('Hoy');
    expect(relativeDayLabel('2025-03-13T10:00:00', new Date('2025-03-14T18:00:00'))).toBe('Ayer');
  });

  it('labels periods', () => {
    expect(periodLabel('2025-03-10', '2025-03-16')).toBe('10 - 16 Mar, 2025');
    expect(periodLabel('2025-02-24', '2025-03-02')).toBe('24 Feb - 2 Mar, 2025');
  });

  it('groups by day, newest first', () => {
    const groups = groupByDay([
      { id: 'a', logged_at: '2025-03-12T09:00:00' },
      { id: 'b', logged_at: '2025-03-14T09:00:00' },
      { id: 'c', logged_at: '2025-03-14T15:00:00' },
    ]);
    expect(groups.map((g) => g.day)).toEqual(['2025-03-14', '2025-03-12']);
    expect(groups[0]?.items.map((i) => i.id)).toEqual(['c', 'b']);
  });
});

describe('milestone progress', () => {
  const milestone = { id: 'ms-1', estimated_hours: 2 } as Milestone;
  const log = (id: string, minutes: number, status: DraftLog['status'], milestone_id: string | null = 'ms-1') =>
    ({ id, duration_minutes: minutes, status, milestone_id }) as DraftLog;

  it('only counts grouped logs of the milestone', () => {
    const p = milestoneProgress(milestone, [
      log('a', 60, 'grouped'),
      log('b', 90, 'grouped'),
      log('c', 60, 'discarded'),
      log('d', 60, 'grouped', 'ms-2'),
    ]);
    expect(p.consolidatedMinutes).toBe(150);
    expect(p.taskCount).toBe(2);
    expect(p.ratio).toBe(1.25);
    expect(p.overBudget).toBe(true);
  });
});

describe('client color', () => {
  it('is deterministic and within the palette', () => {
    expect(clientColorIndex('cli-fintech-01')).toBe(clientColorIndex('cli-fintech-01'));
    expect(clientColorIndex('anything')).toBeGreaterThanOrEqual(1);
    expect(clientColorIndex('anything')).toBeLessThanOrEqual(6);
  });

  it('derives initials when no code', () => {
    expect(clientInitials('Fintech Nova Inc.')).toBe('FN');
    expect(clientInitials('HealthPulse', 'HP')).toBe('HP');
  });
});
