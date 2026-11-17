import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repos } from '../data';
import type { UpdateUserInput } from '../types/user';
import { queryKeys } from './query-keys';

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: () => repos.users.getMe(), staleTime: Infinity });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => repos.users.updateMe(input),
    onSuccess: (user) => qc.setQueryData(queryKeys.me, user),
  });
}

export function useResetDemoData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!repos.resetDemoData) throw new Error('Solo disponible con datos de demo');
      await repos.resetDemoData();
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}
