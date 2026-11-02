<template>
  <span 
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs transition-colors',
      stageInfo.color
    ]"
    :title="`艾宾浩斯阶段 ${stage}：${stageInfo.desc}，留存率约 ${stageInfo.retention}%`"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="dotColor"></span>
    <span>Stage {{ stage }}: {{ stageInfo.label }}</span>
    <span v-if="timeRemaining && stage > 0" class="text-[10px] opacity-75 font-normal">
      · {{ timeRemaining }}
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { EBBINGHAUS_STAGES, formatReviewTimeRemaining } from '../services/ebbinghaus'

const props = defineProps({
  stage: {
    type: Number,
    default: 0
  },
  nextReviewAt: {
    type: String,
    default: null
  }
})

const stageInfo = computed(() => {
  const safeStage = Math.min(Math.max(props.stage || 0, 0), 6)
  return EBBINGHAUS_STAGES[safeStage]
})

const dotColor = computed(() => {
  switch (props.stage) {
    case 0: return 'bg-slate-400'
    case 1: return 'bg-rose-500'
    case 2: return 'bg-amber-500'
    case 3: return 'bg-blue-500'
    case 4: return 'bg-indigo-500'
    case 5: return 'bg-purple-500'
    case 6: return 'bg-emerald-500'
    default: return 'bg-slate-400'
  }
})

const timeRemaining = computed(() => {
  return formatReviewTimeRemaining(props.nextReviewAt)
})
</script>
