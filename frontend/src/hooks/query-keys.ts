import type { DraftLogFilters, MilestoneFilters, ReportFilters } from '../data';

/** Centralized query keys. Invalidate by the root key (e.g. `queryKeys.draftLogs.all`). */
export const queryKeys = {
  clients: {
    all: ['clients'] as const,
    detail: (id: string) => ['clients', id] as const,
  },
  draftLogs: {
    all: ['draft-logs'] as const,
    list: (filters: DraftLogFilters = {}) => ['draft-logs', 'list', filters] as const,
  },
  milestones: {
    all: ['milestones'] as const,
    list: (filters: MilestoneFilters = {}) => ['milestones', 'list', filters] as const,
  },
  reports: {
    all: ['reports'] as const,
    list: (filters: ReportFilters = {}) => ['reports', 'list', filters] as const,
    detail: (id: string) => ['reports', id] as const,
  },
  me: ['users', 'me'] as const,
};
