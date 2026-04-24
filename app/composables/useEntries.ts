import type { Entry } from '~~/server/database/schema'

export function useEntries(from: Ref<string>, to: Ref<string>) {
  return useFetch<Entry[]>('/api/entries', {
    query: { from, to },
    default: () => [] as Entry[],
    watch: [from, to],
    server: false
  })
}
