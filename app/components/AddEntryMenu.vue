<script setup lang="ts">
import type { Activity } from '~~/server/database/schema'

const props = defineProps<{
  date: string
  activities: Activity[]
}>()

const emit = defineEmits<{
  created: []
}>()

const open = ref(false)
const mode = ref<'list' | 'custom'>('list')
const customName = ref('')
const busy = ref(false)
const toast = useToast()

const active = computed(() => props.activities.filter(a => !a.archivedAt))

watch(open, (v) => {
  if (!v) {
    mode.value = 'list'
    customName.value = ''
  } else {
    mode.value = 'list'
  }
})

async function addExisting(a: Activity) {
  if (busy.value) return
  busy.value = true
  try {
    await $fetch('/api/entries', {
      method: 'POST',
      body: { activityId: a.id, date: props.date, blocks: 1 }
    })
    emit('created')
    open.value = false
  } catch (e: any) {
    toast.add({ title: 'Failed to add', description: e?.data?.message, color: 'error' })
  } finally {
    busy.value = false
  }
}

async function createCustom() {
  const name = customName.value.trim()
  if (!name || busy.value) return
  busy.value = true
  try {
    const a = await $fetch<Activity>('/api/activities', { method: 'POST', body: { name } })
    await $fetch('/api/entries', {
      method: 'POST',
      body: { activityId: a.id, date: props.date, blocks: 1 }
    })
    emit('created')
    open.value = false
  } catch (e: any) {
    toast.add({ title: 'Failed to create', description: e?.data?.message, color: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'center', sideOffset: 4 }">
    <button
      type="button"
      class="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-default py-1.5 text-xs text-muted hover:text-primary hover:border-primary/50 transition cursor-pointer"
    >
      <UIcon name="i-lucide-plus" class="size-3.5" />
      Add
    </button>

    <template #content>
      <div class="w-56 p-1">
        <template v-if="mode === 'list'">
          <ul class="max-h-60 overflow-auto">
            <li v-for="a in active" :key="a.id">
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-elevated cursor-pointer disabled:opacity-50"
                :disabled="busy"
                @click="addExisting(a)"
              >
                <span class="size-2.5 rounded-full shrink-0" :style="{ background: a.color }" />
                <span class="truncate">{{ a.name }}</span>
              </button>
            </li>
            <li v-if="active.length === 0" class="px-2 py-3 text-center text-xs text-muted">
              No activities yet.
            </li>
          </ul>
          <div class="my-1 border-t border-default" />
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-elevated cursor-pointer"
            @click="mode = 'custom'"
          >
            <UIcon name="i-lucide-plus" class="size-3.5 text-primary" />
            <span>Custom…</span>
          </button>
        </template>

        <template v-else>
          <form class="flex items-center gap-1 p-1" @submit.prevent="createCustom">
            <UInput
              v-model="customName"
              placeholder="New activity"
              :disabled="busy"
              autofocus
              size="sm"
              class="flex-1"
            />
            <UButton
              type="submit"
              icon="i-lucide-check"
              size="sm"
              :disabled="!customName.trim() || busy"
              :loading="busy"
            />
            <UButton
              type="button"
              icon="i-lucide-x"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="mode = 'list'"
            />
          </form>
        </template>
      </div>
    </template>
  </UPopover>
</template>
