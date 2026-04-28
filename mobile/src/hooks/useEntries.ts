import { useQuery } from '@tanstack/react-query';
import { listEntries } from '~/api/entries';
import { queryKeys } from '~/state/queryClient';

export function useEntries(range: { from: string; to: string }) {
  return useQuery({
    queryKey: queryKeys.entries(range),
    queryFn: () => listEntries(range),
    staleTime: 30_000,
  });
}
