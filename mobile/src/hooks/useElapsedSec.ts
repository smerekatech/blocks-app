import { useEffect, useState } from 'react';

/**
 * Returns the seconds elapsed since `startedAt` (ISO string), ticking once a second.
 * Returns 0 when startedAt is null. Caller is responsible for clamping to a max.
 */
export function useElapsedSec(startedAt: string | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!startedAt) return 0;
  const started = new Date(startedAt).getTime();
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((now - started) / 1000));
}
