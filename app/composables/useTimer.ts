interface TimerConfig {
  halfDurationMs: number
  halfBlockMinMs: number
}

interface TimerState {
  activityId: number | null
  name: string | null
  startedAt: Date
  startedDate: string
  half: 1 | 2
  firstEntryId: number | null
}

interface ApiTimer {
  activityId: number | null
  name: string | null
  startedAt: string
  startedDate: string
  half: number
  firstEntryId: number | null
  elapsedMs: number
}

interface ApiResponse {
  config: TimerConfig
  timer: ApiTimer | null
}

interface CompleteResult {
  state: 'awaiting-choice' | 'completed'
  firstEntryId: number | null
}

const config = ref<TimerConfig>({ halfDurationMs: 45 * 60 * 1000, halfBlockMinMs: 20 * 60 * 1000 })
const timer = ref<TimerState | null>(null)
const now = ref(Date.now())
let initialized = false
let completing = false

async function refresh() {
  const res = await $fetch<ApiResponse>('/api/timer')
  config.value = res.config
  timer.value = res.timer
    ? {
        activityId: res.timer.activityId,
        name: res.timer.name,
        startedAt: new Date(res.timer.startedAt),
        startedDate: res.timer.startedDate,
        half: res.timer.half === 2 ? 2 : 1,
        firstEntryId: res.timer.firstEntryId
      }
    : null
  maybeChimeOnRehydrate()
}

function chimeKey(firstEntryId: number, second: boolean) {
  return second ? `blocks:chime-played:second-${firstEntryId}` : `blocks:chime-played:${firstEntryId}`
}

function playChimeOnce(firstEntryId: number, second: boolean) {
  if (typeof window === 'undefined') return
  const key = chimeKey(firstEntryId, second)
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  const { user } = useUserSession()
  const sound = user.value?.chimeSound || 'chime-1'
  const audio = new Audio(`/${sound}.mp3`)
  audio.volume = 0.7
  audio.play().catch(() => {})
}

function maybeChimeOnRehydrate() {
  const t = timer.value
  if (!t) return
  if (t.half === 1 && t.firstEntryId != null) {
    playChimeOnce(t.firstEntryId, false)
  }
}

function emitEntriesChanged() {
  const nuxt = useNuxtApp()
  void nuxt.callHook('blocks:entries-changed')
}

async function start(arg: { activityId: number } | { name: string }) {
  await $fetch('/api/timer/start', {
    method: 'POST',
    body: { ...arg, startedDate: today() }
  })
  await refresh()
}

async function stop() {
  await $fetch('/api/timer/stop', { method: 'POST' })
  await refresh()
  emitEntriesChanged()
}

async function secondHalf() {
  await $fetch('/api/timer/second-half', { method: 'POST' })
  await refresh()
}

async function complete() {
  const result = await $fetch<CompleteResult>('/api/timer/complete', { method: 'POST' })
  if (result.firstEntryId != null) {
    playChimeOnce(result.firstEntryId, result.state === 'completed')
  }
  await refresh()
  emitEntriesChanged()
}

function ensureInitialized() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  void refresh()
  setInterval(() => {
    now.value = Date.now()
  }, 1000)
  window.addEventListener('focus', () => {
    void refresh()
  })
}

const elapsedMs = computed(() => {
  if (!timer.value) return 0
  return now.value - timer.value.startedAt.getTime()
})

const remainingMs = computed(() => Math.max(0, config.value.halfDurationMs - elapsedMs.value))

const mode = computed<'idle' | 'running' | 'awaiting-choice'>(() => {
  const t = timer.value
  if (!t) return 'idle'
  if (t.half === 1 && t.firstEntryId != null) return 'awaiting-choice'
  return 'running'
})

watch([elapsedMs, timer], () => {
  const t = timer.value
  if (!t || completing) return
  if (elapsedMs.value < config.value.halfDurationMs) return
  const needsComplete = (t.half === 1 && t.firstEntryId == null) || t.half === 2
  if (!needsComplete) return
  completing = true
  complete().finally(() => {
    completing = false
  })
})

export function useTimer() {
  ensureInitialized()
  return {
    config: readonly(config),
    timer: readonly(timer),
    elapsedMs: readonly(elapsedMs),
    remainingMs: readonly(remainingMs),
    mode: readonly(mode),
    start,
    stop,
    secondHalf,
    refresh
  }
}
