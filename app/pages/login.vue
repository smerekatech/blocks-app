<script setup lang="ts">
const route = useRoute()
const error = computed(() => route.query.error as string | undefined)
</script>

<template>
  <UContainer class="flex min-h-[70vh] items-center justify-center">
    <UCard class="w-full max-w-md">
      <div class="flex flex-col items-center gap-6 py-6 text-center">
        <div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <UIcon name="i-lucide-blocks" class="size-7 text-primary" />
        </div>
        <div>
          <h1 class="text-xl font-semibold">Blocks</h1>
          <p class="mt-1 text-sm text-muted">Track your academic blocks.</p>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          title="Sign-in failed"
          description="Please try again."
          class="w-full"
        />

        <UButton
          to="/auth/google"
          external
          size="lg"
          color="neutral"
          variant="outline"
          class="w-full justify-center"
          icon="i-simple-icons-google"
        >
          Continue with Google
        </UButton>
      </div>
    </UCard>
  </UContainer>
</template>
