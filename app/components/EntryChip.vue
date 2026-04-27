<script setup lang="ts">
import { onClickOutside, onLongPress } from '@vueuse/core'
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
const color = computed(() => props.activity?.color ?? '#64748b52')
const isHalf = computed(() => props.entry.blocks === 0.5)

const rootEl = ref<HTMLElement | null>(null)
const nameEl = ref<HTMLElement | null>(null)
const revealed = ref(false)
const menuOpen = ref(false)
let longPressed = false

onLongPress(nameEl, () => {
  revealed.value = true
  longPressed = true
  setTimeout(() => { longPressed = false }, 400)
}, { delay: 500, distanceThreshold: 10 })

onClickOutside(rootEl, () => {
  if (!menuOpen.value) revealed.value = false
})

function onToggleClick() {
  if (longPressed) return
  if (revealed.value) {
    revealed.value = false
    return
  }
  emit('toggle', props.entry)
}
</script>

<template>
  <div
    ref="rootEl"
    class="group flex items-center gap-2 rounded-md border border-default px-2 text-sm"
    :class="isHalf ? 'min-h-8 py-1' : 'min-h-16 py-2'"
    :style="{ background: color }"
  >
    <span class="drag-handle cursor-grab text-muted shrink-0">
      <UIcon name="i-lucide-grip-vertical" class="size-3.5" />
    </span>
    <button
      ref="nameEl"
      type="button"
      class="flex flex-1 items-center gap-2 text-left cursor-pointer min-w-0"
      :title="isHalf ? 'Switch to full block' : 'Switch to half block'"
      @click="onToggleClick"
    >
      <span
        class="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded px-1.5 text-xs font-semibold"
        :class="isHalf ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-primary/15 text-primary'"
      >
        {{ isHalf ? '½' : '1' }}
      </span>
      <span class="truncate">{{ name }}</span>
    </button>
    <EditEntryMenu
      :entry="entry"
      :activities="activities"
      :revealed="revealed"
      @updated="emit('updated')"
      @open-change="menuOpen = $event"
    />
    <button
      type="button"
      :class="[
        revealed ? 'inline-block' : 'hidden group-hover:inline-block',
        'text-muted hover:text-error cursor-pointer'
      ]"
      title="Delete"
      @click="emit('remove', entry)"
    >
      <UIcon name="i-lucide-x" class="size-3.5" />
    </button>
  </div>
</template>
