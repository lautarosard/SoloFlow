import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repos } from '../data';
import type { CreateClientInput, UpdateClientInput } from '../types/client';
import { queryKeys } from './query-keys';

export function useClients() {
  return useQuery({ queryKey: queryKeys.clients.all, queryFn: () => repos.clients.list() });
}

/** Lookup helper: id → client, from the cached list. */
export function useClientMap() {
  const query = useClients();
  const map = new Map((query.data ?? []).map((c) => [c.id, c]));
  return { ...query, map };
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClientInput) => repos.clients.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.clients.all }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClientInput }) => repos.clients.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.clients.all }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repos.clients.remove(id),
    onSuccess: () => {
      // Cascade: logs and milestones of the client are gone too.
      void qc.invalidateQueries({ queryKey: queryKeys.clients.all });
      void qc.invalidateQueries({ queryKey: queryKeys.draftLogs.all });
      void qc.invalidateQueries({ queryKey: queryKeys.milestones.all });
    },
  });
}
