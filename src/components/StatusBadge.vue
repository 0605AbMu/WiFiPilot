<script setup>
const props = defineProps({
  toast: { type: Object, required: true } // { type: 'success'|'error'|'info', message: string }
})
const emit = defineEmits(['dismiss'])

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
}

const icons = {
  success: '✓',
  error: '✕',
  info: 'ℹ'
}
</script>

<template>
  <div
    class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all"
    :class="colors[toast.type]"
  >
    <span class="font-bold">{{ icons[toast.type] }}</span>
    <span>{{ toast.message }}</span>
    <button class="ml-1 opacity-60 hover:opacity-100" @click="emit('dismiss')">×</button>
  </div>
</template>
