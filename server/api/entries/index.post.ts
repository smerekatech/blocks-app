import { and, eq, sql } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'
import { dayFullError, hasDayCapacity } from '~~/server/utils/dayCap'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readBody<{ activityId?: number, name?: string, date?: string, blocks?: number }>(event)

  const date = String(body?.date || '')
  const blocksRaw = Number(body?.blocks ?? 1)
  const blocks = blocksRaw === 0.5 ? 0.5 : 1
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw createError({ statusCode: 400, message: 'Invalid date' })

  const hasActivityId = body?.activityId != null && Number.isFinite(Number(body.activityId))
  const freeformName = body?.name?.trim()
  if (!hasActivityId && !freeformName) {
    throw createError({ statusCode: 400, message: 'activityId or name required' })
  }

  const db = useDb()

  if (!(await hasDayCapacity(db, userId, date, blocks))) throw dayFullError()

  let activityId: number | null = null
  let name: string | null = null

  if (hasActivityId) {
    activityId = Number(body!.activityId)
    const [activity] = await db.select({ id: schema.activities.id }).from(schema.activities)
      .where(and(eq(schema.activities.id, activityId), eq(schema.activities.userId, userId)))
    if (!activity) throw createError({ statusCode: 404, message: 'Activity not found' })
  } else {
    name = freeformName!
  }

  const [next] = await db.select({ m: sql<number>`COALESCE(MAX(${schema.entries.position}), -1)` })
    .from(schema.entries)
    .where(and(eq(schema.entries.userId, userId), eq(schema.entries.date, date)))
  const position = (Number(next?.m ?? -1)) + 1

  const [row] = await db.insert(schema.entries).values({ userId, activityId, name, date, blocks, position })
    .returning()
  return row
})
