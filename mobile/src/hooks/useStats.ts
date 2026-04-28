import { useQuery } from '@tanstack/react-query';
import { getStats } from '~/api/stats';
import { queryKeys } from '~/state/queryClient';

export function useStats(range: { from: string; to: string }) {
  return useQuery({
    queryKey: queryKeys.stats(range),
    queryFn: () => getStats(range),
    staleTime: 60_000,
  });
}
