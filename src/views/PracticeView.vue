<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Top Control Bar -->
    <div class="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-xs">
      <!-- Left: Back & Mode Title -->
      <div class="flex items-center gap-3">
        <router-link to="/" class="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </router-link>
        <div>
          <div class="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>{{ modeTitle }}</span>
            <span class="text-xs font-normal text-slate-400">
              ({{ currentIndex + 1 }} / {{ activeQuestions.length }})
            </span>
          </div>
          <p class="text-[11px] text-slate-400">已答对 {{ currentSessionCorrect }} 题 · 正确率 {{ sessionAccuracy }}%</p>
        </div>
      </div>

      <!-- Right: Answer Sheet Button & Shortcuts Help -->
      <div class="flex items-center gap-2">
        <button 
          @click="isDrawerOpen = true"
          class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <span>📋 答题卡</span>
          <span class="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-mono">
            {{ Object.keys(sessionRecords).length }}/{{ activeQuestions.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Progress Indicator Bar -->
    <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
      <div 
        class="bg-emerald-500 h-full transition-all duration-300"
        :style="{ width: `${((currentIndex + 1) / Math.max(activeQuestions.length, 1)) * 100}%` }"
      ></div>
    </div>

    <!-- Empty State -->
    <div v-if="activeQuestions.length === 0" class="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
      <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
        🎉
      </div>
      <h3 class="text-lg font-bold text-slate-800">
        {{ emptyMessageTitle }}
      </h3>
      <p class="text-sm text-slate-500 max-w-md mx-auto">
        {{ emptyMessageDesc }}
      </p>
      <div class="pt-4 flex justify-center gap-3">
        <router-link to="/" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
          返回主看板
        </router-link>
        <router-link to="/practice?mode=all" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
          浏览全题库 ({{ quizStore.totalCount }}题)
        </router-link>
      </div>
    </div>

    <!-- Active Question Card -->
    <div v-else class="space-y-6">
      <QuestionCard 
        :question="currentQuestion" 
        :questionIndex="currentIndex"
        :currentProgress="quizStore.progressMap[currentQuestion.id]"
        :savedRecord="sessionRecords[currentQuestion.id]"
        @answer="handleAnswer"
        @toggle-favorite="quizStore.toggleFavorite"
      />

      <!-- Navigation Footer -->
      <div class="flex items-center justify-between pt-2">
        <button
          @click="prevQuestion"
          :disabled="currentIndex === 0"
          class="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <span>←</span>
          <span>上一题</span>
        </button>

        <span class="text-xs text-slate-400 hidden sm:inline">
          按键盘 A/B/C/D 选答案 · 方向键 ←/→ 切换题目
        </span>

        <button
          v-if="currentIndex < activeQuestions.length - 1"
          @click="nextQuestion"
          class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
        >
          <span>下一题</span>
          <span>→</span>
        </button>
        <button
          v-else
          @click="finishBatch"
          class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-colors flex items-center gap-1.5"
        >
          <span>🎉 完成本次学习</span>
        </button>
      </div>
    </div>

    <!-- Answer Sheet Drawer -->
    <AnswerDrawer
      :isOpen="isDrawerOpen"
      :questions="activeQuestions"
      :currentIndex="currentIndex"
      :sessionRecords="sessionRecords"
      @close="isDrawerOpen = false"
      @select="handleSelectIndex"
    />

    <!-- Finish Batch Summary Modal -->
    <div v-if="showFinishModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div class="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-sm">
          🏆
        </div>
        <div>
          <h3 class="text-xl font-extrabold text-slate-800">本次学习圆满完成！</h3>
          <p class="text-xs text-slate-500 mt-1">记忆排程与进度已成功更新</p>
        </div>

        <div class="grid grid-cols-3 gap-3 py-2 bg-slate-50 rounded-2xl p-4">
          <div>
            <div class="text-xs text-slate-400">总计作答</div>
            <div class="text-xl font-bold text-slate-800 mt-0.5">{{ Object.keys(sessionRecords).length }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-400">回答正确</div>
            <div class="text-xl font-bold text-emerald-600 mt-0.5">{{ currentSessionCorrect }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-400">正确率</div>
            <div class="text-xl font-bold text-blue-600 mt-0.5">{{ sessionAccuracy }}%</div>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <router-link to="/" class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">
            返回看板
          </router-link>
          <button 
            @click="restartOrContinue" 
            class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
          >
            继续学习
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quizStore'
import QuestionCard from '../components/QuestionCard.vue'
import AnswerDrawer from '../components/AnswerDrawer.vue'
import confetti from 'canvas-confetti'

const route = useRoute()
const router = useRouter()
const quizStore = useQuizStore()

const currentIndex = ref(0)
const isDrawerOpen = ref(false)
const showFinishModal = ref(false)
const sessionRecords = ref({})

const activeQuestions = computed(() => {
  const mode = route.query.mode || 'ebbinghaus'
  const target = route.query.target

  if (mode === 'ebbinghaus') {
    return quizStore.dueTodayQuestions
  } else if (mode === 'new') {
    return quizStore.newQuestions
  } else if (mode === 'category') {
    return quizStore.questions.filter(q => q.category === target)
  } else if (mode === 'type') {
    return quizStore.questions.filter(q => q.type === target)
  } else if (mode === 'wrong') {
    return quizStore.wrongQuestions
  } else if (mode === 'favorite') {
    return quizStore.favoriteQuestions
  } else {
    return quizStore.questions
  }
})

const currentQuestion = computed(() => {
  return activeQuestions.value[currentIndex.value] || null
})

const modeTitle = computed(() => {
  const mode = route.query.mode || 'ebbinghaus'
  const target = route.query.target
  if (mode === 'ebbinghaus') return '🧠 今日到期复习'
  if (mode === 'new') return '🚀 新题突击'
  if (mode === 'category') return `📑 专题: ${target}`
  if (mode === 'type') return `🎯 题型: ${target}`
  if (mode === 'wrong') return '📕 错题攻坚强化'
  if (mode === 'favorite') return '⭐ 重点收藏'
  return '📚 题库全量刷题'
})

const emptyMessageTitle = computed(() => {
  const mode = route.query.mode || 'ebbinghaus'
  if (mode === 'ebbinghaus') return '今日复习任务已全部达标！'
  if (mode === 'new') return '恭喜！您已经学完了当前题库的所有新题！'
  if (mode === 'wrong') return '太棒了！错题本目前为空，没有积压错题。'
  if (mode === 'favorite') return '暂无收藏题目，可在做题时点击右上角【☆ 收藏】。'
  return '未找到符合条件的题目'
})

const emptyMessageDesc = computed(() => {
  const mode = route.query.mode || 'ebbinghaus'
  if (mode === 'ebbinghaus') {
    return '今日暂无需要复习的到期题目。系统将根据记忆曲线在明日安排下一批强化复习。您可以继续学习新题或去模拟考！'
  }
  return '您可以切换其它模式继续备战。'
})

const currentSessionCorrect = computed(() => {
  return Object.values(sessionRecords.value).filter(r => r.isCorrect).length
})

const sessionAccuracy = computed(() => {
  const total = Object.keys(sessionRecords.value).length
  if (!total) return 0
  return Math.round((currentSessionCorrect.value / total) * 100)
})

watch(
  () => route.query,
  () => {
    currentIndex.value = 0
    sessionRecords.value = {}
  }
)

function handleAnswer({ questionId, userAnswer, isCorrect }) {
  sessionRecords.value[questionId] = { userAnswer, isCorrect }
  quizStore.recordAnswer({
    questionId,
    userAnswer,
    isCorrect,
    mode: route.query.mode || 'practice'
  })
}

function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function nextQuestion() {
  if (currentIndex.value < activeQuestions.value.length - 1) {
    currentIndex.value++
  }
}

function handleSelectIndex(index) {
  currentIndex.value = index
}

function finishBatch() {
  showFinishModal.value = true
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.6 }
  })
}

function restartOrContinue() {
  showFinishModal.value = false
  router.push('/')
}

function handleKeyDown(e) {
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
  if (e.key === 'ArrowLeft') {
    prevQuestion()
  } else if (e.key === 'ArrowRight') {
    nextQuestion()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
