<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- 1. Exam Not Started Screen -->
    <div v-if="!isStarted && !isSubmitted" class="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center space-y-6">
      <div class="w-20 h-20 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-4xl mx-auto shadow-sm">
        🏆
      </div>
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-800">
          国家电网核心知识 · 全真模拟考试
        </h1>
        <p class="text-slate-500 text-sm mt-2 max-w-lg mx-auto leading-relaxed">
          全仿真机考环境，随机抽取 100 道核心题目，倒计时 60 分钟。全面检验综合应试水平与记忆熟练度。
        </p>
      </div>

      <!-- Exam Rules Card -->
      <div class="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-3 text-slate-600">
        <div class="font-bold text-slate-800 text-sm">📋 考卷结构与规则：</div>
        <div class="flex justify-between py-1 border-b border-slate-200/60">
          <span>单选题 (50 题)</span>
          <span class="font-semibold text-slate-800">50 分 (每题 1 分)</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-200/60">
          <span>多选题 (30 题)</span>
          <span class="font-semibold text-slate-800">60 分 (每题 2 分，多选/少选/错选均不得分)</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-200/60">
          <span>判断题 (20 题)</span>
          <span class="font-semibold text-slate-800">20 分 (每题 1 分)</span>
        </div>
        <div class="flex justify-between font-bold text-slate-800 pt-1">
          <span>满分 / 及格线</span>
          <span>130 分 / 78 分及格 (60%)</span>
        </div>
      </div>

      <div>
        <button
          @click="startExam"
          class="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
        >
          开始全真模拟考 (60分钟) →
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
          :class="totalScore >= 78 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'"
        >
          {{ totalScore >= 78 ? '🏆' : '📚' }}
        </div>

        <div>
          <span 
            :class="[
              'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
              totalScore >= 78 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            ]"
          >
            {{ totalScore >= 78 ? '考试通过 · 恭喜通关' : '未及格 · 仍需巩固' }}
          </span>
          <div class="text-5xl font-black text-slate-800 mt-3 font-mono">
            {{ totalScore }} <span class="text-lg font-normal text-slate-400">/ 130 分</span>
          </div>
          <p class="text-xs text-slate-500 mt-2">
            答对 {{ correctCount }} 题 · 答错 {{ wrongCount }} 题 · 未作答 {{ unAnsweredCount }} 题 · 耗时 {{ timeSpentText }}
          </p>
        </div>

        <!-- Section Score Breakdown Grid -->
        <div class="grid grid-cols-3 gap-3 max-w-lg mx-auto">
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div class="text-xs text-slate-400 font-medium">单选题得分</div>
            <div class="text-xl font-bold text-slate-800 mt-1">{{ singleScore }} / 50</div>
            <div class="text-[10px] text-slate-500 mt-0.5">对 {{ singleCorrect }}/50 题</div>
          </div>
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div class="text-xs text-slate-400 font-medium">多选题得分</div>
            <div class="text-xl font-bold text-slate-800 mt-1">{{ multiScore }} / 60</div>
            <div class="text-[10px] text-slate-500 mt-0.5">对 {{ multiCorrect }}/30 题</div>
          </div>
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div class="text-xs text-slate-400 font-medium">判断题得分</div>
            <div class="text-xl font-bold text-slate-800 mt-1">{{ judgeScore }} / 20</div>
            <div class="text-[10px] text-slate-500 mt-0.5">对 {{ judgeCorrect }}/20 题</div>
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
import { ref, computed, onUnmounted } from 'vue'
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
const examAnswers = ref({}) // { [qId]: { userAnswer, isCorrect } }
const remainingSeconds = ref(3600) // 60 min
let timer = null

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function startExam() {
  // 抽 50 单选、30 多选、20 判断
  const singles = shuffle(quizStore.questions.filter(q => q.type === '单选题')).slice(0, 50)
  const multis = shuffle(quizStore.questions.filter(q => q.type === '多选题')).slice(0, 30)
  const judges = shuffle(quizStore.questions.filter(q => q.type === '判断题')).slice(0, 20)

  examQuestions.value = [...singles, ...multis, ...judges]
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
  // Update Ebbinghaus memory & record
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

  if (totalScore.value >= 78) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }
}

// Score Computations
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

const singleScore = computed(() => singleCorrect.value * 1) // 1 point each
const multiScore = computed(() => multiCorrect.value * 2) // 2 points each
const judgeScore = computed(() => judgeCorrect.value * 1) // 1 point each
const totalScore = computed(() => singleScore.value + multiScore.value + judgeScore.value)

const correctCount = computed(() => singleCorrect.value + multiCorrect.value + judgeCorrect.value)
const wrongCount = computed(() => answeredCount.value - correctCount.value)

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
