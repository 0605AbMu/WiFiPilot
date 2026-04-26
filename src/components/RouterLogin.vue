<script setup>
import { ref, computed } from 'vue'
import { useWifiStore } from '../store/wifi'

const store = useWifiStore()
const username = ref('admin')
const password = ref('')
const error = ref('')

// TP-Link modern routers only require password — no username field shown
const passwordOnly = computed(() => store.routerPlugin === 'TP-Link')

async function submit() {
  error.value = ''
  try {
    await store.loginRouter(username.value, password.value)
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <!-- Backdrop -->
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
      <h2 class="text-lg font-semibold text-slate-800 mb-1">Router Login</h2>
      <p class="text-sm text-slate-500 mb-4">
        Connecting to
        <span class="font-mono font-medium text-slate-700">{{ store.routerIp }}</span>
        <span v-if="store.routerPlugin" class="ml-1 text-slate-400">({{ store.routerPlugin }})</span>
      </p>

      <form class="space-y-3" @submit.prevent="submit">
        <div v-if="!passwordOnly">
          <label class="block text-xs font-medium text-slate-600 mb-1">Username</label>
          <input
            v-model="username"
            type="text"
            autocomplete="username"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <p v-if="error" class="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ error }}</p>

        <div class="flex gap-2 pt-1">
          <button
            type="button"
            class="flex-1 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="store.loginRequired = false"
          >Cancel</button>

          <button
            type="submit"
            class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            :disabled="store.connecting"
          >
            <svg v-if="store.connecting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            {{ store.connecting ? 'Connecting...' : 'Login' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
