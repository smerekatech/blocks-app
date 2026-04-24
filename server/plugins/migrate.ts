import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { resolve } from 'node:path'
import { useDb } from '../database/client'

export default defineNitroPlugin(() => {
  const db = useDb()
  migrate(db, { migrationsFolder: resolve('server/database/migrations') })
})
