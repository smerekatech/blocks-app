import { and, eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  const body = await readBody<{ blocks?: number, position?: number }>(event)

  const patch: Partial<typeof schema.entries.$inferInsert> = {}
  if (body?.blocks === 0.5 || body?.blocks === 1) patch.blocks = body.blocks
  if (Number.isFinite(body?.position)) patch.position = Number(body!.position)
  if (Object.keys(patch).length === 0) return { ok: true }

  const db = useDb()
  const row = db.update(schema.entries).set(patch)
    .where(and(eq(schema.entries.id, id), eq(schema.entries.userId, userId)))
    .returning().get()
  if (!row) throw createError({ statusCode: 404, message: 'Not found' })
  return row
})
