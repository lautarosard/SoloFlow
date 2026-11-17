import axios from 'axios';
import { http } from '../../services/http';
import type { ApiSuccess } from '../../types/api';
import type { Client } from '../../types/client';
import type { DraftLog } from '../../types/draft-log';
import type { Milestone } from '../../types/milestone';
import type { Report } from '../../types/report';
import type { User } from '../../types/user';
import type {
  ComposeResult,
  DraftLogFilters,
  MilestoneFilters,
  ReportFilters,
  Repositories,
} from '../repositories';
import { RepositoryError } from '../repositories';

/**
 * REST implementation. `clients` and `draft-logs` exist in the backend today;
 * the rest follow the proposed contract in frontend/docs/api-contract.md.
 */

async function call<T>(request: Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  try {
    const response = await request;
    return response.data.data;
  } catch (err) {
    throw toRepositoryError(err);
  }
}

function toRepositoryError(err: unknown): RepositoryError {
  if (axios.isAxiosError<{ data?: { message?: string } }>(err)) {
    const status = err.response?.status ?? 0;
    if (status === 404 && !err.response?.data?.data?.message) {
      return new RepositoryError('Esta función todavía no está disponible en el backend', 501);
    }
    if (status === 0) return new RepositoryError('No se pudo conectar con el servidor', 0);
    return new RepositoryError(err.response?.data?.data?.message ?? 'Error inesperado del servidor', status);
  }
  return new RepositoryError(err instanceof Error ? err.message : 'Error inesperado', 500);
}

/** Serializes array filters as comma-separated query params. */
function params(filters: object = {}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : String(v)]),
  );
}

function asArray<T>(value: T | T[] | undefined): T[] | undefined {
  return value === undefined ? undefined : Array.isArray(value) ? value : [value];
}

export const httpRepositories: Repositories = {
  clients: {
    list: () => call(http.get<ApiSuccess<Client[]>>('/clients')),
    get: (id) => call(http.get<ApiSuccess<Client>>(`/clients/${id}`)),
    create: (input) => call(http.post<ApiSuccess<Client>>('/clients', input)),
    update: (id, input) => call(http.patch<ApiSuccess<Client>>(`/clients/${id}`, input)),
    remove: async (id) => {
      await call(http.delete(`/clients/${id}`));
    },
  },

  draftLogs: {
    async list(filters: DraftLogFilters = {}) {
      // The backend only filters by clientId today; the rest is applied here until it supports them.
      const logs = await call(
        http.get<ApiSuccess<DraftLog[]>>('/draft-logs', { params: params({ clientId: filters.clientId }) }),
      );
      const statuses = asArray(filters.status);
      return logs
        .filter(
          (log) =>
            (!statuses || statuses.includes(log.status)) &&
            (!filters.milestoneId || log.milestone_id === filters.milestoneId) &&
            (!filters.from || log.logged_at >= filters.from) &&
            (!filters.to || log.logged_at <= filters.to),
        )
        .sort((a, b) => b.logged_at.localeCompare(a.logged_at));
    },
    get: (id) => call(http.get<ApiSuccess<DraftLog>>(`/draft-logs/${id}`)),
    create: (input) => call(http.post<ApiSuccess<DraftLog>>('/draft-logs', input)),
    update: (id, input) => call(http.patch<ApiSuccess<DraftLog>>(`/draft-logs/${id}`, input)),
    // No bulk endpoint yet: parallel PATCHes.
    updateMany: (ids, input) =>
      Promise.all(ids.map((id) => call(http.patch<ApiSuccess<DraftLog>>(`/draft-logs/${id}`, input)))),
    remove: async (id) => {
      await call(http.delete(`/draft-logs/${id}`));
    },
  },

  milestones: {
    list: (filters: MilestoneFilters = {}) =>
      call(http.get<ApiSuccess<Milestone[]>>('/milestones', { params: params(filters) })),
    get: (id) => call(http.get<ApiSuccess<Milestone>>(`/milestones/${id}`)),
    create: (input) => call(http.post<ApiSuccess<Milestone>>('/milestones', input)),
    update: (id, input) => call(http.patch<ApiSuccess<Milestone>>(`/milestones/${id}`, input)),
    remove: async (id) => {
      await call(http.delete(`/milestones/${id}`));
    },
  },

  reports: {
    list: (filters: ReportFilters = {}) =>
      call(http.get<ApiSuccess<Report[]>>('/reports', { params: params(filters) })),
    get: (id) => call(http.get<ApiSuccess<Report>>(`/reports/${id}`)),
    create: (input) => call(http.post<ApiSuccess<Report>>('/reports', input)),
    update: (id, input) => call(http.patch<ApiSuccess<Report>>(`/reports/${id}`, input)),
    enablePublicLink: (id, days) => call(http.post<ApiSuccess<Report>>(`/reports/${id}/public-link`, { days })),
    remove: async (id) => {
      await call(http.delete(`/reports/${id}`));
    },
  },

  users: {
    getMe: () => call(http.get<ApiSuccess<User>>('/users/me')),
    updateMe: (input) => call(http.patch<ApiSuccess<User>>('/users/me', input)),
  },

  composer: {
    generate: ({ client, milestone, logs, tone }) =>
      call(
        http.post<ApiSuccess<ComposeResult>>('/composer/generate', {
          client_id: client.id,
          milestone_id: milestone.id,
          log_ids: logs.map((l) => l.id),
          tone,
        }),
      ),
  },
};
