import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repos, type ComposeInput, type ReportFilters } from '../data';
import type { CreateReportInput, UpdateReportInput } from '../types/report';
import { queryKeys } from './query-keys';

export function useReports(filters: ReportFilters = {}) {
  return useQuery({ queryKey: queryKeys.reports.list(filters), queryFn: () => repos.reports.list(filters) });
}

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reports.detail(id ?? ''),
    queryFn: () => repos.reports.get(id!),
    enabled: Boolean(id),
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportInput) => repos.reports.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.reports.all });
      void qc.invalidateQueries({ queryKey: queryKeys.milestones.all });
    },
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReportInput }) => repos.reports.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });
}

export function useEnablePublicLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) => repos.reports.enablePublicLink(id, days),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reports.all }),
  });
}

export function useCompose() {
  return useMutation({ mutationFn: (input: ComposeInput) => repos.composer.generate(input) });
}
