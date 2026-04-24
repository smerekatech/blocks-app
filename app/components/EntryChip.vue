<script setup lang="ts">
import type { Activity, Entry } from '~~/server/database/schema'

const props = defineProps<{
  entry: Entry
  activity: Activity | undefined
  activities: Activity[]
}>()

const emit = defineEmits<{
  toggle: [entry: Entry]
  remove: [entry: Entry]
  updated: []
}>()

const name = computed(() => props.activity?.name ?? props.entry.name ?? 'Unknown')
const color = computed(() => props.activity?.color ?? '#64748b')
const isHalf = computed(() => props.entry.blocks === 0.5)
</script>

<template>
  <div
    class="group flex items-center gap-2 rounded-md border border-default px-2 text-sm"
    :class="isHalf ? 'min-h-8 py-1' : 'min-h-16 py-2'"
    :style="{ background: color + '26' }"
  >
    <span class="drag-handle cursor-grab text-muted shrink-0">
      <UIcon name="i-lucide-grip-vertical" class="size-3.5" />
    </span>
    <button
      type="button"
      class="flex flex-1 items-center gap-2 text-left cursor-pointer min-w-0"
      :title="isHalf ? 'Switch to full block' : 'Switch to half block'"
      @click="emit('toggle', entry)"
    >
      <span class="truncate">{{ name }}</span>
      <span
        class="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-xs font-semibold"
        :class="isHalf ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-primary/15 text-primary'"
      >
        {{ isHalf ? '½' : '1' }}
      </span>
    </button>
    <EditEntryMenu
      :entry="entry"
      :activities="activities"
      @updated="emit('updated')"
    />
    <button
      type="button"
      class="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-error cursor-pointer"
      title="Delete"
      @click="emit('remove', entry)"
    >
      <UIcon name="i-lucide-x" class="size-3.5" />
    </button>
  </div>
</template>
