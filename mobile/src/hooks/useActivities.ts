import { useQuery } from '@tanstack/react-query';
import { listActivities } from '~/api/activities';
import { queryKeys } from '~/state/queryClient';

export function useActivities(opts?: { includeArchived?: boolean }) {
  return useQuery({
    queryKey: queryKeys.activities(opts),
    queryFn: () => listActivities(opts),
    staleTime: 5 * 60_000,
  });
}
