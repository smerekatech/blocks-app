import { and, eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: 'Invalid id' })

  const db = useDb()
  const res = db.delete(schema.entries)
    .where(and(eq(schema.entries.id, id), eq(schema.entries.userId, userId)))
    .run()
  if (res.changes === 0) throw createError({ statusCode: 404, message: 'Not found' })
  return { id, deleted: true }
})
