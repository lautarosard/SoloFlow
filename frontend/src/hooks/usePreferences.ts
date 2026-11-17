import { useCallback, useSyncExternalStore } from 'react';
import type { UserPreferences } from '../types/user';

const STORAGE_KEY = 'soloflow:preferences';

const DEFAULTS: UserPreferences = {
  default_duration_minutes: 60,
  week_starts_on: 1,
  last_client_id: null,
};

const listeners = new Set<() => void>();
let cache: UserPreferences = load();

function load(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<UserPreferences>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** UI-only preferences, stored per browser (not part of the backend data model). */
export function usePreferences() {
  const preferences = useSyncExternalStore(subscribe, () => cache);

  const update = useCallback((patch: Partial<UserPreferences>) => {
    cache = { ...cache, ...patch };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore: preferences just won't persist.
    }
    listeners.forEach((l) => l());
  }, []);

  return [preferences, update] as const;
}
