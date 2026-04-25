<script setup lang="ts">
import type { Activity, Entry } from '~~/server/database/schema'

const props = defineProps<{
  date: string
  dom: number
  inMonth: boolean
  isToday: boolean
  entries: Entry[]
  activitiesById: Map<number, Activity>
}>()

const emit = defineEmits<{
  select: [date: string]
}>()

const total = computed(() => props.entries.reduce((s, e) => s + e.blocks, 0))
const totalLabel = computed(() => Number.isInteger(total.value) ? String(total.value) : total.value.toFixed(1))

const swatches = computed(() => {
  const seen = new Map<number, string>()
  for (const e of props.entries) {
    if (e.activityId == null) continue
    if (seen.has(e.activityId)) continue
    const a = props.activitiesById.get(e.activityId)
    if (a?.color) seen.set(e.activityId, a.color)
    if (seen.size >= 6) break
  }
  return Array.from(seen.values())
})
</script>

<template>
  <button
    type="button"
    class="flex flex-col items-stretch gap-1 rounded-md border border-default p-1.5 text-left transition hover:bg-elevated min-h-16 sm:min-h-20"
    :class="[
      inMonth ? 'bg-default' : 'bg-elevated/40 text-muted',
      isToday ? 'ring-2 ring-primary/50' : ''
    ]"
    @click="emit('select', date)"
  >
    <div class="flex items-baseline justify-between gap-1">
      <span class="text-xs font-semibold tabular-nums">{{ dom }}</span>
      <span
        v-if="total > 0"
        class="rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary tabular-nums"
      >
        {{ totalLabel }}
      </span>
    </div>
    <div v-if="swatches.length" class="flex flex-wrap gap-0.5">
      <span
        v-for="(c, i) in swatches"
        :key="i"
        class="h-1.5 w-1.5 rounded-full"
        :style="{ backgroundColor: c }"
      />
    </div>
  </button>
</template>
