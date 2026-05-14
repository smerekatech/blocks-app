import { and, eq, ne, sql } from 'drizzle-orm'
import { schema, type Db } from '~~/server/database/client'

export const DAY_BLOCK_CAP = 12

/** Sum of entries.blocks for (userId, date), optionally excluding one entry. */
export async function dayBlocksSum(
  db: Db,
  userId: number,
  date: string,
  excludeEntryId?: number
): Promise<number> {
  const [row] = await db.select({ s: sql<number>`COALESCE(SUM(${schema.entries.blocks}), 0)` })
    .from(schema.entries)
    .where(and(
      eq(schema.entries.userId, userId),
      eq(schema.entries.date, date),
      excludeEntryId != null ? ne(schema.entries.id, excludeEntryId) : undefined
    ))
  return Number(row?.s ?? 0)
}

/** Whether `addBlocks` more would still fit under the day cap. */
export async function hasDayCapacity(
  db: Db,
  userId: number,
  date: string,
  addBlocks: number,
  excludeEntryId?: number
): Promise<boolean> {
  const sum = await dayBlocksSum(db, userId, date, excludeEntryId)
  return sum + addBlocks <= DAY_BLOCK_CAP
}

export function dayFullError() {
  return createError({
    statusCode: 409,
    message: `Day is full — ${DAY_BLOCK_CAP} blocks already logged.`
  })
}
