import { eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'
import { dayFullError, hasDayCapacity } from '~~/server/utils/dayCap'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)

  const db = useDb()
  const [row] = await db.select().from(schema.runningTimers)
    .where(eq(schema.runningTimers.userId, userId))
  if (!row) throw createError({ statusCode: 404, message: 'No timer running' })

  if (row.half !== 1 || row.firstEntryId == null) {
    throw createError({ statusCode: 409, message: 'Not in awaiting-choice state' })
  }

  // Second half will finalize the entry from 0.5 to 1, adding 0.5 to the day.
  if (!(await hasDayCapacity(db, userId, row.startedDate, 0.5, row.firstEntryId))) {
    throw dayFullError()
  }

  const [updated] = await db.update(schema.runningTimers)
    .set({ half: 2, startedAt: new Date() })
    .where(eq(schema.runningTimers.id, row.id))
    .returning()

  return updated
})
