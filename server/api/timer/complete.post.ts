import { eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'
import { HALF_DURATION_MS, elapsedMs, finalizeAndStop, promoteHalfOne } from '~~/server/utils/timer'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const db = useDb()
  const [row] = await db.select().from(schema.runningTimers)
    .where(eq(schema.runningTimers.userId, userId))
  if (!row) throw createError({ statusCode: 404, message: 'No timer running' })

  const elapsed = elapsedMs(row.startedAt)
  if (elapsed < HALF_DURATION_MS) {
    throw createError({ statusCode: 400, message: 'Timer not yet complete' })
  }

  if (row.half === 1) {
    const firstEntryId = await promoteHalfOne(db, row)
    return {
      state: 'awaiting-choice' as const,
      firstEntryId,
      activityId: row.activityId,
      startedDate: row.startedDate
    }
  }

  await finalizeAndStop(db, row)
  return {
    state: 'completed' as const,
    firstEntryId: row.firstEntryId
  }
})
