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
const newColor = ref('#22c55e')
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

const PALETTE = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#64748b']
</script>

<template>
  <UContainer class="py-8 max-w-3xl">
    <h1 class="text-2xl font-semibold mb-6">Activities</h1>

    <UCard class="mb-8">
      <template #header>
        <span class="font-medium">New activity</span>
      </template>
      <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="create">
        <UInput
          v-model="newName"
          placeholder="e.g. Thesis writing"
          class="flex-1"
          :disabled="creating"
        />
        <div class="flex gap-1 flex-wrap">
          <button
            v-for="c in PALETTE"
            :key="c"
            type="button"
            class="size-7 rounded-full border-2 transition"
            :class="newColor === c ? 'border-foreground scale-110' : 'border-transparent'"
            :style="{ background: c }"
            @click="newColor = c"
          />
        </div>
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
            PALETTE.map(c => ({ label: c, type: 'checkbox' as const, checked: a.color === c, onSelect: () => setColor(a, c) })),
            [{ label: 'Archive', icon: 'i-lucide-archive', color: 'error' as const, onSelect: () => archive(a) }]
          ]"
        >
          <UButton icon="i-lucide-more-horizontal" size="sm" color="neutral" variant="ghost" />
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
