import {
  endOfWeek,
  format,
  getISOWeek,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';

export type WeekStart = 0 | 1;

export interface Period {
  start: Date;
  end: Date;
}

export function getWeekPeriod(date: Date = new Date(), weekStartsOn: WeekStart = 1): Period {
  return {
    start: startOfWeek(date, { weekStartsOn }),
    end: endOfWeek(date, { weekStartsOn }),
  };
}

export function isInPeriod(iso: string, period: Period): boolean {
  return isWithinInterval(parseISO(iso), period);
}

/** "Sem 47" */
export function weekLabel(date: Date = new Date()): string {
  return `Sem ${getISOWeek(date)}`;
}

/** "Jueves • 14 Mar" */
export function dayLabel(iso: string): string {
  const label = format(parseISO(iso), "EEEE '•' d MMM", { locale: es });
  return capitalizeMonths(capitalize(label));
}

/** "Hoy", "Ayer" or dayLabel. */
export function relativeDayLabel(iso: string, now: Date = new Date()): string {
  const date = parseISO(iso);
  if (isSameDay(date, now)) return 'Hoy';
  if (isSameDay(date, subDays(now, 1))) return 'Ayer';
  return dayLabel(iso);
}

/** "10 - 16 Mar, 2025" (or "28 Feb - 6 Mar, 2025" across months). */
export function periodLabel(startIso: string, endIso: string): string {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  const sameMonth = start.getMonth() === end.getMonth();
  const startText = sameMonth ? format(start, 'd') : format(start, 'd MMM', { locale: es });
  return capitalizeMonths(`${startText} - ${format(end, 'd MMM, yyyy', { locale: es })}`);
}

/** YYYY-MM-DD in local time. */
export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Groups items by local calendar day, newest day first, preserving item order within a day. */
export function groupByDay<T extends { logged_at: string }>(items: readonly T[]): Array<{ day: string; items: T[] }> {
  const groups = new Map<string, T[]>();
  const sorted = [...items].sort((a, b) => b.logged_at.localeCompare(a.logged_at));
  for (const item of sorted) {
    const key = toIsoDate(startOfDay(parseISO(item.logged_at)));
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()].map(([day, dayItems]) => ({ day, items: dayItems }));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "14 mar" → "14 Mar" (date-fns `es` months are lowercase). */
function capitalizeMonths(text: string): string {
  return text.replace(/(\d+ )(\p{L})/gu, (_, digits: string, letter: string) => digits + letter.toUpperCase());
}
