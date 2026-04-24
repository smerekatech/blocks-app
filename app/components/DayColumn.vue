<script setup lang="ts">
import { useSortable, moveArrayElement } from '@vueuse/integrations/useSortable'
import type { Activity, Entry } from '~~/server/database/schema'

const props = defineProps<{
  date: string
  label: string
  dom: number
  isToday?: boolean
  entries: Entry[]
  activities: Activity[]
  activitiesById: Map<number, Activity>
}>()

const emit = defineEmits<{
  created: []
  toggle: [entry: Entry]
  remove: [entry: Entry]
  reorder: [entries: Entry[]]
}>()

const sortedEntries = ref<Entry[]>([...props.entries])
watch(() => props.entries, (val) => { sortedEntries.value = [...val] })

const listEl = ref<HTMLElement | null>(null)
useSortable(listEl, sortedEntries, {
  handle: '.drag-handle',
  animation: 150,
  onUpdate: (e) => {
    moveArrayElement(sortedEntries, e.oldIndex!, e.newIndex!)
    nextTick(() => emit('reorder', [...sortedEntries.value]))
  },
})

const total = computed(() =>
  props.entries.reduce((sum, e) => sum + e.blocks, 0)
)

const totalLabel = computed(() => {
  const t = total.value
  return Number.isInteger(t) ? String(t) : t.toFixed(1)
})
</script>

<template>
  <div
    class="flex flex-col rounded-lg border border-default bg-default"
    :class="isToday ? 'ring-2 ring-primary/50' : ''"
  >
    <div class="flex items-baseline justify-between gap-2 border-b border-default px-3 py-2">
      <div class="flex items-baseline gap-2">
        <span class="text-xs font-medium uppercase text-muted">{{ label }}</span>
        <span class="text-sm font-semibold">{{ dom }}</span>
      </div>
      <span
        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
        :class="total > 0 ? 'bg-primary/15 text-primary' : 'bg-elevated text-muted'"
      >
        {{ totalLabel }}
      </span>
    </div>

    <div ref="listEl" class="flex flex-col gap-1.5 p-2 min-h-24">
      <EntryChip
        v-for="e in sortedEntries"
        :key="e.id"
        :entry="e"
        :activity="activitiesById.get(e.activityId)"
        @toggle="emit('toggle', $event)"
        @remove="emit('remove', $event)"
      />
      <AddEntryMenu
        :date="date"
        :activities="activities"
        @created="emit('created')"
      />
    </div>
  </div>
</template>
