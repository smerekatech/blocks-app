import { QueryClient } from '@tanstack/react-query';
import { hydrateQueryCache } from './queryPersistence';

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

// Restore the last-known good cache from disk synchronously so the UI doesn't
// flash empty on cold launch. Background refetch revalidates as usual.
hydrateQueryCache(queryClient);

export const queryKeys = {
  activities: (opts?: { includeArchived?: boolean }) => ['activities', opts ?? {}] as const,
  entries: (range: { from: string; to: string }) => ['entries', range] as const,
  timer: () => ['timer'] as const,
  stats: (range: { from: string; to: string }) => ['stats', range] as const,
  me: () => ['me'] as const,
};
