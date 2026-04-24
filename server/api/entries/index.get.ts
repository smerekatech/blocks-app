import { and, asc, between, eq } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const q = getQuery(event)
  const from = String(q.from || '')
  const to = String(q.to || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw createError({ statusCode: 400, message: 'Invalid from/to' })
  }

  const db = useDb()
  const rows = db.select().from(schema.entries)
    .where(and(
      eq(schema.entries.userId, userId),
      between(schema.entries.date, from, to)
    ))
    .orderBy(asc(schema.entries.date), asc(schema.entries.position), asc(schema.entries.id))
    .all()
  return rows
})
