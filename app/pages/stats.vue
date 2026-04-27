<script setup lang="ts">
type Range = 'workweek' | 'week' | 'month'

const range = ref<Range>('week')
const cursor = ref(today())

const rangeItems = [
  { label: 'Workweek', value: 'workweek' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' }
]

const from = computed(() => {
  if (range.value === 'month') return startOfMonth(cursor.value)
  return startOfWeekMonday(cursor.value)
})
const to = computed(() => {
  if (range.value === 'workweek') return addDays(from.value, 4)
  if (range.value === 'week') return addDays(from.value, 6)
  return endOfMonth(cursor.value)
})

const periodLabel = computed(() => {
  if (range.value === 'month') return formatMonth(cursor.value)
  return formatRange(from.value, to.value)
})

const { data: stats } = await useAsyncData(
  'stats',
  () => $fetch('/api/stats', { query: { from: from.value, to: to.value } }),
  {
    watch: [from, to],
    server: false,
    default: () => ({ from: '', to: '', total: 0, byDay: [], byActivity: [] })
  }
)

const bars = computed(() => {
  const list = stats.value
  if (!list) return []
  const t = today()
  if (range.value === 'workweek' || range.value === 'week') {
    const names = range.value === 'workweek'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return names.map((label, i) => {
      const date = addDays(from.value, i)
      const found = list.byDay.find(d => d.date === date)
      return {
        label,
        sub: String(fromYmd(date).getDate()),
        value: found?.blocks ?? 0,
        highlight: date === t
      }
    })
  }
  // month: one bar per day
  const start = fromYmd(from.value)
  const end = fromYmd(to.value)
  const count = (end.getTime() - start.getTime()) / 86400000 + 1
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(from.value, i)
    const found = list.byDay.find(d => d.date === date)
    const dom = fromYmd(date).getDate()
    return {
      label: String(dom),
      value: found?.blocks ?? 0,
      highlight: date === t
    }
  })
})

const maxActivityBlocks = computed(() =>
  Math.max(1, ...(stats.value?.byActivity.map(a => a.blocks) ?? []))
)

function prev() {
  if (range.value === 'month') cursor.value = addMonths(cursor.value, -1)
  else cursor.value = addDays(cursor.value, -7)
}
function next() {
  if (range.value === 'month') cursor.value = addMonths(cursor.value, 1)
  else cursor.value = addDays(cursor.value, 7)
}

function fmtTotal(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

function pct(v: number): string {
  const total = stats.value?.total ?? 0
  if (!total) return '0%'
  return Math.round((v / total) * 100) + '%'
}
</script>

<template>
  <UContainer class="py-8 max-w-4xl">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">Stats</h1>
      <div class="flex items-center gap-2">
        <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="sm" @click="prev" />
        <div class="min-w-40 text-center text-sm font-medium">{{ periodLabel }}</div>
        <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="sm" @click="next" />
      </div>
    </div>

    <div class="mb-6 flex items-center gap-3">
      <URadioGroup v-model="range" :items="rangeItems" orientation="horizontal" />
      <div class="ml-auto text-sm text-muted">
        Total: <span class="font-semibold text-default tabular-nums">{{ fmtTotal(stats?.total ?? 0) }}</span> blocks
      </div>
    </div>

    <UCard class="mb-8">
      <StatsBarChart :bars="bars" />
    </UCard>

    <UCard>
      <template #header>
        <span class="font-medium">By activity</span>
      </template>
      <ul class="divide-y divide-default">
        <li v-if="(stats?.byActivity.length ?? 0) === 0" class="py-4 text-sm text-muted text-center">
          No entries in this period.
        </li>
        <li
          v-for="a in stats?.byActivity ?? []"
          :key="a.activityId ?? `custom:${a.name}`"
          class="flex items-center gap-3 py-2"
        >
          <span class="size-3 rounded-full shrink-0" :style="{ background: a.color }" />
          <span class="flex-1 font-medium truncate">{{ a.name }}</span>
          <div class="flex items-center gap-3 w-48">
            <div class="flex-1 h-2 rounded-full bg-elevated overflow-hidden">
              <div
                class="h-full"
                :style="{ background: a.color, width: (a.blocks / maxActivityBlocks * 100) + '%' }"
              />
            </div>
            <div class="text-sm tabular-nums w-20 text-right">
              <span class="font-semibold">{{ fmtTotal(a.blocks) }}</span>
              <span class="text-muted ml-1">{{ pct(a.blocks) }}</span>
            </div>
          </div>
        </li>
      </ul>
    </UCard>
  </UContainer>
</template>
