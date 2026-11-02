<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <!-- Card Header -->
    <div class="px-6 py-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
      <!-- Left Badges -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Type Badge -->
        <span 
          :class="[
            'px-2.5 py-1 rounded-md text-xs font-semibold',
            question.type === '单选题' ? 'bg-blue-100 text-blue-800' :
            question.type === '多选题' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
          ]"
        >
          {{ question.type }}
        </span>

        <!-- Category Badge -->
        <span class="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-200/70 text-slate-700">
          {{ question.category }}
        </span>

        <!-- Memory Stage Badge -->
        <StageBadge 
          :stage="currentProgress?.stage ?? 0" 
          :nextReviewAt="currentProgress?.next_review_at" 
        />
      </div>

      <!-- Right Actions: Favorite & ID -->
      <div class="flex items-center gap-3">
        <span class="text-xs font-mono text-slate-400">题号: #{{ question.id }}</span>
        
        <button 
          @click="$emit('toggle-favorite', question.id)"
          :class="[
            'p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs font-medium',
            currentProgress?.is_favorite 
              ? 'bg-amber-50 border-amber-300 text-amber-600' 
              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          ]"
          :title="currentProgress?.is_favorite ? '取消收藏' : '收藏此题'"
        >
          <span class="text-sm">{{ currentProgress?.is_favorite ? '★' : '☆' }}</span>
          <span>{{ currentProgress?.is_favorite ? '已收藏' : '收藏' }}</span>
        </button>
      </div>
    </div>

    <!-- Question Body -->
    <div class="p-6 md:p-8 space-y-6">
      <!-- Stem -->
      <div class="text-base sm:text-lg font-medium text-slate-800 leading-relaxed tracking-wide">
        <span class="text-emerald-700 font-bold mr-1">{{ questionIndex + 1 }}.</span>
        {{ question.question }}
      </div>

      <!-- Multi-choice tip -->
      <div v-if="question.type === '多选题' && !hasAnswered" class="text-xs text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
        <span>💡</span>
        <span>此题为多选题，请点击勾选所有符合条件的选项后，点击下方【确认提交】按钮</span>
      </div>

      <!-- Options Container -->
      <div class="space-y-3">
        <button
          v-for="(text, key) in question.options"
          :key="key"
          @click="selectOption(key)"
          :disabled="hasAnswered && isExamMode"
          :class="[
            'w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 relative group',
            getOptionStyle(key)
          ]"
        >
          <!-- Option Key Circle -->
          <div 
            :class="[
              'w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors',
              getOptionKeyStyle(key)
            ]"
          >
            {{ key }}
          </div>

          <!-- Option Text -->
          <div class="flex-1 text-sm sm:text-base leading-relaxed pt-0.5">
            {{ text }}
          </div>

          <!-- Status Indicator Icon when Answered -->
          <div v-if="hasAnswered" class="shrink-0 pt-0.5">
            <span v-if="isOptionCorrect(key)" class="text-emerald-600 font-bold text-base">✓</span>
            <span v-else-if="isOptionSelected(key)" class="text-rose-500 font-bold text-base">✕</span>
          </div>
        </button>
      </div>

      <!-- Multi-choice Submit Button -->
      <div v-if="question.type === '多选题' && !hasAnswered" class="pt-2 flex justify-end">
        <button
          @click="submitMultipleChoice"
          :disabled="selectedOptions.length === 0"
          class="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm shadow-md shadow-purple-600/20 transition-all flex items-center gap-2"
        >
          <span>确认提交 (已选 {{ selectedOptions.length }} 项)</span>
          <span>→</span>
        </button>
      </div>

      <!-- Feedback Banner (when answered in non-exam mode) -->
      <div 
        v-if="hasAnswered && !isExamMode"
        :class="[
          'p-5 rounded-xl border space-y-3 transition-all animate-in fade-in duration-300',
          answerResult.isCorrect ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50/80 border-rose-200'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ answerResult.isCorrect ? '🎉' : '💡' }}</span>
            <span :class="['font-bold text-base', answerResult.isCorrect ? 'text-emerald-800' : 'text-rose-800']">
              {{ answerResult.isCorrect ? '回答正确！' : '回答错误！' }}
            </span>
          </div>
          <div class="text-xs font-semibold px-2.5 py-1 rounded bg-white/80 border border-slate-200 text-slate-700">
            正确答案: <span class="text-emerald-700 font-bold">{{ question.answer_str || question.answer }}</span>
          </div>
        </div>

        <!-- Adaptive Memory Feedback -->
        <div class="text-xs leading-relaxed" :class="answerResult.isCorrect ? 'text-emerald-700' : 'text-rose-700'">
          <div v-if="answerResult.isCorrect" class="space-y-1">
            <p>
              🌟 记忆阶段晋升：
              <strong>Stage {{ (currentProgress?.stage ?? 1) - 1 }}</strong> ➔ 
              <strong>Stage {{ currentProgress?.stage }}</strong>
            </p>
            <p class="text-emerald-600">
              记忆深度加深，下次复习已智能排程于：<strong>{{ nextReviewText }}</strong>
            </p>
          </div>
          <div v-else class="space-y-1">
            <p>
              ⚠️ 记忆强化重置：该题已自动收录入<strong>【错题攻坚本】</strong>，记忆阶段重置为 <strong>Stage 0</strong>。
            </p>
            <p class="text-rose-600">
              系统将在<strong>今天稍后或次日</strong>再次优先为您安排强化复习。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import StageBadge from './StageBadge.vue'
