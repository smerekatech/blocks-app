import { eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'
import { dayFullError, hasDayCapacity } from '~~/server/utils/dayCap'
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
    if (row.firstEntryId == null && !(await hasDayCapacity(db, userId, row.startedDate, 0.5))) {
      throw dayFullError()
    }
    const firstEntryId = await promoteHalfOne(db, row)
    return {
      state: 'awaiting-choice' as const,
      firstEntryId,
      activityId: row.activityId,
      startedDate: row.startedDate
    }
  }

  if (row.firstEntryId != null
    && !(await hasDayCapacity(db, userId, row.startedDate, 0.5, row.firstEntryId))) {
    throw dayFullError()
  }
  await finalizeAndStop(db, row)
  return {
    state: 'completed' as const,
    firstEntryId: row.firstEntryId
  }
})
