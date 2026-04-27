<script setup lang="ts">
import type { Activity } from '~~/server/database/schema'

const toast = useToast()
const { data: activities, refresh } = await useAsyncData<Activity[]>(
  'activities-all',
  () => $fetch('/api/activities', { query: { includeArchived: '1' } }),
  { default: () => [], server: false }
)

const active = computed(() => activities.value.filter(a => !a.archivedAt))
const archived = computed(() => activities.value.filter(a => a.archivedAt))

const newName = ref('')
const newColor = ref('#64748b26')
const newColorPickerOpen = ref(false)
const openColorPickerId = ref<number | null>(null)
const creating = ref(false)

async function create() {
  const name = newName.value.trim()
  if (!name) return
  creating.value = true
  try {
    await $fetch('/api/activities', {
      method: 'POST',
      body: { name, color: newColor.value }
    })
    newName.value = ''
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Failed to create', description: e?.data?.message, color: 'error' })
  } finally {
    creating.value = false
  }
}

async function rename(a: Activity) {
  const name = prompt('Rename activity', a.name)?.trim()
  if (!name || name === a.name) return
  await $fetch(`/api/activities/${a.id}`, { method: 'PATCH', body: { name } })
  await refresh()
}

async function setColor(a: Activity, color: string) {
  await $fetch(`/api/activities/${a.id}`, { method: 'PATCH', body: { color } })
  await refresh()
}

async function archive(a: Activity) {
  await $fetch(`/api/activities/${a.id}`, { method: 'DELETE' })
  await refresh()
}

async function unarchive(a: Activity) {
  await $fetch(`/api/activities/${a.id}`, { method: 'PATCH', body: { archived: false } })
  await refresh()
}

const PALETTE = [
  '#6366f178', '#8b5cf678', '#a855f778', '#ec489978',
  '#f43f5e78', '#ef444478', '#f9731678', '#f59e0b78',
  '#eab30878', '#84cc1678', '#22c55e78', '#10b98178',
  '#14b8a678', '#06b6d478', '#0ea5e978', '#3b82f678',
  '#64748b78', '#78716c78'
]

function toInputColor(color: string) {
  return color.length === 9 ? color.slice(0, 7) : color
}

function fromInputColor(color: string) {
  return color + '78'
}

const usedColors = computed(() => new Set(active.value.map(a => a.color)))
</script>

<template>
  <UContainer class="py-8 max-w-3xl">
    <h1 class="text-2xl font-semibold mb-6">Activities</h1>

    <UCard class="mb-8">
      <template #header>
        <span class="font-medium">New activity</span>
      </template>
      <form class="flex gap-3" @submit.prevent="create">
        <UPopover>
          <button
            type="button"
            class="size-9 shrink-0 rounded-full border-2 transition hover:scale-110"
            :style="{ background: newColor }"
            title="Pick color"
          />
          <template #content="{ close }">
            <div class="p-2 flex flex-wrap gap-1 w-44">
              <button
                v-for="c in PALETTE"
                :key="c"
                type="button"
                class="relative size-7 rounded-full border-2 transition hover:scale-110"
                :class="newColor === c ? 'border-foreground scale-110' : 'border-transparent'"
                :style="{ background: c }"
                @click="newColor = c; close()"
              >
                <span v-if="usedColors.has(c)" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span class="size-1.5 rounded-full bg-white/60" />
                </span>
              </button>
              <label
                class="relative size-7 rounded-full border-2 transition cursor-pointer flex items-center justify-center overflow-hidden hover:scale-110"
                :class="!PALETTE.includes(newColor) ? 'border-foreground scale-110' : 'border-dashed border-muted'"
                :style="!PALETTE.includes(newColor) ? { background: newColor } : {}"
                title="Custom color"
              >
                <UIcon v-if="PALETTE.includes(newColor)" name="i-lucide-pipette" class="size-3 text-muted pointer-events-none" />
                <input
                  type="color"
                  class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  :value="toInputColor(newColor)"
                  @change="newColor = fromInputColor(($event.target as HTMLInputElement).value); close()"
                />
              </label>
            </div>
          </template>
        </UPopover>
        <UInput
          v-model="newName"
          placeholder="e.g. Thesis writing"
          class="flex-1"
          :disabled="creating"
        />
        <UButton type="submit" :loading="creating" :disabled="!newName.trim()">Add</UButton>
      </form>
    </UCard>

    <h2 class="text-sm font-medium text-muted mb-2">Active ({{ active.length }})</h2>
    <ul class="divide-y divide-default rounded-lg border border-default mb-8">
      <li v-if="active.length === 0" class="p-4 text-sm text-muted">No active activities.</li>
      <li v-for="a in active" :key="a.id" class="group relative p-3 flex items-center gap-3">
        <UPopover>
          <button
            type="button"
            class="size-5 rounded-full shrink-0 transition hover:scale-110 cursor-pointer"
            :style="{ background: a.color }"
          />
          <template #content="{ close }">
            <div class="p-2 flex flex-wrap gap-1 w-44">
              <button
                v-for="c in PALETTE"
                :key="c"
                type="button"
                class="relative size-7 rounded-full border-2 transition hover:scale-110"
                :class="a.color === c ? 'border-foreground scale-110' : 'border-transparent'"
                :style="{ background: c }"
                @click="setColor(a, c); close()"
              >
                <span v-if="usedColors.has(c) && c !== a.color" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span class="size-1.5 rounded-full bg-white/60" />
                </span>
              </button>
              <label
                class="relative size-7 rounded-full border-2 transition cursor-pointer flex items-center justify-center overflow-hidden hover:scale-110"
                :class="!PALETTE.includes(a.color) ? 'border-foreground scale-110' : 'border-dashed border-muted'"
                :style="!PALETTE.includes(a.color) ? { background: a.color } : {}"
                title="Custom color"
              >
                <UIcon v-if="PALETTE.includes(a.color)" name="i-lucide-pipette" class="size-3 text-muted pointer-events-none" />
                <input
                  type="color"
                  class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  :value="toInputColor(a.color)"
                  @change="setColor(a, fromInputColor(($event.target as HTMLInputElement).value)); close()"
                />
              </label>
            </div>
          </template>
        </UPopover>

        <span class="flex-1 font-medium flex items-center gap-1.5 min-w-0">
          <span class="truncate">{{ a.name }}</span>
          <button
            class="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity text-muted hover:text-foreground cursor-pointer"
            @click="rename(a)"
          >
            <UIcon name="i-lucide-pencil" class="size-3.5" />
          </button>
        </span>

        <button
          class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-error cursor-pointer"
          @click="archive(a)"
        >
          <UIcon name="i-lucide-archive" class="size-3.5" />
        </button>
      </li>
    </ul>

    <details v-if="archived.length" class="mb-4">
      <summary class="cursor-pointer text-sm font-medium text-muted mb-2">
        Archived ({{ archived.length }})
      </summary>
      <ul class="divide-y divide-default rounded-lg border border-default mt-2">
        <li v-for="a in archived" :key="a.id" class="p-3 flex items-center gap-3 opacity-70">
          <span class="size-4 rounded-full shrink-0" :style="{ background: a.color }" />
          <span class="flex-1 font-medium line-through">{{ a.name }}</span>
          <UButton size="sm" color="neutral" variant="outline" @click="unarchive(a)">Restore</UButton>
        </li>
      </ul>
    </details>
  </UContainer>
</template>
