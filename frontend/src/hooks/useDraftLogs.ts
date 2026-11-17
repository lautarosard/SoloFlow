import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { repos, type DraftLogFilters } from '../data';
import type { CreateDraftLogInput, UpdateDraftLogInput } from '../types/draft-log';
import { queryKeys } from './query-keys';

export function useDraftLogs(filters: DraftLogFilters = {}) {
  return useQuery({
    queryKey: queryKeys.draftLogs.list(filters),
    queryFn: () => repos.draftLogs.list(filters),
  });
}

/** Log changes affect milestone hours too. */
function invalidateLogs(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: queryKeys.draftLogs.all });
  void qc.invalidateQueries({ queryKey: queryKeys.milestones.all });
}

export function useCreateDraftLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDraftLogInput) => repos.draftLogs.create(input),
    onSettled: () => invalidateLogs(qc),
  });
}

export function useUpdateDraftLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDraftLogInput }) => repos.draftLogs.update(id, input),
    onSettled: () => invalidateLogs(qc),
  });
}

export function useUpdateDraftLogs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, input }: { ids: string[]; input: UpdateDraftLogInput }) =>
      repos.draftLogs.updateMany(ids, input),
    onSettled: () => invalidateLogs(qc),
  });
}

export function useDeleteDraftLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repos.draftLogs.remove(id),
    onSettled: () => invalidateLogs(qc),
  });
}
