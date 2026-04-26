<script setup>
import { useWifiStore } from '../store/wifi'
import WifiTable from '../components/WifiTable.vue'
import ChannelChart from '../components/ChannelChart.vue'

const store = useWifiStore()

const widthLabels = { '20': '20 MHz', '40': '40 MHz', '80': '80 MHz', '160': '160 MHz' }
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">

    <!-- Left: Router panel -->
    <div class="space-y-4">

      <!-- Router connect card -->
      <div class="bg-white border border-slate-200 rounded-xl p-4">
        <h2 class="text-sm font-semibold text-slate-700 mb-3">Router</h2>

        <div class="flex gap-2 mb-3">
          <input
            v-model="store.routerIp"
            type="text"
            placeholder="192.168.1.1"
            class="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            class="px-3 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            @click="store.connectRouter"
          >Connect</button>
        </div>

        <!-- Router settings -->
        <template v-if="store.routerSettings && !store.routerSettings.manual">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span class="text-slate-500">Plugin</span>
              <span class="font-medium text-slate-700">{{ store.routerPlugin }}</span>
            </div>
            <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span class="text-slate-500">Current channel</span>
              <span class="font-semibold text-slate-800">{{ store.routerSettings.channel ?? '—' }}</span>
            </div>
            <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span class="text-slate-500">Width</span>
              <span class="font-medium text-slate-700">{{ widthLabels[store.routerSettings.channelWidth] ?? '—' }}</span>
            </div>
            <div class="flex justify-between items-center py-1.5">
              <span class="text-slate-500">Band</span>
              <span class="font-medium text-slate-700">{{ store.routerSettings.band ?? '—' }}</span>
            </div>
          </div>
        </template>

        <p v-else-if="store.routerSettings?.manual" class="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
          This router model requires manual configuration. Use your browser to open
          <span class="font-mono">{{ store.routerIp }}</span>.
        </p>

        <p v-else class="text-xs text-slate-400 mt-2">
          Not connected — enter IP and click Connect
        </p>
      </div>

      <!-- Optimization card -->
      <div v-if="store.routerSettings && !store.routerSettings.manual" class="bg-white border border-slate-200 rounded-xl p-4">
        <h2 class="text-sm font-semibold text-slate-700 mb-3">Optimization</h2>

        <div class="space-y-2 text-sm mb-4">
          <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span class="text-slate-500">Recommended channel</span>
            <span class="font-semibold text-green-600">{{ store.recommendedChannel }}</span>
          </div>
          <div class="flex justify-between items-center py-1.5">
            <span class="text-slate-500">Recommended width</span>
            <span class="font-medium text-green-600">20 MHz</span>
          </div>
        </div>

        <p class="text-xs text-slate-400 mb-3">
          Channel {{ store.recommendedChannel }} has the least overlap with
          {{ store.networks24.length }} nearby 2.4 GHz networks.
        </p>

        <button
          class="w-full py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          :disabled="store.optimizing || store.routerSettings?.channel === store.recommendedChannel"
          @click="store.optimize"
        >
          <svg v-if="store.optimizing" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <template v-if="store.optimizing">Applying...</template>
          <template v-else-if="store.routerSettings?.channel === store.recommendedChannel">
            Already optimal ✓
          </template>
          <template v-else>Apply optimal settings</template>
        </button>
      </div>

    </div>

    <!-- Right: Networks panel -->
    <div class="space-y-4">

      <!-- Scan + table card -->
      <div class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-sm font-semibold text-slate-700">Nearby Networks</h2>
            <p v-if="store.networks.length" class="text-xs text-slate-400">
              {{ store.networks.length }} found — {{ store.networks24.length }} on 2.4 GHz, {{ store.networks5.length }} on 5 GHz
            </p>
          </div>
          <button
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            :disabled="store.scanning"
            @click="store.scan"
          >
            <svg
              class="w-4 h-4"
              :class="{ 'animate-spin': store.scanning }"
              fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {{ store.scanning ? 'Scanning...' : 'Scan' }}
          </button>
        </div>
        <WifiTable />
      </div>

      <!-- Channel chart card -->
      <div class="bg-white border border-slate-200 rounded-xl p-4">
        <h2 class="text-sm font-semibold text-slate-700 mb-4">Channel Map</h2>
        <ChannelChart />
      </div>

    </div>
  </div>
</template>
