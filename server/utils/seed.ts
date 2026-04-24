import { useDb, schema } from '../database/client'

const DEFAULT_ACTIVITIES: Array<{ name: string, color: string }> = [
  { name: 'Deep work', color: '#6366f1' },
  { name: 'Reading', color: '#0ea5e9' },
  { name: 'Writing', color: '#22c55e' },
  { name: 'Exercise', color: '#f59e0b' },
  { name: 'Meetings', color: '#ef4444' }
]

export function seedDefaultActivities(userId: number) {
  const db = useDb()
  db.insert(schema.activities).values(
    DEFAULT_ACTIVITIES.map(a => ({ userId, name: a.name, color: a.color }))
  ).run()
}
