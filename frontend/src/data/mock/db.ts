import type { ZodType, ZodTypeDef } from 'zod';
import { env } from '../../config/env';
import { firstIssue } from '../../domain/schemas';
import { RepositoryError } from '../repositories';
import { createSeed, type MockState } from './seed';

const STORAGE_KEY = 'soloflow:mock:v1';

/**
 * In-browser mock database: a plain object persisted to localStorage.
 * Every read returns a copy so callers can't mutate the store by accident.
 */
class MockDb {
  private state: MockState;

  constructor() {
    this.state = this.load() ?? createSeed();
    this.persist();
  }

  read<T>(select: (state: MockState) => T): T {
    return structuredClone(select(this.state));
  }

  write<T>(mutate: (state: MockState) => T): T {
    const result = mutate(this.state);
    this.persist();
    return structuredClone(result);
  }

  reset(): void {
    this.state = createSeed();
    this.persist();
  }

  private load(): MockState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as MockState) : null;
    } catch {
      return null;
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage unavailable (private mode, quota): keep working in memory.
    }
  }
}

export const db = new MockDb();

/** Simulated network latency so loading states are visible in mock mode. */
export function delay(): Promise<void> {
  const max = env.mockLatencyMs;
  if (max === 0) return Promise.resolve();
  const ms = max * 0.4 + Math.random() * max * 0.6;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function notFound(entity: string, id: string): never {
  throw new RepositoryError(`${entity} con ID '${id}' no encontrado`, 404);
}

/** Validates like the backend would and throws a 400 RepositoryError on failure. */
export function validate<Output, Input>(schema: ZodType<Output, ZodTypeDef, Input>, input: unknown): Output {
  const result = schema.safeParse(input);
  if (!result.success) throw new RepositoryError(firstIssue(result.error), 400);
  return result.data;
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function matches<T>(value: T, filter: T | T[] | undefined): boolean {
  if (filter === undefined) return true;
  return Array.isArray(filter) ? filter.includes(value) : value === filter;
}
