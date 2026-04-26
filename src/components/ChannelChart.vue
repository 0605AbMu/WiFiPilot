<script setup>
import { computed } from 'vue'
import { useWifiStore } from '../store/wifi'

const store = useWifiStore()

// 2.4GHz channels 1–13
const CHANNELS = Array.from({ length: 13 }, (_, i) => i + 1)
const BAR_H = 120

function barHeight(ch) {
  const count = store.channelMap[ch]?.length || 0
  if (!count) return 4
  return Math.min(4 + count * 28, BAR_H)
}

function barColor(ch) {
  const count = store.channelMap[ch]?.length || 0
  if (ch === store.routerSettings?.channel) return '#3b82f6'
  if (ch === store.recommendedChannel) return '#22c55e'
  if (count === 0) return '#e2e8f0'
  if (count <= 2) return '#fde68a'
  return '#fca5a5'
}

function tooltip(ch) {
  const nets = store.channelMap[ch] || []
  if (!nets.length) return `Ch ${ch}: empty`
  return `Ch ${ch}: ${nets.map(n => n.ssid || 'hidden').join(', ')}`
}

const currentCh = computed(() => store.routerSettings?.channel)
const recCh = computed(() => store.recommendedChannel)
</script>

<template>
  <div class="select-none">
    <!-- Legend -->
    <div class="flex gap-4 mb-3 text-xs text-slate-500">
      <span class="flex items-center gap-1.5">
        <span class="inline-block w-3 h-3 rounded-sm bg-blue-500"></span> Your router
      </span>
      <span class="flex items-center gap-1.5">
        <span class="inline-block w-3 h-3 rounded-sm bg-green-500"></span> Recommended
      </span>
      <span class="flex items-center gap-1.5">
        <span class="inline-block w-3 h-3 rounded-sm bg-amber-200"></span> Congested
      </span>
    </div>

    <!-- Chart -->
    <div class="flex items-end gap-1" :style="{ height: BAR_H + 'px' }">
      <div
        v-for="ch in CHANNELS"
        :key="ch"
        class="relative flex-1 flex flex-col items-center justify-end group"
        :style="{ height: BAR_H + 'px' }"
      >
        <!-- Tooltip -->
        <div
          class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap
                 bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none
                 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          {{ tooltip(ch) }}
        </div>

        <!-- Bar -->
        <div
          class="w-full rounded-t-sm transition-all duration-300"
          :style="{ height: barHeight(ch) + 'px', backgroundColor: barColor(ch) }"
          :class="{
            'ring-2 ring-blue-500 ring-offset-1': ch === currentCh,
            'ring-2 ring-green-500 ring-offset-1 ring-dashed': ch === recCh && ch !== currentCh
          }"
        />

        <!-- Label -->
        <div
          class="text-center mt-1 text-xs font-medium transition-colors"
          :class="{
            'text-blue-600': ch === currentCh,
            'text-green-600': ch === recCh && ch !== currentCh,
            'text-slate-400': ch !== currentCh && ch !== recCh
          }"
        >{{ ch }}</div>
      </div>
    </div>

    <div class="mt-2 text-xs text-slate-400 text-center">2.4 GHz channels</div>
  </div>
</template>
