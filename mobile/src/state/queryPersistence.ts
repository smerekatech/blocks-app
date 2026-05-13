import { dehydrate, hydrate, type QueryClient } from '@tanstack/react-query';
import { createMMKV } from 'react-native-mmkv';

const mmkv = createMMKV({ id: 'blocks-rq-cache' });
const KEY = 'cache';
const VERSION = 1;
// Show stale data for at most a week. After that the user gets the empty
// state on first launch rather than a really stale snapshot.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface PersistedCache {
  version: number;
  savedAt: number;
  state: ReturnType<typeof dehydrate>;
}

export function hydrateQueryCache(client: QueryClient): void {
  const raw = mmkv.getString(KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as PersistedCache;
    if (parsed.version !== VERSION || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      mmkv.remove(KEY);
      return;
    }
    hydrate(client, parsed.state);
  } catch {
    mmkv.remove(KEY);
  }
}

export function startQueryCachePersistence(client: QueryClient): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    timer = null;
    const state = dehydrate(client, {
      shouldDehydrateQuery: (q) => q.state.status === 'success',
    });
    const payload: PersistedCache = { version: VERSION, savedAt: Date.now(), state };
    try {
      mmkv.set(KEY, JSON.stringify(payload));
    } catch {
      // OOM / quota — drop this write; next change will retry.
    }
  };

  const schedule = () => {
    if (timer) return;
    timer = setTimeout(flush, 1000);
  };

  const unsub = client.getQueryCache().subscribe((event) => {
    if (event.type === 'added' || event.type === 'removed' || event.type === 'updated') {
      schedule();
    }
  });

  return () => {
    unsub();
    if (timer) clearTimeout(timer);
  };
}

export function clearPersistedQueryCache(): void {
  mmkv.remove(KEY);
}
