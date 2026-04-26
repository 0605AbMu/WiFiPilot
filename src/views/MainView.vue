<script setup>
import { useWifiStore } from '../store/wifi'
import WifiTable from '../components/WifiTable.vue'
import ChannelChart from '../components/ChannelChart.vue'

const store = useWifiStore()
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">

    <!-- Left: Router panel -->
    <div class="space-y-4">

      <!-- Router connect card -->
      <div class="bg-white border border-slate-200 rounded-xl p-4">
        <!-- Header with status badge -->
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-slate-700">Router</h2>
          <span v-if="store.routerSettings" class="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
            <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            Ulangan
          </span>
          <span v-else-if="store.connecting && !store.loginRequired" class="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            <svg class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Ulanmoqda
          </span>
        </div>

        <!-- IP input + Connect button -->
        <div class="flex gap-2 mb-3">
          <input
            v-model="store.routerIp"
            type="text"
            placeholder="192.168.0.1"
            :disabled="store.connecting"
            class="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            class="px-3 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap disabled:opacity-50"
            :disabled="store.connecting"
            @click="store.connectRouter"
          >{{ store.routerSettings ? 'Qayta' : 'Ulash' }}</button>
        </div>

        <!-- Reading settings loading state -->
        <div v-if="store.connecting && !store.loginRequired" class="flex items-center gap-2 text-xs text-slate-500 py-1">
          <svg class="animate-spin w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          WiFi sozlamalari o'qilmoqda...
        </div>

        <!-- Connected: show current settings -->
        <template v-else-if="store.routerSettings && !store.routerSettings.manual">
          <div class="space-y-1 text-sm">
            <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span class="text-slate-500">Plugin</span>
              <span class="font-medium text-slate-700">{{ store.routerPlugin }}</span>
            </div>
            <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span class="text-slate-500">Joriy kanal</span>
              <span class="font-semibold text-slate-800">{{ store.routerSettings.channel ?? '—' }}</span>
            </div>
            <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span class="text-slate-500">Kanal kenglik</span>
              <span class="font-medium text-slate-700">{{ store.routerSettings.channelWidth ?? '—' }} MHz</span>
            </div>
            <div class="flex justify-between items-center py-1.5">
              <span class="text-slate-500">Band</span>
              <span class="font-medium text-slate-700">{{ store.routerSettings.band ?? '—' }}</span>
            </div>
          </div>
        </template>

        <p v-else-if="store.routerSettings?.manual" class="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
          Bu router modeli qo'lda sozlashni talab qiladi.
          <span class="font-mono">{{ store.routerIp }}</span> ni brauzerda oching.
        </p>

        <p v-else class="text-xs text-slate-400 mt-1">
          IP kiriting va "Ulash" tugmasini bosing
        </p>
      </div>

      <!-- Optimize card — only shown when connected -->
      <div v-if="store.routerSettings && !store.routerSettings.manual" class="bg-white border border-slate-200 rounded-xl p-4">
        <h2 class="text-sm font-semibold text-slate-700 mb-3">Optimizatsiya</h2>

        <div class="space-y-1 text-sm mb-4">
          <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span class="text-slate-500">Tavsiya etilgan kanal</span>
            <span class="font-semibold text-green-600">{{ store.recommendedChannel }}</span>
          </div>
          <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
            <span class="text-slate-500">Tavsiya etilgan kenglik</span>
            <span class="font-medium text-green-600">20 MHz</span>
          </div>
          <div class="flex justify-between items-center py-1.5">
            <span class="text-slate-500">Yaqin 2.4GHz tarmoqlar</span>
            <span class="font-medium text-slate-700">{{ store.networks24.length }} ta</span>
          </div>
        </div>

        <p class="text-xs text-slate-400 mb-4">
          Kanal {{ store.recommendedChannel }} — {{ store.networks24.length }} ta yaqin tarmoq orasida eng kam interference.
        </p>

        <!-- Already optimal -->
        <div
          v-if="store.routerSettings.channel === store.recommendedChannel && store.routerSettings.channelWidth === '20'"
          class="w-full py-2.5 text-sm font-medium text-center text-green-700 bg-green-50 border border-green-200 rounded-lg"
        >
          Allaqachon optimal ✓
        </div>

        <!-- Apply button -->
        <button
          v-else
          class="w-full py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          :disabled="store.optimizing"
          @click="store.optimize"
        >
          <svg v-if="store.optimizing" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          {{ store.optimizing ? 'Qo\'llanilmoqda...' : `Kanal ${store.recommendedChannel} ni qo'llash` }}
        </button>
      </div>

    </div>

    <!-- Right: Networks panel -->
    <div class="space-y-4">

      <!-- Scan + table card -->
      <div class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-sm font-semibold text-slate-700">Yaqin tarmoqlar</h2>
            <p v-if="store.networks.length" class="text-xs text-slate-400">
              {{ store.networks.length }} ta — {{ store.networks24.length }} ta 2.4GHz, {{ store.networks5.length }} ta 5GHz
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
            {{ store.scanning ? 'Skanlanmoqda...' : 'Skanerlash' }}
          </button>
        </div>
        <WifiTable />
      </div>

      <!-- Channel chart card -->
      <div class="bg-white border border-slate-200 rounded-xl p-4">
        <h2 class="text-sm font-semibold text-slate-700 mb-4">Kanal xaritasi</h2>
        <ChannelChart />
      </div>

    </div>
  </div>
</template>
