<template>
  <div>
    <!-- Backdrop -->
    <div 
      v-if="isOpen" 
      @click="$emit('close')"
      class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity"
    ></div>

    <!-- Drawer Panel -->
    <div 
      :class="[
        'fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-200 ease-in-out flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      ]"
    >
      <!-- Header -->
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <h3 class="font-bold text-slate-800 text-sm">答题卡</h3>
          <p class="text-xs text-slate-500 mt-0.5">共 {{ questions.length }} 题 · 点击题号快速跳转</p>
        </div>
        <button @click="$emit('close')" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Legend -->
      <div class="px-5 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4 text-xs text-slate-600">
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded bg-emerald-500"></span>
          <span>正确</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded bg-rose-500"></span>
          <span>错误</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded border border-slate-300 bg-white"></span>
          <span>未答</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded ring-2 ring-emerald-500"></span>
          <span>当前</span>
        </div>
      </div>

      <!-- Grid Content -->
      <div class="flex-1 overflow-y-auto p-5">
        <div class="grid grid-cols-5 gap-2.5">
          <button
            v-for="(q, idx) in questions"
            :key="q.id"
            @click="$emit('select', idx); $emit('close')"
            :class="[
              'h-10 rounded-lg text-xs font-semibold flex items-center justify-center transition-all',
              idx === currentIndex ? 'ring-2 ring-offset-2 ring-emerald-600 font-bold scale-105' : '',
              getStatusClass(q.id)
            ]"
          >
            {{ idx + 1 }}
          </button>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 text-center">
        提示：也可以按键盘数字键或方向键切题
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: Boolean,
  questions: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  sessionRecords: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['close', 'select'])

function getStatusClass(qId) {
  const record = props.sessionRecords[qId]
  if (!record) {
    return 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
  }
  if (record.isCorrect) {
    return 'bg-emerald-500 text-white shadow-xs'
  } else {
    return 'bg-rose-500 text-white shadow-xs'
  }
}
</script>
