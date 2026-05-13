import { and, eq, sql } from 'drizzle-orm'
import { schema, type Db } from '~~/server/database/client'
import type { RunningTimer } from '~~/server/database/schema'

export const HALF_DURATION_MS = 45 * 60 * 1000
export const HALF_BLOCK_MIN_MS = 20 * 60 * 1000

export function elapsedMs(startedAt: Date): number {
  return Date.now() - startedAt.getTime()
}

/**
 * Half 1 has run its full duration: create the 0.5-block entry for the timer
 * (if one doesn't already exist) and link it via firstEntryId. Returns the
 * firstEntryId. Idempotent — safe to call when firstEntryId is already set.
 */
export async function promoteHalfOne(db: Db, row: RunningTimer): Promise<number> {
  if (row.firstEntryId != null) return row.firstEntryId

  const [next] = await db.select({ m: sql<number>`COALESCE(MAX(${schema.entries.position}), -1)` })
    .from(schema.entries)
    .where(and(eq(schema.entries.userId, row.userId), eq(schema.entries.date, row.startedDate)))
  const position = Number(next?.m ?? -1) + 1

  const [entry] = await db.insert(schema.entries).values({
    userId: row.userId,
    activityId: row.activityId,
    name: row.name,
    date: row.startedDate,
    blocks: 0.5,
    position
  }).returning({ id: schema.entries.id })

  await db.update(schema.runningTimers).set({ firstEntryId: entry!.id })
    .where(eq(schema.runningTimers.id, row.id))

  return entry!.id
}

/**
 * Half 2 has run its full duration: bump the entry to a full block and remove
 * the running-timer row.
 */
export async function finalizeAndStop(db: Db, row: RunningTimer): Promise<void> {
  if (row.firstEntryId != null) {
    await db.update(schema.entries).set({ blocks: 1 })
      .where(and(eq(schema.entries.id, row.firstEntryId), eq(schema.entries.userId, row.userId)))
  }
  await db.delete(schema.runningTimers).where(eq(schema.runningTimers.id, row.id))
}
