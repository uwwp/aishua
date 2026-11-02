<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
    <!-- Header -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">📑 知识分类与题型专区</h1>
        <p class="text-xs text-slate-500 mt-1">
          针对薄弱环节分模块逐一击破，所有作答自动接入艾宾浩斯记忆排程
        </p>
      </div>
      <router-link
        to="/practice?mode=all"
        class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
      >
        全题库刷题 (832题)
      </router-link>
    </div>

    <!-- 1. 5大核心知识板块 -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="text-base font-bold text-slate-800">🏛️ 5 大核心知识专题</span>
        <span class="text-xs text-slate-400">共 832 道精选试题</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="cat in quizStore.categoryStats"
          :key="cat.fullName"
          class="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
        >
          <div>
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold">
                {{ cat.fullName.substring(0, 4) }}
              </span>
              <span class="text-xs text-slate-400 font-mono">共 {{ cat.total }} 题</span>
            </div>

            <h3 class="text-lg font-bold text-slate-800 mt-3">
              {{ cat.name }}
            </h3>

            <div class="mt-4 space-y-1.5 text-xs text-slate-500">
              <div class="flex justify-between">
                <span>学习进度</span>
                <span class="font-bold text-slate-700">{{ cat.progressPercent }}%</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                <div 
                  class="bg-emerald-500 h-full"
                  :style="{ width: `${cat.masterPercent}%` }"
                  title="彻底掌握"
                ></div>
                <div 
                  class="bg-blue-400 h-full"
                  :style="{ width: `${cat.progressPercent - cat.masterPercent}%` }"
                  title="巩固中"
                ></div>
              </div>
              <div class="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>已学 {{ cat.learned }} 题</span>
                <span>已掌握 {{ cat.mastered }} 题</span>
              </div>
            </div>
          </div>

          <div class="pt-2 flex gap-2">
            <router-link
              :to="`/practice?mode=category&target=${encodeURIComponent(cat.fullName)}`"
              class="flex-1 py-2 text-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              专练该模块 →
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 3大基础题型 -->
    <div class="space-y-4 pt-4">
      <div class="flex items-center gap-2">
        <span class="text-base font-bold text-slate-800">🎯 3 大题型专项攻坚</span>
        <span class="text-xs text-slate-400">单选、多选、判断专项训练</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          v-for="t in quizStore.typeStats"
          :key="t.type"
          class="bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
        >
          <div>
            <div class="flex items-center justify-between">
              <span 
                :class="[
                  'px-2.5 py-1 rounded-md text-xs font-semibold',
                  t.type === '单选题' ? 'bg-blue-100 text-blue-800' :
                  t.type === '多选题' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                ]"
              >
                {{ t.type }}
              </span>
              <span class="text-xs text-slate-400 font-mono">共 {{ t.total }} 题</span>
            </div>

            <div class="text-3xl font-black text-slate-800 mt-4">
              {{ t.percent }}%
              <span class="text-xs font-normal text-slate-400">进度</span>
            </div>

            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
              <div 
                class="h-full rounded-full transition-all"
                :class="t.type === '单选题' ? 'bg-blue-500' : t.type === '多选题' ? 'bg-purple-500' : 'bg-amber-500'"
                :style="{ width: `${t.percent}%` }"
              ></div>
            </div>

            <div class="flex justify-between text-xs text-slate-500 mt-3">
              <span>已学: {{ t.learned }} 题</span>
              <span>掌握: {{ t.mastered }} 题</span>
            </div>
          </div>

          <router-link
            :to="`/practice?mode=type&target=${encodeURIComponent(t.type)}`"
            class="block w-full py-2 text-center rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
          >
            进入题型专练 →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useQuizStore } from '../stores/quizStore'

const quizStore = useQuizStore()
</script>
