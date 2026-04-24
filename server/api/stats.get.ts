import { and, between, eq, isNull, sql } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'

interface StatsResponse {
  from: string
  to: string
  total: number
  byDay: Array<{ date: string, blocks: number }>
  byActivity: Array<{ activityId: number | null, name: string, color: string, blocks: number }>
}

export default defineEventHandler(async (event): Promise<StatsResponse> => {
  const userId = await requireUserId(event)
  const q = getQuery(event)
  const from = String(q.from || '')
  const to = String(q.to || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw createError({ statusCode: 400, message: 'Invalid from/to' })
  }

  const db = useDb()
  const where = and(
    eq(schema.entries.userId, userId),
    between(schema.entries.date, from, to)
  )

  const byDay = await db.select({
    date: schema.entries.date,
    blocks: sql<number>`SUM(${schema.entries.blocks})`
  }).from(schema.entries).where(where).groupBy(schema.entries.date)

  const byActivity = await db.select({
    activityId: schema.activities.id,
    name: schema.activities.name,
    color: schema.activities.color,
    blocks: sql<number>`SUM(${schema.entries.blocks})`
  })
    .from(schema.entries)
    .innerJoin(schema.activities, eq(schema.activities.id, schema.entries.activityId))
    .where(where)
    .groupBy(schema.activities.id, schema.activities.name, schema.activities.color)

  const byCustom = await db.select({
    name: schema.entries.name,
    blocks: sql<number>`SUM(${schema.entries.blocks})`
  })
    .from(schema.entries)
    .where(and(where, isNull(schema.entries.activityId)))
    .groupBy(schema.entries.name)

  const total = byDay.reduce((s, r) => s + Number(r.blocks ?? 0), 0)

  return {
    from,
    to,
    total,
    byDay: byDay.map(r => ({ date: r.date, blocks: Number(r.blocks ?? 0) })),
    byActivity: [
      ...byActivity.map(r => ({ ...r, blocks: Number(r.blocks ?? 0) })),
      ...byCustom.map(r => ({
        activityId: null,
        name: r.name?.trim() || 'Untitled',
        color: '#64748b',
        blocks: Number(r.blocks ?? 0)
      }))
    ].sort((a, b) => b.blocks - a.blocks)
  }
})
