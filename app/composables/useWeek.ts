export function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, d)
}

export function today(): string {
  return toYmd(new Date())
}

export function startOfWeekMonday(dateYmd: string): string {
  const d = fromYmd(dateYmd)
  const dow = d.getDay()
  const delta = (dow + 6) % 7
  d.setDate(d.getDate() - delta)
  return toYmd(d)
}

export function addDays(dateYmd: string, days: number): string {
  const d = fromYmd(dateYmd)
  d.setDate(d.getDate() + days)
  return toYmd(d)
}

export function weekdays(startYmd: string, count = 5): Array<{ date: string, label: string, dom: number, isToday: boolean }> {
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const t = today()
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(startYmd, i)
    const d = fromYmd(date)
    return {
      date,
      label: names[i]!,
      dom: d.getDate(),
      isToday: date === t
    }
  })
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function formatRange(startYmd: string, endYmd: string): string {
  const s = fromYmd(startYmd)
  const e = fromYmd(endYmd)
  const sameYear = s.getFullYear() === e.getFullYear()
  const fmt = (d: Date, withYear: boolean) =>
    `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`
  return `${fmt(s, !sameYear)} – ${fmt(e, true)}`
}

export function formatDayFull(ymd: string): string {
  const d = fromYmd(ymd)
  return `${WEEKDAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

export function formatWeekdayLong(ymd: string): string {
  return WEEKDAYS_LONG[fromYmd(ymd).getDay()]!
}
