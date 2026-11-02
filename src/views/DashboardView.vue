<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Top Welcome Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
      <div class="relative z-10 max-w-3xl space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-semibold">
          <span>⚡ 国家电网核心题库 · 科学抗遗忘备考引擎</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
          用艾宾浩斯遗忘曲线，攻克 832 道核心要点
        </h1>
        <p class="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
          科学计算最佳复习时机，在记忆即将遗忘的临界点精准强化。单选题 352 道、多选题 253 道、判断题 227 道全覆盖。
        </p>

        <!-- CTA Action Buttons -->
        <div class="pt-2 flex flex-wrap items-center gap-3">
          <router-link
            to="/practice?mode=ebbinghaus"
            class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
          >
            <span>🧠 开启今日艾宾浩斯复习</span>
            <span v-if="quizStore.dueTodayCount > 0" class="px-2 py-0.5 rounded-full bg-rose-600 text-[11px] font-bold">
              {{ quizStore.dueTodayCount }} 题到期
            </span>
          </router-link>

          <router-link
            to="/practice?mode=new"
            class="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-sm border border-white/20 transition-all flex items-center gap-2"
          >
            <span>🚀 学习新题 (余 {{ quizStore.unlearnedCount }} 题)</span>
          </router-link>

          <router-link
            to="/exam"
            class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <span>📝 100题模拟考</span>
          </router-link>
        </div>
      </div>

      <!-- Background decorative circle -->
      <div class="absolute -right-12 -bottom-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
    </div>

    <!-- 4 Key Stat Metric Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <!-- 1. 今日待复习 -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">今日艾宾浩斯待复习</span>
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
          <span class="text-xs font-semibold text-slate-500">彻底掌握 (Stage 6)</span>
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
            {{ Math.round((quizStore.masteredCount / quizStore.totalCount) * 100) }}% 掌握率
          </span>
        </div>
      </div>

      <!-- 3. 正在记忆巩固中 -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">记忆巩固中 (Stage 1-5)</span>
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
          <span class="text-xs font-semibold text-slate-500">错题攻坚本</span>
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
            错题攻坚 →
          </router-link>
        </div>
      </div>
    </div>

    <!-- 艾宾浩斯 7 阶段记忆状态分布漏斗 -->
    <div class="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>🧠 艾宾浩斯记忆全景看板</span>
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            题目随复习次数在各阶段递进，答错则回退重温，直至进入 Stage 6 永久记忆
          </p>
        </div>
        <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
          总计 832 题
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
              :style="{ width: `${(quizStore.stageDistribution[sIdx] / quizStore.totalCount) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5 大知识板块进度 + 3 大题型矩阵 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 5 大知识板块进度 (占2列) -->
      <div class="lg:col-span-2 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-base sm:text-lg font-bold text-slate-800">
            📑 5 大专题掌握度
          </h2>
          <router-link to="/categories" class="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
            查看完整专题库 →
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
                :style="{ width: `${cat.masterPercent}%` }"
                title="已彻底掌握"
              ></div>
              <div 
                class="bg-blue-400 h-full transition-all duration-500"
                :style="{ width: `${cat.progressPercent - cat.masterPercent}%` }"
                title="记忆复习中"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3 大题型分布卡片 (占1列) -->
      <div class="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-800">
            🎯 3 大题型专攻
          </h2>
          <p class="text-xs text-slate-500 mt-1">
            单选稳基础、多选决高下、判断扣细节
          </p>
        </div>

        <div class="space-y-3.5">
          <div 
            v-for="item in quizStore.typeStats" 
            :key="item.type"
            class="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 space-y-2"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span 
                  :class="[
                    'w-2 h-2 rounded-full',
                    item.type === '单选题' ? 'bg-blue-500' :
                    item.type === '多选题' ? 'bg-purple-500' : 'bg-amber-500'
                  ]"
                ></span>
                <span class="font-bold text-slate-800 text-sm">{{ item.type }}</span>
                <span class="text-slate-400 font-mono">({{ item.total }} 题)</span>
              </div>
              <router-link
                :to="`/practice?mode=type&target=${encodeURIComponent(item.type)}`"
                class="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                专练 →
              </router-link>
            </div>

            <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500"
                :class="item.type === '单选题' ? 'bg-blue-500' : item.type === '多选题' ? 'bg-purple-500' : 'bg-amber-500'"
                :style="{ width: `${item.percent}%` }"
              ></div>
            </div>
            <div class="flex justify-between text-[11px] text-slate-400">
              <span>已掌握 {{ item.mastered }} 题</span>
              <span>进度 {{ item.percent }}%</span>
            </div>
          </div>
        </div>

        <!-- 模拟考快速入口卡片 -->
        <div class="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-amber-900 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs flex items-center gap-1.5">
              <span>🏆</span> 全真模拟考场
            </span>
            <span class="text-[10px] font-semibold bg-amber-200/80 px-2 py-0.5 rounded">60 分钟</span>
          </div>
          <p class="text-xs text-amber-800 leading-relaxed">
            随机抽取单选 50 题、多选 30 题、判断 20 题，限时交卷即时出分。
          </p>
          <router-link
            to="/exam"
            class="block w-full text-center py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
          >
            进入考场
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
