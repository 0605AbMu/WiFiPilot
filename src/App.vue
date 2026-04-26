<script setup>
import { useWifiStore } from './store/wifi'
import MainView from './views/MainView.vue'
import RouterLogin from './components/RouterLogin.vue'
import StatusBadge from './components/StatusBadge.vue'

const store = useWifiStore()
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans flex flex-col">

    <!-- Header -->
    <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0"
            :class="{ 'pt-8': true }">
      <div class="flex items-center gap-2.5">
        <!-- WiFi icon -->
        <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M1.41 8.59C5.13 4.87 10.26 3 12 3c1.74 0 6.87 1.87 10.59 5.59l-1.41 1.41C17.93 6.65 13.6 5 12 5s-5.93 1.65-9.18 4.99L1.41 8.59zm4.24 4.24C7.24 11.25 9.53 10 12 10s4.76 1.25 6.35 2.83l-1.41 1.41A6.49 6.49 0 0012 12a6.49 6.49 0 00-4.94 2.24l-1.41-1.41zm4.24 4.24A2.5 2.5 0 0112 16a2.5 2.5 0 012.31 1.07l-1.41 1.41A.5.5 0 0012 18a.5.5 0 00-.5.5L12 19l-.5.5-.93-1L12 17z"/>
        </svg>
        <span class="text-base font-semibold text-slate-800">WiFiPilot</span>
      </div>

      <div class="flex items-center gap-3">
        <StatusBadge v-if="store.toast" :toast="store.toast" @dismiss="store.toast = null" />
        <div v-if="store.currentNetwork" class="text-xs text-slate-500">
          Connected to
          <span class="font-medium text-slate-700">{{ store.currentNetwork.ssid }}</span>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 max-w-6xl w-full mx-auto px-6 py-5">
      <MainView />
    </main>

    <!-- Router login modal -->
    <RouterLogin v-if="store.loginRequired" />
  </div>
</template>
