import { and, eq, sql } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readBody<{ activityId?: number, date?: string, blocks?: number }>(event)

  const activityId = Number(body?.activityId)
  const date = String(body?.date || '')
  const blocksRaw = Number(body?.blocks ?? 1)
  const blocks = blocksRaw === 0.5 ? 0.5 : 1

  if (!Number.isFinite(activityId)) throw createError({ statusCode: 400, message: 'activityId required' })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw createError({ statusCode: 400, message: 'Invalid date' })

  const db = useDb()
  const activity = db.select({ id: schema.activities.id }).from(schema.activities)
    .where(and(eq(schema.activities.id, activityId), eq(schema.activities.userId, userId)))
    .get()
  if (!activity) throw createError({ statusCode: 404, message: 'Activity not found' })

  const next = db.select({ m: sql<number>`COALESCE(MAX(${schema.entries.position}), -1)` })
    .from(schema.entries)
    .where(and(eq(schema.entries.userId, userId), eq(schema.entries.date, date)))
    .get()
  const position = (next?.m ?? -1) + 1

  const row = db.insert(schema.entries).values({ userId, activityId, date, blocks, position })
    .returning().get()
  return row
})
