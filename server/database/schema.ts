import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  googleId: text('google_id').notNull(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, t => ({
  googleIdIdx: uniqueIndex('users_google_id_unique').on(t.googleId)
}))

export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#22c55e'),
  archivedAt: integer('archived_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, t => ({
  userActiveIdx: index('activities_user_archived_idx').on(t.userId, t.archivedAt)
}))

export const entries = sqliteTable('entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityId: integer('activity_id').notNull().references(() => activities.id, { onDelete: 'restrict' }),
  date: text('date').notNull(),
  blocks: real('blocks').notNull().default(1),
  position: integer('position').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, t => ({
  userDateIdx: index('entries_user_date_idx').on(t.userId, t.date)
}))

export type User = typeof users.$inferSelect
export type Activity = typeof activities.$inferSelect
export type Entry = typeof entries.$inferSelect
