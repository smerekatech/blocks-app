<script setup lang="ts">
import { breakpointsTailwind } from '@vueuse/core'
import type { Activity, Entry } from '~~/server/database/schema'
import type { ViewMode } from '~/composables/useViewMode'

const view = useViewMode()
const bp = useBreakpoints(breakpointsTailwind)
const isDesktop = bp.greaterOrEqual('md')

const cursor = ref(today())

const range = computed<{ from: string, to: string, fetchTo: string }>(() => {
  if (view.value === 'day') {
    return { from: cursor.value, to: cursor.value, fetchTo: cursor.value }
  }
  if (view.value === 'workweek') {
    const start = startOfWeekMonday(cursor.value)
    return { from: start, to: addDays(start, 4), fetchTo: addDays(start, 6) }
  }
  if (view.value === 'week') {
    const start = startOfWeekMonday(cursor.value)
    return { from: start, to: addDays(start, 6), fetchTo: addDays(start, 6) }
  }
  const start = monthGridStart(cursor.value)
  return { from: start, to: addDays(start, 41), fetchTo: addDays(start, 41) }
})

const fromDate = computed(() => range.value.from)
const fetchTo = computed(() => range.value.fetchTo)

const weekDays = computed(() => {
  if (view.value === 'workweek') return weekdays(range.value.from, 5)
  if (view.value === 'week') return weekdays(range.value.from, 7)
  return []
})

const monthCells = computed(() => view.value === 'month' ? monthGridDays(cursor.value) : [])

const { data: entries, refresh: refreshEntries } = useEntries(fromDate, fetchTo)
const { data: allActivities, refresh: refreshActivities } = await useAsyncData<Activity[]>(
  'activities-all',
  () => $fetch('/api/activities', { query: { includeArchived: '1' } }),
  { default: () => [], server: false }
)
useRefreshOnFocus(refreshActivities)

const nuxt = useNuxtApp()
nuxt.hook('blocks:entries-changed', () => {
  void refreshEntries()
})
const activities = computed(() => allActivities.value.filter(a => !a.archivedAt))

const activitiesById = computed(() => {
  const m = new Map<number, Activity>()
  for (const a of allActivities.value) m.set(a.id, a)
  return m
})

function entriesFor(date: string): Entry[] {
  return entries.value.filter(e => e.date === date)
}

const dayTotal = computed(() =>
  entries.value
    .filter(e => e.date === cursor.value)
    .reduce((s, e) => s + e.blocks, 0)
)

function prev() {
  if (!isDesktop.value || view.value === 'day') cursor.value = addDays(cursor.value, -1)
  else if (view.value === 'month') cursor.value = addMonths(cursor.value, -1)
  else cursor.value = addDays(cursor.value, -7)
}
function next() {
  if (!isDesktop.value || view.value === 'day') cursor.value = addDays(cursor.value, 1)
  else if (view.value === 'month') cursor.value = addMonths(cursor.value, 1)
  else cursor.value = addDays(cursor.value, 7)
}
function goToday() {
  cursor.value = today()
}

const desktopRangeLabel = computed(() => {
  if (view.value === 'day') return formatDayFull(cursor.value)
  if (view.value === 'month') return formatMonth(cursor.value)
  return formatRange(range.value.from, range.value.to)
})

async function toggle(entry: Entry) {
  const blocks = entry.blocks === 1 ? 0.5 : 1
  await $fetch(`/api/entries/${entry.id}`, { method: 'PATCH', body: { blocks } })
  await refreshEntries()
}

async function remove(entry: Entry) {
  await $fetch(`/api/entries/${entry.id}`, { method: 'DELETE' })
  await refreshEntries()
}

async function onCreated() {
  await refreshEntries()
  await refreshActivities()
}

