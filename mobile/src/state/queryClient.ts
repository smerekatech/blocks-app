import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  activities: (opts?: { includeArchived?: boolean }) => ['activities', opts ?? {}] as const,
  entries: (range: { from: string; to: string }) => ['entries', range] as const,
  timer: () => ['timer'] as const,
  stats: (range: { from: string; to: string }) => ['stats', range] as const,
  me: () => ['me'] as const,
};
