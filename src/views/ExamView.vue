<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- 1. Exam Not Started Screen -->
    <div v-if="!isStarted && !isSubmitted" class="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm text-center space-y-6">
      <div class="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mx-auto shadow-sm">
        🏆
      </div>
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-800">
          模拟考试
        </h1>
      </div>

      <!-- Exam Customization Card -->
      <div class="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-4 text-slate-700">
        <div class="flex items-center justify-between">
          <div class="font-bold text-slate-800 text-sm">📋 考卷题目配置：</div>
          <button 
            @click="resetToDefaultCounts"
            class="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium underline"
            title="恢复为默认数量 (50 / 30 / 20)"
          >
            恢复默认
          </button>
        </div>

        <!-- 1. 单选题设置 -->
        <div class="flex items-center justify-between py-1.5 border-b border-slate-200/60">
          <div>
            <div class="font-semibold text-slate-800">单选题 (每题 1 分)</div>
            <div class="text-[10px] text-slate-400">题库共有 {{ availableSingles }} 题</div>
          </div>
          <div class="flex items-center gap-1.5">
            <button 
              type="button"
              @click="customSingleCount = Math.max(0, customSingleCount - 5)"
              class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            >-</button>
            <input 
              v-model.number="customSingleCount" 
              type="number" 
              min="0" 
              :max="availableSingles"
              @blur="clampCounts"
              class="w-14 text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button 
              type="button"
              @click="customSingleCount = Math.min(availableSingles, customSingleCount + 5)"
              class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            >+</button>
          </div>
        </div>

        <!-- 2. 多选题设置 -->
        <div class="flex items-center justify-between py-1.5 border-b border-slate-200/60">
          <div>
            <div class="font-semibold text-slate-800">多选题 (每题 2 分)</div>
            <div class="text-[10px] text-slate-400">题库共有 {{ availableMultis }} 题</div>
          </div>
          <div class="flex items-center gap-1.5">
            <button 
              type="button"
              @click="customMultiCount = Math.max(0, customMultiCount - 5)"
              class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            >-</button>
            <input 
              v-model.number="customMultiCount" 
              type="number" 
              min="0" 
              :max="availableMultis"
              @blur="clampCounts"
              class="w-14 text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button 
              type="button"
              @click="customMultiCount = Math.min(availableMultis, customMultiCount + 5)"
              class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            >+</button>
          </div>
        </div>

        <!-- 3. 判断题设置 -->
        <div class="flex items-center justify-between py-1.5 border-b border-slate-200/60">
          <div>
            <div class="font-semibold text-slate-800">判断题 (每题 1 分)</div>
            <div class="text-[10px] text-slate-400">题库共有 {{ availableJudges }} 题</div>
          </div>
          <div class="flex items-center gap-1.5">
            <button 
              type="button"
              @click="customJudgeCount = Math.max(0, customJudgeCount - 5)"
              class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            >-</button>
            <input 
              v-model.number="customJudgeCount" 
              type="number" 
              min="0" 
              :max="availableJudges"
              @blur="clampCounts"
              class="w-14 text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button 
              type="button"
              @click="customJudgeCount = Math.min(availableJudges, customJudgeCount + 5)"
              class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            >+</button>
          </div>
        </div>

        <!-- Summary -->
        <div class="flex justify-between font-bold text-slate-800 pt-1">
          <span>总题数 / 满分 / 及格线</span>
          <span>{{ totalExamQuestionsCount }} 题 / {{ maxPossibleScore }} 分 / {{ passScore }} 分及格</span>
        </div>
      </div>

      <div>
        <button
          @click="startExam"
          :disabled="totalExamQuestionsCount === 0"
          class="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
        >
          开始模拟考 (共 {{ totalExamQuestionsCount }} 题) →
        </button>
      </div>
    </div>

    <!-- 2. Exam In Progress Screen -->
    <div v-else-if="isStarted && !isSubmitted" class="space-y-6">
      <!-- Top Sticky Timer Bar -->
      <div class="sticky top-20 z-30 bg-white/95 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-slate-200 shadow-md flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-xs font-bold text-slate-500">模拟考中</span>
          <span class="text-sm font-extrabold text-slate-800">
            第 {{ currentIndex + 1 }} / {{ examQuestions.length }} 题
          </span>
        </div>

        <!-- Timer -->
        <div 
          :class="[
            'flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm font-bold border transition-colors',
            remainingSeconds <= 300 
              ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' 
              : 'bg-slate-100 border-slate-200 text-slate-700'
          ]"
        >
          <span>⏳</span>
          <span>{{ formattedTime }}</span>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            @click="isDrawerOpen = true"
            class="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <span>答题卡</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 font-mono">
              {{ answeredCount }}/{{ examQuestions.length }}
            </span>
          </button>

          <button
            @click="confirmSubmit"
            class="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            交卷
          </button>
        </div>
      </div>

      <!-- Current Exam Question Card (Exam Mode: answers hidden) -->
      <QuestionCard 
        :question="currentQuestion" 
        :questionIndex="currentIndex"
        :currentProgress="quizStore.progressMap[currentQuestion.id]"
        :isExamMode="true"
        :savedRecord="examAnswers[currentQuestion.id]"
        @answer="handleExamAnswer"
        @toggle-favorite="quizStore.toggleFavorite"
      />

      <!-- Navigation Footer -->
      <div class="flex items-center justify-between">
        <button
          @click="prevQuestion"
          :disabled="currentIndex === 0"
          class="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold"
        >
          ← 上一题
        </button>

        <span class="text-xs text-slate-400">
          已作答 {{ answeredCount }} 题 · 剩余 {{ examQuestions.length - answeredCount }} 题未作答
        </span>

        <button
          v-if="currentIndex < examQuestions.length - 1"
          @click="nextQuestion"
          class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
        >
          下一题 →
        </button>
        <button
          v-else
          @click="confirmSubmit"
          class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
        >
          检查并交卷
        </button>
      </div>
    </div>

    <!-- 3. Exam Score Report Screen -->
    <div v-else class="space-y-6">
      <div class="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm text-center space-y-6">
        <div class="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto shadow-md"
          :class="totalScore >= passScore ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'"
        >
          {{ totalScore >= passScore ? '🏆' : '📚' }}
        </div>

        <div>
          <span 
            :class="[
              'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
              totalScore >= passScore ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            ]"
          >
            {{ totalScore >= passScore ? '自测通过 · 表现优异' : '尚未及格 · 仍需强化' }}
          </span>
          <div class="text-5xl font-black text-slate-800 mt-3 font-mono">
            {{ totalScore }} <span class="text-lg font-normal text-slate-400">/ {{ maxPossibleScore }} 分</span>
          </div>
          <p class="text-xs text-slate-500 mt-2">
            答对 {{ correctCount }} 题 · 答错 {{ wrongCount }} 题 · 未作答 {{ unAnsweredCount }} 题 · 耗时 {{ timeSpentText }}
          </p>
        </div>

        <!-- Section Score Breakdown Grid -->
        <div class="grid grid-cols-3 gap-3 max-w-lg mx-auto">
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div class="text-xs text-slate-400 font-medium">单选题得分</div>
            <div class="text-xl font-bold text-slate-800 mt-1">{{ singleScore }} / {{ actualSingleCount * 1 }}</div>
            <div class="text-[10px] text-slate-500 mt-0.5">对 {{ singleCorrect }}/{{ actualSingleCount }} 题</div>
          </div>
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div class="text-xs text-slate-400 font-medium">多选题得分</div>
            <div class="text-xl font-bold text-slate-800 mt-1">{{ multiScore }} / {{ actualMultiCount * 2 }}</div>
            <div class="text-[10px] text-slate-500 mt-0.5">对 {{ multiCorrect }}/{{ actualMultiCount }} 题</div>
          </div>
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div class="text-xs text-slate-400 font-medium">判断题得分</div>
            <div class="text-xl font-bold text-slate-800 mt-1">{{ judgeScore }} / {{ actualJudgeCount * 1 }}</div>
            <div class="text-[10px] text-slate-500 mt-0.5">对 {{ judgeCorrect }}/{{ actualJudgeCount }} 题</div>
          </div>
        </div>

        <div class="pt-4 flex flex-wrap justify-center gap-3">
          <button 
            @click="startExam" 
            class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            再考一套
          </button>
          <router-link 
            to="/wrong-book" 
            class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors"
          >
            前往错题本攻坚 ({{ wrongCount }}题)
          </router-link>
          <router-link 
            to="/" 
            class="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            返回主看板
          </router-link>
        </div>
      </div>
    </div>

    <!-- Answer Sheet Drawer for Exam -->
    <AnswerDrawer
      :isOpen="isDrawerOpen"
      :questions="examQuestions"
      :currentIndex="currentIndex"
      :sessionRecords="examAnswers"
      @close="isDrawerOpen = false"
      @select="currentIndex = $event"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useQuizStore } from '../stores/quizStore'