async function reorder(reordered: Entry[]) {
  const patches = reordered
    .map((e, i) => ({ entry: e, position: i }))
    .filter(({ entry, position }) => entry.position !== position)
  await Promise.all(
    patches.map(({ entry, position }) =>
      $fetch(`/api/entries/${entry.id}`, { method: 'PATCH', body: { position } })
    )
  )
  await refreshEntries()
}

const dayTotalLabel = computed(() => {
  const t = dayTotal.value
  return Number.isInteger(t) ? String(t) : t.toFixed(1)
})

const VIEW_OPTIONS: Array<{ label: string, value: ViewMode }> = [
  { label: 'Day', value: 'day' },
  { label: 'Workweek', value: 'workweek' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' }
]

function selectDay(date: string) {
  cursor.value = date
  view.value = 'day'
}

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
</script>

<template>
  <UContainer class="py-6 max-w-full">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="outline"
          size="sm"
          square
          @click="prev"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="outline"
          size="sm"
          square
          @click="next"
        />
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          @click="goToday"
        >
          Today
        </UButton>
        <div class="ml-2 text-[13px] font-medium">
          <span class="md:hidden">{{ formatDayFull(cursor) }}</span>
          <span class="hidden md:inline">{{ desktopRangeLabel }}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-sm text-muted md:hidden">
          Total: <span class="font-semibold text-default tabular-nums">{{ dayTotalLabel }}</span>
        </div>
        <div
          v-if="view === 'day'"
          class="hidden text-sm text-muted md:block"
        >
          Total: <span class="font-semibold text-default tabular-nums">{{ dayTotalLabel }}</span>
        </div>
        <USelect
          v-model="view"
          :items="VIEW_OPTIONS"
          size="sm"
          class="hidden w-32 md:block"
        />
      </div>
    </div>

    <div class="md:hidden">
      <DayColumn
        :date="cursor"
        :label="formatWeekdayLong(cursor)"
        :dom="Number(cursor.slice(-2))"
        :is-today="cursor === today()"
        :entries="entriesFor(cursor)"
        :activities="activities"
        :activities-by-id="activitiesById"
        @created="onCreated"
        @toggle="toggle"
        @remove="remove"
        @reorder="reorder"
        @updated="refreshEntries"
      />
    </div>

    <div class="hidden md:block">
      <div v-if="view === 'day'">
        <DayColumn
          :date="cursor"
          :label="formatWeekdayLong(cursor)"
          :dom="Number(cursor.slice(-2))"
          :is-today="cursor === today()"
          :entries="entriesFor(cursor)"
          :activities="activities"
          :activities-by-id="activitiesById"
          @created="onCreated"
          @toggle="toggle"
          @remove="remove"
          @reorder="reorder"
          @updated="refreshEntries"
        />
      </div>

      <div
        v-else-if="view === 'workweek' || view === 'week'"
        class="grid gap-3"
        :class="view === 'workweek' ? 'grid-cols-5' : 'grid-cols-7'"
      >
        <DayColumn
          v-for="d in weekDays"
          :key="d.date"
          :date="d.date"
          :label="d.label"
          :dom="d.dom"
          :is-today="d.isToday"
          :entries="entriesFor(d.date)"
          :activities="activities"
          :activities-by-id="activitiesById"
          @created="onCreated"
          @toggle="toggle"
          @remove="remove"
          @reorder="reorder"
          @updated="refreshEntries"
        />
      </div>

      <div
        v-else-if="view === 'month'"
        class="flex flex-col gap-1"
      >
        <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase text-muted">
          <span
            v-for="h in WEEKDAY_HEADERS"
            :key="h"
          >{{ h }}</span>
        </div>
        <div class="grid grid-cols-7 gap-1">
          <MonthDayTile
            v-for="cell in monthCells"
            :key="cell.date"
            :date="cell.date"
            :dom="cell.dom"
            :in-month="cell.inMonth"
            :is-today="cell.isToday"
            :entries="entriesFor(cell.date)"
            :activities-by-id="activitiesById"
            @select="selectDay"
          />
        </div>
      </div>
    </div>
  </UContainer>
</template>
