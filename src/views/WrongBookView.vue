<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <!-- Header Card -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
            📕
          </span>
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-slate-800">错题攻坚本</h1>
            <p class="text-xs text-slate-500 mt-0.5">
              记录所有历史上答错的题目，按照艾宾浩斯抗遗忘规律强化突破
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          v-if="filteredWrongQuestions.length > 0"
          @click="quizStore.clearWrongBook"
          class="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
        >
          清空错题本
        </button>

        <router-link
          to="/practice?mode=wrong"
          :class="[
            'px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2',
            filteredWrongQuestions.length > 0 
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' 
              : 'bg-slate-200 text-slate-400 pointer-events-none'
          ]"
        >
          <span>🎯 开始错题重练 ({{ filteredWrongQuestions.length }}题)</span>
        </router-link>
      </div>
    </div>

    <!-- Filter Pills -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        @click="selectedCategory = 'all'"
        :class="[
          'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all',
          selectedCategory === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        ]"
      >
        全部错题 ({{ quizStore.wrongQuestions.length }})
      </button>

      <button
        v-for="cat in categories"
        :key="cat"
        @click="selectedCategory = cat"
        :class="[
          'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all',
          selectedCategory === cat ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        ]"
      >
        {{ cat.replace(/^第[一二三四五]部分/, '') }} ({{ getCatCount(cat) }})
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="filteredWrongQuestions.length === 0" class="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
      <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
        🎉
      </div>
      <h3 class="text-base font-bold text-slate-800">
        太棒了！当前分类下暂无错题积压
      </h3>
      <p class="text-xs text-slate-500">
        继续保持良好的做题习惯，艾宾浩斯曲线将协助您牢记知识点。
      </p>
      <div class="pt-2">
        <router-link to="/practice?mode=ebbinghaus" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
          前往艾宾浩斯复习
        </router-link>
      </div>
    </div>

    <!-- Wrong Questions List -->
    <div v-else class="space-y-4">
      <div
        v-for="(q, idx) in filteredWrongQuestions"
        :key="q.id"
        class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 hover:border-slate-300 transition-colors"
      >
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-400">#{{ idx + 1 }}</span>
            <span 
              :class="[
                'px-2 py-0.5 rounded font-semibold text-[11px]',
                q.type === '单选题' ? 'bg-blue-100 text-blue-800' :
                q.type === '多选题' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
              ]"
            >
              {{ q.type }}
            </span>
            <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              {{ q.category }}
            </span>
            <span class="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded">
              已错 {{ quizStore.progressMap[q.id]?.wrong_count || 1 }} 次
            </span>
          </div>

          <button
            @click="quizStore.removeFromWrongBook(q.id)"
            class="text-xs text-slate-400 hover:text-slate-700 font-medium underline"
          >
            移出错题本
          </button>
        </div>

        <!-- Question Stem -->
        <div class="text-slate-800 font-medium text-sm sm:text-base leading-relaxed">
          {{ q.question }}
        </div>

        <!-- Options -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div
            v-for="(text, key) in q.options"
            :key="key"
            :class="[
              'p-2.5 rounded-lg border flex items-start gap-2',
              isCorrectOption(q, key) 
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium' 
                : 'bg-slate-50/50 border-slate-200 text-slate-600'
            ]"
          >
            <span 
              :class="[
                'w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center shrink-0',
                isCorrectOption(q, key) ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              ]"
            >
              {{ key }}
            </span>
            <span class="pt-0.5">{{ text }}</span>
          </div>
        </div>

        <!-- Correct Answer Info -->
        <div class="text-xs pt-1 flex items-center justify-between text-slate-500 border-t border-slate-100">
          <span>
            正确答案: <strong class="text-emerald-700">{{ q.answer_str || q.answer }}</strong>
          </span>
          <span class="text-[11px] text-slate-400">
            艾宾浩斯状态: Stage {{ quizStore.progressMap[q.id]?.stage ?? 0 }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuizStore } from '../stores/quizStore'

const quizStore = useQuizStore()
const selectedCategory = ref('all')

const categories = [
  '第一部分形势政策',
  '第二部分企业文化',
  '第三部分公司战略',
  '第四部分新型电力系统',
  '第五部分品牌建设'
]

const filteredWrongQuestions = computed(() => {
  if (selectedCategory.value === 'all') {
    return quizStore.wrongQuestions
  }
  return quizStore.wrongQuestions.filter(q => q.category === selectedCategory.value)
})

function getCatCount(cat) {
  return quizStore.wrongQuestions.filter(q => q.category === cat).length
}

function isCorrectOption(q, key) {
  if (q.type === '多选题') {
    const arr = Array.isArray(q.answer) ? q.answer : [q.answer]
    return arr.includes(key)
  }
  return q.answer === key
}
</script>