import QuestionCard from '../components/QuestionCard.vue'
import AnswerDrawer from '../components/AnswerDrawer.vue'
import confetti from 'canvas-confetti'

const quizStore = useQuizStore()

const isStarted = ref(false)
const isSubmitted = ref(false)
const currentIndex = ref(0)
const isDrawerOpen = ref(false)

const examQuestions = ref([])
const examAnswers = ref({})
const remainingSeconds = ref(3600)
let timer = null

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 题库中可用的题目总量
const availableSingles = computed(() => {
  return quizStore.questions.filter(q => q.type === '单选题').length
})

const availableMultis = computed(() => {
  return quizStore.questions.filter(q => q.type === '多选题').length
})

const availableJudges = computed(() => {
  return quizStore.questions.filter(q => q.type === '判断题').length
})

// 用户自定义抽题数量 (默认值：单选50、多选30、判断20，自适应当前题库可用最大值)
const customSingleCount = ref(Math.min(50, availableSingles.value))
const customMultiCount = ref(Math.min(30, availableMultis.value))
const customJudgeCount = ref(Math.min(20, availableJudges.value))

// 当题库切换时，自动重置并适配默认值
watch(
  () => quizStore.activeBankId,
  () => {
    resetToDefaultCounts()
  }
)

function resetToDefaultCounts() {
  customSingleCount.value = Math.min(50, availableSingles.value)
  customMultiCount.value = Math.min(30, availableMultis.value)
  customJudgeCount.value = Math.min(20, availableJudges.value)
}

