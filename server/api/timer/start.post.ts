import { and, eq, isNull } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readBody<{ activityId?: number, name?: string, startedDate?: string }>(event)

  const startedDate = String(body?.startedDate || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startedDate)) {
    throw createError({ statusCode: 400, message: 'Invalid startedDate' })
  }

  const hasActivityId = body?.activityId != null && Number.isFinite(Number(body.activityId))
  const freeformName = body?.name?.trim()
  if (hasActivityId === Boolean(freeformName)) {
    throw createError({ statusCode: 400, message: 'Provide exactly one of activityId or name' })
  }

  const db = useDb()

  const [existing] = await db.select({ id: schema.runningTimers.id }).from(schema.runningTimers)
    .where(eq(schema.runningTimers.userId, userId))
  if (existing) throw createError({ statusCode: 409, message: 'Timer already running' })

  let activityId: number | null = null
  let name: string | null = null

  if (hasActivityId) {
    activityId = Number(body!.activityId)
    const [activity] = await db.select({ id: schema.activities.id }).from(schema.activities)
      .where(and(
        eq(schema.activities.id, activityId),
        eq(schema.activities.userId, userId),
        isNull(schema.activities.archivedAt)
      ))
    if (!activity) throw createError({ statusCode: 404, message: 'Activity not found' })
  } else {
    name = freeformName!
  }

  const [row] = await db.insert(schema.runningTimers).values({
    userId,
    activityId,
    name,
    startedDate,
    half: 1
  }).returning()

  return row
})
