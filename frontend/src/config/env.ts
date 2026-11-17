export type DataSource = 'mock' | 'api';

function readDataSource(): DataSource {
  const value = import.meta.env.VITE_DATA_SOURCE;
  return value === 'api' ? 'api' : 'mock';
}

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export const env = {
  /** `mock` (default) uses the in-browser mock DB; `api` uses the REST backend. */
  dataSource: readDataSource(),
  /** Max simulated latency for mock calls, in ms. */
  mockLatencyMs: readNumber(import.meta.env.VITE_MOCK_LATENCY, 350),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
} as const;
