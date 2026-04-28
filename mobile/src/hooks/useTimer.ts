import { useQuery } from '@tanstack/react-query';
import { getTimer } from '~/api/timer';
import { queryKeys } from '~/state/queryClient';

export function useTimer() {
  return useQuery({
    queryKey: queryKeys.timer(),
    queryFn: getTimer,
    staleTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.timer ? 30_000 : false;
    },
  });
}
