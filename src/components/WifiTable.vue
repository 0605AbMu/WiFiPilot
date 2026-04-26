<script setup>
import { computed } from 'vue'
import { useWifiStore } from '../store/wifi'

const store = useWifiStore()

function signalBars(quality) {
  if (quality >= 75) return 4
  if (quality >= 50) return 3
  if (quality >= 25) return 2
  if (quality > 0) return 1
  return 0
}

function bandLabel(freq) {
  return freq >= 3000 ? '5 GHz' : '2.4 GHz'
}

function bandColor(freq) {
  return freq >= 3000 ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50'
}

const sorted = computed(() =>
  [...store.networks].sort((a, b) => b.quality - a.quality)
)
</script>

<template>
  <div class="overflow-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-200">
          <th class="text-left py-2 px-3 text-slate-500 font-medium">Network</th>
          <th class="text-center py-2 px-3 text-slate-500 font-medium">Signal</th>
          <th class="text-center py-2 px-3 text-slate-500 font-medium">Channel</th>
          <th class="text-center py-2 px-3 text-slate-500 font-medium">Band</th>
          <th class="text-center py-2 px-3 text-slate-500 font-medium">Security</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="net in sorted"
          :key="net.bssid"
          class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
          :class="{ 'bg-blue-50/50': net.ssid === store.currentNetwork?.ssid }"
        >
          <td class="py-2.5 px-3">
            <div class="flex items-center gap-2">
              <span class="font-medium text-slate-800 truncate max-w-[160px]">
                {{ net.ssid || '(hidden)' }}
              </span>
              <span
                v-if="net.ssid === store.currentNetwork?.ssid"
                class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium"
              >you</span>
            </div>
            <div class="text-xs text-slate-400">{{ net.bssid }}</div>
          </td>

          <td class="py-2.5 px-3 text-center">
            <div class="flex items-end justify-center gap-0.5 h-5">
              <div
                v-for="i in 4"
                :key="i"
                class="w-1.5 rounded-sm transition-colors"
                :style="{ height: `${i * 5 + 3}px` }"
                :class="i <= signalBars(net.quality) ? 'bg-blue-500' : 'bg-slate-200'"
              />
            </div>
            <div class="text-xs text-slate-400 mt-0.5">{{ net.signal_level }} dBm</div>
          </td>

          <td class="py-2.5 px-3 text-center font-semibold text-slate-700">
            {{ net.channel || '—' }}
          </td>

          <td class="py-2.5 px-3 text-center">
            <span
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              :class="bandColor(net.frequency)"
            >
              {{ bandLabel(net.frequency) }}
            </span>
          </td>

          <td class="py-2.5 px-3 text-center text-xs text-slate-500">
            {{ net.security?.split(' ')[0] || 'Open' }}
          </td>
        </tr>

        <tr v-if="!sorted.length">
          <td colspan="5" class="py-8 text-center text-slate-400">
            No networks found — click Scan to start
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
