<script setup lang="ts">
import type { Activity } from '~~/server/database/schema'
import { CHIME_SOUNDS, type ChimeSound } from '~~/shared/chime'
import { PALETTE, resolveSwatch, type SwatchId } from '~~/shared/palette'

const toast = useToast()
const { user, setChime } = useUser()

async function pickChime(value: ChimeSound) {
  try {
    await setChime(value)
  } catch (e) {
    const msg = (e as { data?: { message?: string } })?.data?.message
    toast.add({ title: 'Failed to save', description: msg, color: 'error' })
  }
}

function previewChime(value: ChimeSound) {
  const audio = new Audio(`/${value}.mp3`)
  audio.volume = 0.7
  audio.play().catch(() => {})
}

const { data: activities, refresh } = await useAsyncData<Activity[]>(
  'activities-all',
  () => $fetch('/api/activities', { query: { includeArchived: '1' } }),
  { default: () => [], server: false }
)
useRefreshOnFocus(refresh)

const active = computed(() => activities.value.filter(a => !a.archivedAt))
const archived = computed(() => activities.value.filter(a => a.archivedAt))

const newName = ref('')
const newColor = ref<SwatchId>('emerald')
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
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message
    toast.add({ title: 'Failed to create', description: msg, color: 'error' })
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

async function setColor(a: Activity, color: SwatchId) {
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

const isDark = useIsDark()
const newSwatchPreview = computed(() => pickSwatch(newColor.value, isDark.value))
const swatchFor = (color: string | null | undefined) => pickSwatch(color, isDark.value)

const usedColorMap = computed(() => {
  const map = new Map<SwatchId, Activity[]>()
  for (const a of active.value) {
    const id = resolveSwatch(a.color).id
    const list = map.get(id)
    if (list) list.push(a)
    else map.set(id, [a])
  }
  return map
})

function colorUsage(color: SwatchId, excludeId?: number): Activity[] {
  const list = usedColorMap.value.get(color) ?? []
  return excludeId == null ? list : list.filter(a => a.id !== excludeId)
}

function colorTitle(name: string, color: SwatchId, excludeId?: number): string {
  const usage = colorUsage(color, excludeId)
  return usage.length ? `${name} — used by ${usage.map(a => a.name).join(', ')}` : name
}
</script>

<template>
  <UContainer class="py-8 max-w-3xl">
    <h1 class="text-[26px] font-semibold mb-6">
      Activities
    </h1>

    <UCard class="mb-6">
      <template #header>
        <span class="font-medium">Timer chime</span>
      </template>
      <div class="grid grid-cols-3 gap-2">
        <label
          v-for="c in CHIME_SOUNDS"
          :key="c"
          class="flex items-center justify-between gap-2 rounded-md border p-2 cursor-pointer transition"
          :class="user?.chimeSound === c ? 'border-primary bg-primary/5' : 'border-default hover:border-muted'"
        >
          <input
            type="radio"
            class="sr-only"
            :checked="user?.chimeSound === c"
            @change="pickChime(c)"
          >
          <span class="text-sm font-medium capitalize">{{ c.replace('-', ' ') }}</span>
          <UButton
            icon="i-lucide-play"
            size="xs"
            variant="ghost"
            color="neutral"
            aria-label="Preview"
            @click.prevent="previewChime(c)"
          />
        </label>
      </div>
    </UCard>

    <UCard class="mb-8">
      <template #header>
        <span class="text-[14px] font-semibold">New activity</span>
      </template>
      <form
        class="flex items-center gap-3"
        @submit.prevent="create"
      >
        <span
          class="size-6 rounded-full shrink-0"
          :style="{ background: newSwatchPreview.dot }"
        />
        <UInput
          v-model="newName"
          placeholder="e.g. Thesis writing"
          class="flex-1"
          :disabled="creating"
        />
        <UButton
          type="submit"
          :loading="creating"
          :disabled="!newName.trim()"
        >
          Add
        </UButton>
      </form>
      <div class="mt-3 grid grid-cols-12 gap-1.5">
        <button
          v-for="p in PALETTE"
          :key="p.id"
          type="button"
          class="aspect-square rounded-md cursor-pointer transition box-border relative flex items-center justify-center"
          :style="{
            background: swatchFor(p.id).dot,
            outline: newColor === p.id ? '2px solid currentColor' : '2px solid transparent'
          }"
          :title="colorTitle(p.name, p.id)"
          @click="newColor = p.id"
        >
          <span
            v-if="colorUsage(p.id).length"
            class="size-2 rounded-full"
            :style="{ background: swatchFor(p.id).text }"
          />
        </button>
      </div>
    </UCard>

    <h2 class="text-[11px] uppercase tracking-[0.06em] font-semibold text-muted mb-2">
      Active ({{ active.length }})
    </h2>
    <UCard class="mb-8">
      <ul class="divide-y divide-default">
        <li
          v-if="active.length === 0"
          class="p-2 text-sm text-muted"
        >
          No active activities.
        </li>
        <li
          v-for="a in active"
          :key="a.id"
          class="group relative py-3 flex items-center gap-3"
        >
          <UPopover>
            <button
              type="button"
              class="size-3 rounded-full shrink-0 transition hover:scale-110 cursor-pointer"
              :style="{ background: swatchFor(a.color).dot }"
            />
            <template #content="{ close }">
              <div class="p-2 grid grid-cols-6 gap-1.5 w-44">
                <button
                  v-for="p in PALETTE"
                  :key="p.id"
                  type="button"
                  class="aspect-square rounded-md cursor-pointer transition relative flex items-center justify-center"
                  :style="{
                    background: swatchFor(p.id).dot,
                    outline: a.color === p.id ? '2px solid currentColor' : '2px solid transparent'
                  }"
                  :title="colorTitle(p.name, p.id, a.id)"
                  @click="setColor(a, p.id); close()"
                >
                  <span
                    v-if="colorUsage(p.id, a.id).length"
                    class="size-1.5 rounded-full"
                    :style="{ background: swatchFor(p.id).text }"
                  />
                </button>
              </div>
            </template>
          </UPopover>

          <span class="flex-1 text-[13px] flex items-center gap-1.5 min-w-0">
            <span class="truncate">{{ a.name }}</span>
            <button
              class="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity text-muted hover:text-foreground cursor-pointer"
              @click="rename(a)"
            >
              <UIcon
                name="i-lucide-pencil"
                class="size-3.5"
              />
            </button>
          </span>

          <button
            class="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-error cursor-pointer"
            title="Archive"
            @click="archive(a)"
          >
            <UIcon
              name="i-lucide-archive"
              class="size-3.5"
            />
          </button>
        </li>
      </ul>
    </UCard>

    <details
      v-if="archived.length"
      class="mb-4"
    >
      <summary class="cursor-pointer text-[11px] uppercase tracking-[0.06em] font-semibold text-muted mb-2">
        Archived ({{ archived.length }})
      </summary>
      <UCard class="mt-2">
        <ul class="divide-y divide-default">
          <li
            v-for="a in archived"
            :key="a.id"
            class="py-3 flex items-center gap-3 opacity-70"
          >
            <span
              class="size-3 rounded-full shrink-0"
              :style="{ background: swatchFor(a.color).dot }"
            />
            <span class="flex-1 text-[13px] line-through">{{ a.name }}</span>
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              @click="unarchive(a)"
            >
              Restore
            </UButton>
          </li>
        </ul>
      </UCard>
    </details>
  </UContainer>
</template>
