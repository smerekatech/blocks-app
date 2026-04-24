import { and, asc, eq, isNull } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const includeArchived = getQuery(event).includeArchived === '1'
  const db = useDb()
  const rows = db.select().from(schema.activities)
    .where(includeArchived
      ? eq(schema.activities.userId, userId)
      : and(eq(schema.activities.userId, userId), isNull(schema.activities.archivedAt))
    )
    .orderBy(asc(schema.activities.name))
    .all()
  return rows
})