import { formatReviewTimeRemaining } from '../services/ebbinghaus'

const props = defineProps({
  question: {
    type: Object,
    required: true
  },
  questionIndex: {
    type: Number,
    default: 0
  },
  currentProgress: {
    type: Object,
    default: null
  },
  isExamMode: {
    type: Boolean,
    default: false
  },
  savedRecord: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['answer', 'toggle-favorite'])

const selectedOptions = ref([])
const singleSelected = ref(null)
const hasAnswered = ref(false)
const answerResult = ref({ isCorrect: false })

watch(
  () => props.question.id,
  () => {
    resetState()
  },
  { immediate: true }
)

watch(
  () => props.savedRecord,
  (rec) => {
    if (rec) {
      hasAnswered.value = true
      answerResult.value = { isCorrect: rec.isCorrect }
      if (Array.isArray(rec.userAnswer)) {
        selectedOptions.value = [...rec.userAnswer]
      } else {
        singleSelected.value = rec.userAnswer
      }
    }
  },
  { immediate: true }
)

function resetState() {
  if (props.savedRecord) {
    hasAnswered.value = true
    answerResult.value = { isCorrect: props.savedRecord.isCorrect }
    if (Array.isArray(props.savedRecord.userAnswer)) {
      selectedOptions.value = [...props.savedRecord.userAnswer]
    } else {
      singleSelected.value = props.savedRecord.userAnswer
    }
  } else {
    selectedOptions.value = []
    singleSelected.value = null
    hasAnswered.value = false
    answerResult.value = { isCorrect: false }
  }
}

function selectOption(key) {
  if (props.question.type === '多选题') {
    if (hasAnswered.value) return
    const idx = selectedOptions.value.indexOf(key)
    if (idx > -1) {
      selectedOptions.value.splice(idx, 1)
    } else {
      selectedOptions.value.push(key)
      selectedOptions.value.sort()
    }
  } else {
    if (hasAnswered.value) return
    singleSelected.value = key
    evaluateAnswer(key)
  }
}

function submitMultipleChoice() {
  if (selectedOptions.value.length === 0 || hasAnswered.value) return
  evaluateAnswer([...selectedOptions.value])
}

function evaluateAnswer(userAnswer) {
  let isCorrect = false
  if (props.question.type === '多选题') {
    const correctArr = Array.isArray(props.question.answer) ? props.question.answer : [props.question.answer]
    const sortedUser = [...userAnswer].sort().join('')
    const sortedCorrect = [...correctArr].sort().join('')
    isCorrect = (sortedUser === sortedCorrect)
  } else {
    isCorrect = (userAnswer === props.question.answer)
  }

  hasAnswered.value = true
  answerResult.value = { isCorrect }

  emit('answer', {
    questionId: props.question.id,
    userAnswer,
    isCorrect
  })
}

function isOptionSelected(key) {
  if (props.question.type === '多选题') {
    return selectedOptions.value.includes(key)
  }
  return singleSelected.value === key
}

function isOptionCorrect(key) {
  if (props.question.type === '多选题') {
    const correctArr = Array.isArray(props.question.answer) ? props.question.answer : [props.question.answer]
    return correctArr.includes(key)
  }
  return props.question.answer === key
}

function getOptionStyle(key) {
  const selected = isOptionSelected(key)
  const correct = isOptionCorrect(key)

  if (!hasAnswered.value) {
    if (selected) {
      return 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-500/20 text-purple-900 font-medium'
    }
    return 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20 text-slate-700'
  }

  if (!props.isExamMode) {
    if (correct && selected) {
      return 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-medium'
    }
    if (!correct && selected) {
      return 'border-rose-400 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
    }
    if (correct && !selected) {
      return 'border-emerald-300 bg-emerald-50/40 text-emerald-800 border-dashed'
    }
    return 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
  } else {
    if (selected) {
      return 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-900 font-medium'
    }
    return 'border-slate-200 bg-white text-slate-700'
  }
}

function getOptionKeyStyle(key) {
  const selected = isOptionSelected(key)
  const correct = isOptionCorrect(key)

  if (!hasAnswered.value) {
    if (selected) {
      return 'bg-purple-600 text-white'
    }
    return 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
  }

  if (!props.isExamMode) {
    if (correct) {
      return 'bg-emerald-600 text-white'
    }
    if (!correct && selected) {
      return 'bg-rose-500 text-white'
    }
    return 'bg-slate-100 text-slate-400'
  } else {
    if (selected) {
      return 'bg-emerald-600 text-white'
    }
    return 'bg-slate-100 text-slate-600'
  }
}

const nextReviewText = computed(() => {
  return formatReviewTimeRemaining(props.currentProgress?.next_review_at)
})

function handleKeyDown(e) {
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return

  const key = e.key.toUpperCase()
  if (['A', 'B', 'C', 'D'].includes(key) && props.question.options[key]) {
    selectOption(key)
  } else if (e.key === 'Enter' && props.question.type === '多选题' && !hasAnswered.value) {
    submitMultipleChoice()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
