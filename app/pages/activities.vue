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
  '#6366f152', '#8b5cf652', '#a855f752', '#ec489952',
  '#f43f5e52', '#ef444452', '#f9731652', '#f59e0b52',
  '#eab30852', '#84cc1652', '#22c55e52', '#10b98152',
  '#14b8a652', '#06b6d452', '#0ea5e952', '#3b82f652',
  '#64748b52', '#78716c52'
]

function toInputColor(color: string) {
  return color.length === 9 ? color.slice(0, 7) : color
}

function fromInputColor(color: string) {
  return color + '52'
}
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
          <template #content>
            <div class="p-2 flex flex-wrap gap-1 w-44">
              <button
                v-for="c in PALETTE"
                :key="c"
                type="button"
                class="size-7 rounded-full border-2 transition hover:scale-110"
                :class="newColor === c ? 'border-foreground scale-110' : 'border-transparent'"
                :style="{ background: c }"
                @click="newColor = c"
              />
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
                  @input="newColor = fromInputColor(($event.target as HTMLInputElement).value)"
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
      <li v-for="a in active" :key="a.id" class="p-3 flex items-center gap-3">
        <span class="size-4 rounded-full shrink-0" :style="{ background: a.color }" />
        <span class="flex-1 font-medium">{{ a.name }}</span>
        <UDropdownMenu
          :items="[
            [{ label: 'Rename', icon: 'i-lucide-pencil', onSelect: () => rename(a) }],
            [
              ...PALETTE.map(c => ({ slot: 'color' as const, hex: c, checked: a.color === c, onSelect: () => setColor(a, c) })),
              { slot: 'customColor' as const }
            ],
            [{ label: 'Archive', icon: 'i-lucide-archive', color: 'error' as const, onSelect: () => archive(a) }]
          ]"
        >
          <UButton icon="i-lucide-more-horizontal" size="sm" color="neutral" variant="ghost" />
          <template #color="{ item }">
            <span
              class="size-4 rounded-full border-2 shrink-0"
              :class="item.checked ? 'border-foreground' : 'border-transparent'"
              :style="{ background: item.hex }"
            />
          </template>
          <template #customColor>
            <label class="flex items-center gap-2 w-full cursor-pointer">
              <span
                class="size-4 rounded-full border-2 shrink-0 flex items-center justify-center overflow-hidden relative"
                :class="!PALETTE.includes(a.color) ? 'border-foreground' : 'border-dashed border-muted'"
                :style="!PALETTE.includes(a.color) ? { background: a.color } : {}"
              >
                <input
                  type="color"
                  class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  :value="toInputColor(a.color)"
                  @change="setColor(a, fromInputColor(($event.target as HTMLInputElement).value))"
                />
              </span>
              <span class="text-sm">Custom…</span>
            </label>
          </template>
        </UDropdownMenu>
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
