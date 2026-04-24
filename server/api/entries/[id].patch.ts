import { and, eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  const body = await readBody<{ blocks?: number, position?: number, activityId?: number, name?: string }>(event)

  const db = useDb()
  const patch: Partial<typeof schema.entries.$inferInsert> = {}
  if (body?.blocks === 0.5 || body?.blocks === 1) patch.blocks = body.blocks
  if (Number.isFinite(body?.position)) patch.position = Number(body!.position)

  if (body?.activityId != null) {
    const activityId = Number(body.activityId)
    if (!Number.isFinite(activityId)) throw createError({ statusCode: 400, message: 'Invalid activityId' })
    const [activity] = await db.select({ id: schema.activities.id }).from(schema.activities)
      .where(and(eq(schema.activities.id, activityId), eq(schema.activities.userId, userId)))
    if (!activity) throw createError({ statusCode: 404, message: 'Activity not found' })
    patch.activityId = activityId
    patch.name = null
  } else if (body?.name != null) {
    const name = body.name.trim()
    if (!name) throw createError({ statusCode: 400, message: 'Name required' })
    patch.name = name
    patch.activityId = null
  }

  if (Object.keys(patch).length === 0) return { ok: true }

  const [row] = await db.update(schema.entries).set(patch)
    .where(and(eq(schema.entries.id, id), eq(schema.entries.userId, userId)))
    .returning()
  if (!row) throw createError({ statusCode: 404, message: 'Not found' })
  return row
})
