import { and, eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: 'Invalid id' })

  const body = await readBody<{ name?: string, color?: string, archived?: boolean }>(event)
  const patch: Partial<typeof schema.activities.$inferInsert> = {}
  if (typeof body?.name === 'string') {
    const name = body.name.trim()
    if (!name) throw createError({ statusCode: 400, message: 'Name is required' })
    patch.name = name
  }
  if (typeof body?.color === 'string') patch.color = body.color
  if (typeof body?.archived === 'boolean') patch.archivedAt = body.archived ? new Date() : null
  if (Object.keys(patch).length === 0) return { ok: true }

  const db = useDb()
  const row = db.update(schema.activities).set(patch)
    .where(and(eq(schema.activities.id, id), eq(schema.activities.userId, userId)))
    .returning().get()
  if (!row) throw createError({ statusCode: 404, message: 'Not found' })
  return row
})