function clampCounts() {
  customSingleCount.value = Math.max(0, Math.min(availableSingles.value, Number(customSingleCount.value) || 0))
  customMultiCount.value = Math.max(0, Math.min(availableMultis.value, Number(customMultiCount.value) || 0))
  customJudgeCount.value = Math.max(0, Math.min(availableJudges.value, Number(customJudgeCount.value) || 0))
}

// 试卷实际抽取的题目数量（记录在当前考试实例中）
const actualSingleCount = ref(50)
const actualMultiCount = ref(30)
const actualJudgeCount = ref(20)

const totalExamQuestionsCount = computed(() => {
  return (Number(customSingleCount.value) || 0) + (Number(customMultiCount.value) || 0) + (Number(customJudgeCount.value) || 0)
})

const maxPossibleScore = computed(() => {
  return ((Number(customSingleCount.value) || 0) * 1) + 
         ((Number(customMultiCount.value) || 0) * 2) + 
         ((Number(customJudgeCount.value) || 0) * 1)
})

const passScore = computed(() => Math.round(maxPossibleScore.value * 0.6))

function startExam() {
  clampCounts()

  const singlesPool = quizStore.questions.filter(q => q.type === '单选题')
  const multisPool = quizStore.questions.filter(q => q.type === '多选题')
  const judgesPool = quizStore.questions.filter(q => q.type === '判断题')

  const targetSingle = Math.min(customSingleCount.value, singlesPool.length)
  const targetMulti = Math.min(customMultiCount.value, multisPool.length)
  const targetJudge = Math.min(customJudgeCount.value, judgesPool.length)

  actualSingleCount.value = targetSingle
  actualMultiCount.value = targetMulti
  actualJudgeCount.value = targetJudge

  const singles = shuffle(singlesPool).slice(0, targetSingle)
  const multis = shuffle(multisPool).slice(0, targetMulti)
  const judges = shuffle(judgesPool).slice(0, targetJudge)

  examQuestions.value = [...singles, ...multis, ...judges]
  if (examQuestions.value.length === 0) {
    alert('请至少配置抽取 1 道题目以开始考试！')
    return
  }

  examAnswers.value = {}
  currentIndex.value = 0
  remainingSeconds.value = 3600
  isStarted.value = true
  isSubmitted.value = false

  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--
    } else {
      submitExam()
    }
  }, 1000)
}

const currentQuestion = computed(() => {
  return examQuestions.value[currentIndex.value] || null
})

const formattedTime = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const timeSpentText = computed(() => {
  const spent = 3600 - remainingSeconds.value
  const m = Math.floor(spent / 60)
  const s = spent % 60
  return `${m} 分 ${s} 秒`
})

const answeredCount = computed(() => {
  return Object.keys(examAnswers.value).length
})

const unAnsweredCount = computed(() => {
  return examQuestions.value.length - answeredCount.value
})

function handleExamAnswer({ questionId, userAnswer, isCorrect }) {
  examAnswers.value[questionId] = { userAnswer, isCorrect }
  quizStore.recordAnswer({
    questionId,
    userAnswer,
    isCorrect,
    mode: 'exam'
  })
}

function prevQuestion() {
  if (currentIndex.value > 0) currentIndex.value--
}

function nextQuestion() {
  if (currentIndex.value < examQuestions.value.length - 1) currentIndex.value++
}

function confirmSubmit() {
  const unAns = unAnsweredCount.value
  if (unAns > 0) {
    if (!confirm(`您还有 ${unAns} 道题目尚未作答，确定要提前交卷吗？`)) {
      return
    }
  }
  submitExam()
}

function submitExam() {
  if (timer) clearInterval(timer)
  isSubmitted.value = true

  if (totalScore.value >= passScore.value) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }
}

const singleCorrect = computed(() => {
  return examQuestions.value
    .filter(q => q.type === '单选题')
    .filter(q => examAnswers.value[q.id]?.isCorrect).length
})

const multiCorrect = computed(() => {
  return examQuestions.value
    .filter(q => q.type === '多选题')
    .filter(q => examAnswers.value[q.id]?.isCorrect).length
})

const judgeCorrect = computed(() => {
  return examQuestions.value
    .filter(q => q.type === '判断题')
    .filter(q => examAnswers.value[q.id]?.isCorrect).length
})

const singleScore = computed(() => singleCorrect.value * 1)
const multiScore = computed(() => multiCorrect.value * 2)
const judgeScore = computed(() => judgeCorrect.value * 1)
const totalScore = computed(() => singleScore.value + multiScore.value + judgeScore.value)

const correctCount = computed(() => singleCorrect.value + multiCorrect.value + judgeCorrect.value)
const wrongCount = computed(() => answeredCount.value - correctCount.value)

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
