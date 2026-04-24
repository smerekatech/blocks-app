<script setup lang="ts">
const props = defineProps<{
  bars: Array<{ label: string, value: number, sub?: string, highlight?: boolean }>
}>()

const max = computed(() => {
  const m = Math.max(1, ...props.bars.map(b => b.value))
  return Math.ceil(m)
})

function heightPct(v: number): number {
  return max.value === 0 ? 0 : Math.max(v > 0 ? 4 : 0, (v / max.value) * 100)
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}
</script>

<template>
  <div class="flex gap-2 h-56 w-full">
    <div
      v-for="(b, i) in bars"
      :key="i"
      class="flex-1 flex flex-col items-center gap-1 min-w-0"
    >
      <div class="text-xs tabular-nums font-medium" :class="b.value > 0 ? 'text-default' : 'text-muted'">
        {{ b.value > 0 ? fmt(b.value) : '' }}
      </div>
      <div class="w-full flex-1 flex items-end">
        <div
          class="w-full rounded-t-md transition-all"
          :class="b.highlight ? 'bg-primary' : 'bg-primary/60'"
          :style="{ height: heightPct(b.value) + '%' }"
        />
      </div>
      <div class="text-xs text-muted truncate w-full text-center">{{ b.label }}</div>
      <div v-if="b.sub" class="text-[10px] text-muted/70 truncate w-full text-center">{{ b.sub }}</div>
    </div>
  </div>
</template>
