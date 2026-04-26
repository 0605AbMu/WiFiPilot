<script setup>
import { ref, watch, onUnmounted, computed } from "vue";
import { useWifiStore } from "../store/wifi";

const store = useWifiStore();
const password = ref("");
const error = ref("");

const stepText = computed(() => {
  switch (store.connectStep) {
    case "loading_page":
      return "Router sahifasi yuklanmoqda...";
    case "waiting_form":
      return "Login formasi kutilmoqda...";
    case "logging_in":
      return "Parol kiritilmoqda...";
    case "verifying":
      return "Tekshirilmoqda...";
    case "reading_settings":
      return "WiFi sozlamalari o'qilmoqda...";
    default:
      return "Ulanmoqda...";
  }
});

// Elapsed timer so user knows it's working, not frozen
const elapsedSeconds = ref(0);
let timer = null;
watch(
  () => store.connecting,
  (active) => {
    if (active) {
      elapsedSeconds.value = 0;
      timer = setInterval(() => elapsedSeconds.value++, 1000);
    } else {
      clearInterval(timer);
      timer = null;
    }
  },
  { immediate: true },
);
onUnmounted(() => clearInterval(timer));

async function submit() {
  error.value = "";
  try {
    await store.loginRouter("admin", password.value);
  } catch (err) {
    error.value = err.message;
  }
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
      <h2 class="text-lg font-semibold text-slate-800 mb-1">Router ulanish</h2>
      <p class="text-sm text-slate-500 mb-4">
        <span class="font-mono font-medium text-slate-700">{{
          store.routerIp
        }}</span>
        <span v-if="store.routerPlugin" class="ml-1 text-slate-400"
          >({{ store.routerPlugin }})</span
        >
      </p>

      <!-- Progress state while connecting -->
      <template v-if="store.connecting">
        <div class="flex flex-col items-center gap-4 py-4">
          <svg
            class="animate-spin w-8 h-8 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <div class="text-center">
            <p class="text-sm font-medium text-slate-700">{{ stepText }}</p>
            <p class="text-xs text-slate-400 mt-1">
              {{ elapsedSeconds }}s — TP-Link uchun 40–60s kutish normal
            </p>
          </div>
          <!-- Step indicators -->
          <div class="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              :class="[
                'w-2 h-2 rounded-full transition-colors',
                [
                  'loading_page',
                  'waiting_form',
                  'logging_in',
                  'verifying',
                  'reading_settings',
                ].includes(store.connectStep)
                  ? 'bg-blue-500'
                  : 'bg-slate-200',
              ]"
            ></span>
            <span
              :class="[
                'w-2 h-2 rounded-full transition-colors',
                [
                  'waiting_form',
                  'logging_in',
                  'verifying',
                  'reading_settings',
                ].includes(store.connectStep)
                  ? 'bg-blue-500'
                  : 'bg-slate-200',
              ]"
            ></span>
            <span
              :class="[
                'w-2 h-2 rounded-full transition-colors',
                ['logging_in', 'verifying', 'reading_settings'].includes(
                  store.connectStep,
                )
                  ? 'bg-blue-500'
                  : 'bg-slate-200',
              ]"
            ></span>
            <span
              :class="[
                'w-2 h-2 rounded-full transition-colors',
                ['verifying', 'reading_settings'].includes(store.connectStep)
                  ? 'bg-blue-500'
                  : 'bg-slate-200',
              ]"
            ></span>
            <span
              :class="[
                'w-2 h-2 rounded-full transition-colors',
                store.connectStep === 'reading_settings'
                  ? 'bg-blue-500'
                  : 'bg-slate-200',
              ]"
            ></span>
          </div>
        </div>
      </template>

      <!-- Login form -->
      <template v-else>
        <form class="space-y-3" @submit.prevent="submit">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1"
              >Parol</label
            >
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              autofocus
              placeholder="admin123"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <p
            v-if="error"
            class="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg"
          >
            {{ error }}
          </p>

          <div class="flex gap-2 pt-1">
            <button
              type="button"
              class="flex-1 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              @click="store.loginRequired = false"
            >
              Bekor
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ulanish
            </button>
          </div>
        </form>
      </template>
    </div>
  </div>
</template>
