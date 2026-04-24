import type { Activity } from '~~/server/database/schema'

export function useActivities(opts: { includeArchived?: boolean } = {}) {
  const query = computed(() => opts.includeArchived ? { includeArchived: '1' } : {})
  return useFetch<Activity[]>('/api/activities', {
    query,
    default: () => [] as Activity[],
    server: false
  })
}
