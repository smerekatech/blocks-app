export type RangeKind = 'week' | 'month' | 'year';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function ymd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Adds (or subtracts) `days` from a YYYY-MM-DD string and returns the new YYYY-MM-DD. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y!, m! - 1, d!);
  date.setDate(date.getDate() + days);
  return ymd(date);
}

/** Returns start (inclusive) and end (inclusive) of the requested range, anchored on `today`. */
export function dateRange(today: string, kind: RangeKind): { from: string; to: string } {
  const [y, m, d] = today.split('-').map(Number);
  const ref = new Date(y!, m! - 1, d!);

  if (kind === 'week') {
    // Monday-anchored week containing today.
    const day = ref.getDay(); // Sunday=0
    const offsetToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(ref);
    monday.setDate(ref.getDate() - offsetToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: ymd(monday), to: ymd(sunday) };
  }

  if (kind === 'month') {
    const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return { from: ymd(first), to: ymd(last) };
  }

  // year
  const first = new Date(ref.getFullYear(), 0, 1);
  const last = new Date(ref.getFullYear(), 11, 31);
  return { from: ymd(first), to: ymd(last) };
}

interface BucketSpec {
  /** ISO YYYY-MM-DD (inclusive) at the start of this bucket's source data. */
  start: string;
  /** ISO YYYY-MM-DD (inclusive) at the end of this bucket's source data. */
  end: string;
  /** Short label for the X axis. */
  label: string;
}

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/** Aggregate raw byDay records into chart buckets per range kind. */
export function bucketByDay(
  byDay: Array<{ date: string; blocks: number }>,
  range: { from: string; to: string },
  kind: RangeKind,
): Array<{ label: string; value: number }> {
  const buckets = makeBuckets(range, kind);
  return buckets.map((b) => {
    let sum = 0;
    for (const d of byDay) {
      if (inRange(d.date, b.start, b.end)) sum += d.blocks;
    }
    return { label: b.label, value: sum };
  });
}

function makeBuckets(range: { from: string; to: string }, kind: RangeKind): BucketSpec[] {
  const [fy, fm, fd] = range.from.split('-').map(Number);
  const start = new Date(fy!, fm! - 1, fd!);

  if (kind === 'week') {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = ymd(d);
      return { start: iso, end: iso, label: days[i]! };
    });
  }

  if (kind === 'month') {
    const [ty, tm, td] = range.to.split('-').map(Number);
    const end = new Date(ty!, tm! - 1, td!);
    const dayCount = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    return Array.from({ length: dayCount }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = ymd(d);
      // Label every 5th day to avoid axis crowding.
      const label = i === 0 || (i + 1) % 5 === 0 ? String(d.getDate()) : '';
      return { start: iso, end: iso, label };
    });
  }

  // year — 12 monthly buckets.
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  return Array.from({ length: 12 }, (_, i) => {
    const first = new Date(start.getFullYear(), i, 1);
    const last = new Date(start.getFullYear(), i + 1, 0);
    return { start: ymd(first), end: ymd(last), label: months[i]! };
  });
}
