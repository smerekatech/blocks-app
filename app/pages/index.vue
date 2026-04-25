<script setup lang="ts">
import { breakpointsTailwind } from '@vueuse/core'
import type { Activity, Entry } from '~~/server/database/schema'

const bp = useBreakpoints(breakpointsTailwind)
const isDesktop = bp.greaterOrEqual('md')

const cursor = ref(today())
const weekStart = computed(() => startOfWeekMonday(cursor.value))
const weekEnd = computed(() => addDays(weekStart.value, 4))
const days = computed(() => weekdays(weekStart.value, 5))

const { data: entries, refresh: refreshEntries } = useEntries(weekStart, weekEnd)
const { data: allActivities, refresh: refreshActivities } = await useAsyncData<Activity[]>(
  'activities-all',
  () => $fetch('/api/activities', { query: { includeArchived: '1' } }),
  { default: () => [], server: false }
)
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
  cursor.value = isDesktop.value ? addDays(cursor.value, -7) : addDays(cursor.value, -1)
}
function next() {
  cursor.value = isDesktop.value ? addDays(cursor.value, 7) : addDays(cursor.value, 1)
}
function goToday() {
  cursor.value = today()
}

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
</script>

<template>
  <UContainer class="py-6 max-w-full">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="sm" @click="prev" />
        <UButton size="sm" color="neutral" variant="outline" @click="goToday">Today</UButton>
        <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="sm" @click="next" />
        <div class="ml-2 text-sm font-medium">
          <span class="hidden md:inline">{{ formatRange(weekStart, weekEnd) }}</span>
          <span class="md:hidden">{{ formatDayFull(cursor) }}</span>
        </div>
      </div>
      <div class="md:hidden text-sm text-muted">
        Total: <span class="font-semibold text-default tabular-nums">{{ dayTotalLabel }}</span>
      </div>
    </div>

    <div class="hidden md:grid md:grid-cols-5 md:gap-3">
      <DayColumn
        v-for="d in days"
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
  </UContainer>
</template>
