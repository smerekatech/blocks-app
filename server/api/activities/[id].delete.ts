import { and, eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDb()
  const used = db.select({ id: schema.entries.id }).from(schema.entries)
    .where(and(eq(schema.entries.activityId, id), eq(schema.entries.userId, userId)))
    .limit(1).get()

  if (used) {
    const row = db.update(schema.activities).set({ archivedAt: new Date() })
      .where(and(eq(schema.activities.id, id), eq(schema.activities.userId, userId)))
      .returning().get()
    if (!row) throw createError({ statusCode: 404, message: 'Not found' })
    return { ...row, deleted: false }
  }

  db.delete(schema.activities)
    .where(and(eq(schema.activities.id, id), eq(schema.activities.userId, userId)))
    .run()
  return { id, deleted: true }
})
