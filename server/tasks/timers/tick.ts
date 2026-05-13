import { lte } from 'drizzle-orm'
import { useDb, schema } from '~~/server/database/client'
import { HALF_DURATION_MS, finalizeAndStop, promoteHalfOne } from '~~/server/utils/timer'

export default defineTask({
  meta: {
    name: 'timers:tick',
    description: 'Advance any running timers whose half-block duration has elapsed, so progress doesn\'t depend on a client being open.'
  },
  async run() {
    const db = useDb()
    const cutoff = new Date(Date.now() - HALF_DURATION_MS)

    const due = await db.select().from(schema.runningTimers)
      .where(lte(schema.runningTimers.startedAt, cutoff))

    let promoted = 0
    let completed = 0

    for (const row of due) {
      if (row.half === 1) {
        if (row.firstEntryId == null) {
          await promoteHalfOne(db, row)
          promoted++
        }
        // Already in awaiting-choice — needs user action to advance.
      } else {
        await finalizeAndStop(db, row)
        completed++
      }
    }

    return { result: { scanned: due.length, promoted, completed } }
  }
})
