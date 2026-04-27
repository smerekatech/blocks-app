import { pgTable, text, integer, real, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  googleId: text('google_id').notNull(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, t => [
  uniqueIndex('users_google_id_unique').on(t.googleId)
])

export const activities = pgTable('activities', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#64748b52'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, t => [
  index('activities_user_archived_idx').on(t.userId, t.archivedAt)
])

export const entries = pgTable('entries', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityId: integer('activity_id').references(() => activities.id, { onDelete: 'restrict' }),
  name: text('name'),
  date: text('date').notNull(),
  blocks: real('blocks').notNull().default(1),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, t => [
  index('entries_user_date_idx').on(t.userId, t.date)
])

export type User = typeof users.$inferSelect
export type Activity = typeof activities.$inferSelect
export type Entry = typeof entries.$inferSelect
