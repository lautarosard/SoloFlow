export const DURATION_STEP_MINUTES = 15;
export const DURATION_MIN_MINUTES = 15;
export const DURATION_MAX_MINUTES = 8 * 60;

export const DURATION_PRESETS = [
  { minutes: 15, label: '15 min', hint: 'Micro-sync o review' },
  { minutes: 30, label: '30 min', hint: 'Bugfix o standup' },
  { minutes: 60, label: '1 hora', hint: 'Feature o refactor' },
  { minutes: 120, label: '2 horas', hint: 'Deep work' },
] as const;

/** 90 → "1h 30m", 45 → "45m", 120 → "2h 00m". */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** 90 → "1.5h", 1710 → "28.5h". */
export function formatHours(minutes: number): string {
  const hours = minutesToHours(minutes);
  return `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1)}h`;
}

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

export function clampDuration(minutes: number): number {
  return Math.min(DURATION_MAX_MINUTES, Math.max(DURATION_MIN_MINUTES, minutes));
}

export function sumMinutes(items: ReadonlyArray<{ duration_minutes: number }>): number {
  return items.reduce((total, item) => total + item.duration_minutes, 0);
}
