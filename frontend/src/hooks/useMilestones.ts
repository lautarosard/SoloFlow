import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repos, type MilestoneFilters } from '../data';
import type { CreateMilestoneInput, UpdateMilestoneInput } from '../types/milestone';
import { queryKeys } from './query-keys';

export function useMilestones(filters: MilestoneFilters = {}) {
  return useQuery({
    queryKey: queryKeys.milestones.list(filters),
    queryFn: () => repos.milestones.list(filters),
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMilestoneInput) => repos.milestones.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.milestones.all }),
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMilestoneInput }) => repos.milestones.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.milestones.all }),
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repos.milestones.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.milestones.all });
      void qc.invalidateQueries({ queryKey: queryKeys.draftLogs.all });
    },
  });
}
