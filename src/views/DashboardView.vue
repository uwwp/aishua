<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <!-- Top Minimalist Welcome Banner -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white p-6 sm:p-7 shadow-sm border border-emerald-900/30">
      <div class="relative z-10 max-w-2xl space-y-2.5">
        <!-- Minimal Tag -->
        <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-medium">
          <span>📚 {{ quizStore.currentBank.name }}</span>
          <span class="opacity-40">·</span>
          <span>共 {{ quizStore.totalCount }} 题</span>
        </div>

        <!-- Clean Headline -->
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white">
          智能排程，高效掌握
        </h1>

        <!-- Crisp one-line Subtitle -->
        <p class="text-xs sm:text-sm text-emerald-100/75 leading-relaxed">
          动态追踪记忆临界点，用更少的时间牢固掌握核心考点。
        </p>

        <!-- Concise Action Buttons -->
        <div class="pt-2 flex flex-wrap items-center gap-2.5">
          <router-link
            to="/practice?mode=ebbinghaus"
            class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>🧠 智能复习</span>
            <span v-if="quizStore.dueTodayCount > 0" class="px-1.5 py-0.2 rounded-full bg-rose-600 text-[10px] font-bold">
              {{ quizStore.dueTodayCount }}
            </span>
          </router-link>

          <router-link
            to="/practice?mode=new"
            class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/15 transition-all flex items-center gap-1.5"
          >
            <span>🚀 学习新题</span>
            <span class="text-emerald-200/80 text-[11px]">(余 {{ quizStore.unlearnedCount }})</span>
          </router-link>

          <router-link
            to="/exam"
            class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>📝 全真模考</span>
          </router-link>
        </div>
      </div>

      <div class="absolute -right-8 -bottom-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>
    </div>

    <!-- 4 Key Stat Metric Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <!-- 1. 今日待复习 -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">今日待复习</span>
          <span class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
            ⏰
          </span>
        </div>
        <div class="mt-4 flex items-baseline justify-between">
          <div class="text-3xl font-extrabold text-slate-800">
            {{ quizStore.dueTodayCount }}
            <span class="text-xs font-normal text-slate-400">/ {{ quizStore.totalCount }}</span>
          </div>
          <router-link 
            to="/practice?mode=ebbinghaus" 
            class="text-xs font-medium text-emerald-600 hover:text-emerald-700 underline"
          >
            去复习 →
          </router-link>
        </div>
      </div>

      <!-- 2. 已彻底掌握 (Stage 6) -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">彻底掌握</span>
          <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            🏆
          </span>
        </div>
        <div class="mt-4 flex items-baseline justify-between">
          <div class="text-3xl font-extrabold text-emerald-600">
            {{ quizStore.masteredCount }}
            <span class="text-xs font-normal text-slate-400">题</span>
          </div>
          <span class="text-xs font-medium text-slate-500">
            {{ quizStore.totalCount ? Math.round((quizStore.masteredCount / quizStore.totalCount) * 100) : 0 }}% 掌握率
          </span>
        </div>
      </div>

      <!-- 3. 正在记忆巩固中 -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">记忆巩固中</span>
          <span class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            📈
          </span>
        </div>
        <div class="mt-4 flex items-baseline justify-between">
          <div class="text-3xl font-extrabold text-blue-600">
            {{ quizStore.learningCount }}
            <span class="text-xs font-normal text-slate-400">题</span>
          </div>
          <span class="text-xs font-medium text-slate-500">
            已学习 {{ quizStore.learnedCount }} 题
          </span>
        </div>
      </div>

      <!-- 4. 错题攻坚待消灭 -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">错题本</span>
          <span class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
            📕
          </span>
        </div>
        <div class="mt-4 flex items-baseline justify-between">
          <div class="text-3xl font-extrabold text-amber-600">
            {{ quizStore.wrongQuestions.length }}
            <span class="text-xs font-normal text-slate-400">题</span>
          </div>
          <router-link 
            to="/wrong-book" 
            class="text-xs font-medium text-amber-600 hover:text-amber-700 underline"
          >
            攻坚 →
          </router-link>
        </div>
      </div>
    </div>

    <!-- 记忆阶段全景看板 -->
    <div class="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>🧠 记忆阶段全景</span>
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            题目随复习递增至更高阶段，直至进入 Stage 6 永久记忆
          </p>
        </div>
        <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
          当前题库: {{ quizStore.totalCount }} 题
        </span>
      </div>

      <!-- Stage Bars Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-7 gap-3 pt-2">
        <div 
          v-for="(info, sIdx) in EBBINGHAUS_STAGES" 
          :key="sIdx"
          class="p-3.5 rounded-xl border flex flex-col justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors"
          :class="info.stage === 6 ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-700">Stage {{ info.stage }}</span>
            <span class="text-[10px] text-slate-400 font-mono">{{ info.days === 0 ? '即时' : info.days + '天' }}</span>
          </div>

          <div class="my-3">
            <div class="text-xl font-black text-slate-800">
              {{ quizStore.stageDistribution[sIdx] }}
            </div>
            <div class="text-[11px] text-slate-500">
              {{ info.label }}
            </div>
          </div>

          <!-- Progress miniature bar -->
          <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-500"
              :class="sIdx === 6 ? 'bg-emerald-500' : sIdx > 0 ? 'bg-blue-500' : 'bg-slate-400'"
              :style="{ width: `${quizStore.totalCount ? (quizStore.stageDistribution[sIdx] / quizStore.totalCount) * 100 : 0}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 专题进度 + 题型矩阵 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 专题进度 (占2列) -->
      <div class="lg:col-span-2 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-base sm:text-lg font-bold text-slate-800">
            📑 知识专题掌握度
          </h2>
          <router-link to="/categories" class="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
            查看全部专题与导入 →
          </router-link>
        </div>

        <div class="space-y-4">
          <div 
            v-for="cat in quizStore.categoryStats" 
            :key="cat.fullName"
            class="p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors bg-slate-50/40"
          >
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="font-bold text-slate-800">{{ cat.name }}</span>
              <div class="flex items-center gap-3 text-xs">
                <span class="text-slate-500">已学 {{ cat.learned }} / {{ cat.total }} 题</span>
                <span class="font-bold text-emerald-700">{{ cat.progressPercent }}%</span>
                <router-link
                  :to="`/practice?mode=category&target=${encodeURIComponent(cat.fullName)}`"
                  class="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors font-medium text-xs"
                >
                  去刷题
                </router-link>
              </div>
            </div>

            <!-- Double-decker progress bar: learned & mastered -->
            <div class="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
              <div 
                class="bg-emerald-500 h-full transition-all duration-500"
                :title="`彻底掌握: ${cat.mastered} 题`"
                :style="{ width: `${cat.total ? (cat.mastered / cat.total) * 100 : 0}%` }"
              ></div>
              <div 
                class="bg-teal-300 h-full transition-all duration-500"
                :title="`学习巩固中: ${cat.learned - cat.mastered} 题`"
                :style="{ width: `${cat.total ? ((cat.learned - cat.mastered) / cat.total) * 100 : 0}%` }"
              ></div>
            </div>

            <div class="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  彻底掌握: {{ cat.mastered }}
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-teal-300"></span>
                  复习巩固中: {{ cat.learned - cat.mastered }}
                </span>
              </div>
              <span>剩余未学: {{ cat.total - cat.learned }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 题型分布矩阵 (占1列) -->
      <div class="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <h2 class="text-base sm:text-lg font-bold text-slate-800">
          🎯 题型分布
        </h2>

        <div class="space-y-4">
          <div 
            v-for="t in quizStore.typeStats" 
            :key="t.type"
            class="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-slate-700">{{ t.type }}</span>
              <span class="text-xs font-semibold text-slate-500">{{ t.total }} 题</span>
            </div>

            <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                class="bg-emerald-500 h-full rounded-full transition-all duration-500"
                :style="{ width: `${t.total ? (t.learned / t.total) * 100 : 0}%` }"
              ></div>
            </div>

            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span>已学 {{ t.learned }} 题</span>
              <span>掌握率 {{ t.total ? Math.round((t.mastered / t.total) * 100) : 0 }}%</span>
            </div>
          </div>
        </div>

        <!-- 快速开始考试卡片 -->
        <div class="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 text-amber-900 space-y-2 mt-6">
          <div class="font-bold text-sm flex items-center gap-1.5">
            <span>📝</span> 全真综合模拟考
          </div>
          <p class="text-xs text-amber-800/80 leading-relaxed">
            按真实比例随机抽取题目，60分钟限时交卷与评分。
          </p>
          <router-link
            to="/exam"
            class="inline-block mt-1 w-full text-center py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors"
          >
            开始模拟考 →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useQuizStore } from '../stores/quizStore'
import { EBBINGHAUS_STAGES } from '../services/ebbinghaus'

const quizStore = useQuizStore()
</script>
