<script setup lang="ts">
import type { Activity, Entry } from '~~/server/database/schema'

const props = defineProps<{
  entry: Entry
  activities: Activity[]
  revealed?: boolean
}>()

const emit = defineEmits<{
  updated: []
  'open-change': [open: boolean]
}>()

const open = ref(false)
watch(open, (v) => emit('open-change', v))
const mode = ref<'list' | 'custom'>('list')
const customName = ref('')
const busy = ref(false)
const toast = useToast()

const active = computed(() => props.activities.filter(a => !a.archivedAt))

watch(open, (v) => {
  if (v) {
    mode.value = 'list'
    customName.value = props.entry.name ?? ''
  } else {
    customName.value = ''
  }
})

async function pickActivity(a: Activity) {
  if (busy.value) return
  if (props.entry.activityId === a.id) {
    open.value = false
    return
  }
  busy.value = true
  try {
    await $fetch(`/api/entries/${props.entry.id}`, {
      method: 'PATCH',
      body: { activityId: a.id }
    })
    emit('updated')
    open.value = false
  } catch (e: any) {
    toast.add({ title: 'Failed to update', description: e?.data?.message, color: 'error' })
  } finally {
    busy.value = false
  }
}

async function saveCustom() {
  const name = customName.value.trim()
  if (!name || busy.value) return
  if (props.entry.activityId == null && props.entry.name === name) {
    open.value = false
    return
  }
  busy.value = true
  try {
    await $fetch(`/api/entries/${props.entry.id}`, {
      method: 'PATCH',
      body: { name }
    })
    emit('updated')
    open.value = false
  } catch (e: any) {
    toast.add({ title: 'Failed to update', description: e?.data?.message, color: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'end', sideOffset: 4 }">
    <button
      type="button"
      :class="[
        revealed || open ? 'inline-block' : 'hidden group-hover:inline-block',
        'text-muted hover:text-primary cursor-pointer'
      ]"
      title="Edit"
      @click.stop
    >
      <UIcon name="i-lucide-pencil" class="size-3.5" />
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
                @click="pickActivity(a)"
              >
                <span class="size-2.5 rounded-full shrink-0" :style="{ background: a.color }" />
                <span class="truncate flex-1">{{ a.name }}</span>
                <UIcon
                  v-if="entry.activityId === a.id"
                  name="i-lucide-check"
                  class="size-3.5 text-primary shrink-0"
                />
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
            <UIcon name="i-lucide-pencil" class="size-3.5 text-primary" />
            <span>{{ entry.activityId == null ? 'Rename' : 'Custom…' }}</span>
          </button>
        </template>

        <template v-else>
          <form class="flex items-center gap-1 p-1" @submit.prevent="saveCustom">
            <UInput
              v-model="customName"
              placeholder="One-off block"
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
