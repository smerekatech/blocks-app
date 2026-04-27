<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
const { timer, mode, remainingMs } = useTimer()
const { data: activities } = useActivities()

const activityById = computed(() => {
  const m = new Map<number, { name: string }>()
  for (const a of activities.value) m.set(a.id, a)
  return m
})

const tabTitle = computed(() => {
  if (mode.value !== 'running' || !timer.value) return 'Blocks'
  const name = activityById.value.get(timer.value.activityId)?.name ?? 'Activity'
  const minutes = Math.ceil(remainingMs.value / 60000)
  return `${minutes} ${name} - Blocks`
})

useHead({
  title: () => tabTitle.value,
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'alternate icon', href: '/favicon.ico' }
  ],
  htmlAttrs: { lang: 'en' }
})

useSeoMeta({ description: 'Track your academic blocks' })

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <UApp>
    <UHeader
      :ui="{
        root: 'bg-(--bg-header)',
        container: 'w-full',
        center: 'flex flex-1 lg:flex-none'
      }"
    >
      <template #left>
        <NuxtLink
          to="/"
          class="items-center gap-2 text-[15px] font-semibold"
          :class="mode === 'running' ? 'hidden sm:flex' : 'flex'"
        >
          <BrandLogo :size="22" />
          Blocks
        </NuxtLink>
      </template>

      <TimerBar v-if="loggedIn" />

      <template #right>
        <template v-if="loggedIn">
          <div class="hidden sm:flex items-center gap-1">
            <UButton
              to="/"
              variant="ghost"
              color="neutral"
              size="sm"
            >
              Week
            </UButton>
            <UButton
              to="/stats"
              variant="ghost"
              color="neutral"
              size="sm"
            >
              Stats
            </UButton>
            <UButton
              to="/activities"
              variant="ghost"
              color="neutral"
              size="sm"
            >
              Activities
            </UButton>
          </div>
          <UDropdownMenu
            :items="[
              [{ label: user?.email, type: 'label' }],
              [{ label: 'Log out', icon: 'i-lucide-log-out', onSelect: logout }]
            ]"
          >
            <UAvatar
              :src="user?.avatarUrl ?? undefined"
              :alt="user?.name"
              size="sm"
              class="cursor-pointer"
            />
          </UDropdownMenu>
        </template>
        <UColorModeButton />
      </template>

      <template #body>
        <div
          v-if="loggedIn"
          class="flex flex-col gap-1 p-4"
        >
          <UButton
            to="/"
            variant="ghost"
            color="neutral"
            block
          >
            Week
          </UButton>
          <UButton
            to="/stats"
            variant="ghost"
            color="neutral"
            block
          >
            Stats
          </UButton>
          <UButton
            to="/activities"
            variant="ghost"
            color="neutral"
            block
          >
            Activities
          </UButton>
        </div>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
