import { useDb, schema } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await readBody<{ name?: string, color?: string }>(event)
  const name = body?.name?.trim()
  if (!name) throw createError({ statusCode: 400, message: 'Name is required' })
  const color = body?.color?.trim() || '#22c55e'

  const db = useDb()
  const row = db.insert(schema.activities).values({ userId, name, color })
    .returning().get()
  return row
})
