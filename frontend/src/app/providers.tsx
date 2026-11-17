import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../components/ui/Toast';
import { RepositoryError } from '../data';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        // Don't retry client errors (validation, not found, not implemented).
        retry: (count, error) =>
          !(error instanceof RepositoryError && error.status >= 400 && error.status < 500) &&
          !(error instanceof RepositoryError && error.status === 501) &&
          count < 2,
      },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
