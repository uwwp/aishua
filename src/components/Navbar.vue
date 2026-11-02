<template>
  <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Left: Brand Logo -->
        <router-link to="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
            <span class="text-xl">⚡</span>
          </div>
          <div>
            <div class="font-bold text-slate-800 text-base leading-tight flex items-center gap-1.5">
              <span>艾刷</span>
              <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                aishua
              </span>
            </div>
            <p class="text-[11px] text-slate-400">832题艾宾浩斯抗遗忘系统</p>
          </div>
        </router-link>

        <!-- Center: Desktop Nav -->
        <nav class="hidden md:flex items-center gap-1">
          <router-link 
            to="/" 
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              $route.path === '/' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            ]"
          >
            📊 看板
          </router-link>

          <router-link 
            to="/practice?mode=ebbinghaus" 
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors relative flex items-center gap-1.5',
              $route.query.mode === 'ebbinghaus' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            ]"
          >
            <span>🧠 艾宾浩斯复习</span>
            <span 
              v-if="quizStore.dueTodayCount > 0" 
              class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse"
            >
              {{ quizStore.dueTodayCount }}
            </span>
          </router-link>

          <router-link 
            to="/categories" 
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              $route.path === '/categories' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            ]"
          >
            📑 分类专项
          </router-link>

          <router-link 
            to="/wrong-book" 
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
              $route.path === '/wrong-book' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            ]"
          >
            <span>📕 错题本</span>
            <span 
              v-if="quizStore.wrongQuestions.length > 0" 
              class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white"
            >
              {{ quizStore.wrongQuestions.length }}
            </span>
          </router-link>

          <router-link 
            to="/exam" 
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              $route.path === '/exam' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            ]"
          >
            📝 全真模考
          </router-link>
        </nav>

        <!-- Right: Status & Actions -->
        <div class="flex items-center gap-2.5">
          <!-- 打卡天数徽章 -->
          <div 
            v-if="quizStore.streakDays > 0"
            class="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold"
            title="连续学习打卡天数"
          >
            <span>🔥</span>
            <span>打卡 {{ quizStore.streakDays }} 天</span>
          </div>

          <!-- 云端同步状态胶囊按钮 -->
          <button 
            @click="isSyncModalOpen = true"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
              authStore.isAuthenticated 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-2xs' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            ]"
            :title="authStore.isAuthenticated ? `当前登录账号：${authStore.userEmail}` : '点击注册/登录账号开启云端同步'"
          >
            <span 
              class="w-2 h-2 rounded-full shrink-0" 
              :class="[
                authStore.isAuthenticated 
                  ? (authStore.syncStatus === 'syncing' ? 'bg-amber-500 animate-spin' : 'bg-emerald-500 animate-pulse') 
                  : 'bg-slate-400'
              ]"
            ></span>
            <span>
              {{ 
                authStore.isAuthenticated 
                  ? (authStore.syncStatus === 'syncing' ? '正在同步...' : '云端已同步') 
                  : '本地未登录' 
              }}
            </span>
          </button>

          <!-- 快捷手动同步小按钮 (仅登录用户显示) -->
          <button
            v-if="authStore.isAuthenticated"
            @click="triggerManualSync"
            :disabled="isSyncing"
            class="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="一键手动全量同步全部 832 题数据到云端"
          >
            <span :class="{ 'animate-spin': isSyncing }">🔄</span>
            <span class="hidden sm:inline text-[11px]">手动同步</span>
          </button>

          <!-- 设置入口 -->
          <router-link 
            to="/settings"
            class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="系统设置与数据备份"
          >
            ⚙️
          </router-link>
        </div>
      </div>
    </div>

    <!-- Mobile Sub-nav -->
    <div class="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-around bg-slate-50/80 text-xs font-medium">
      <router-link to="/" class="py-1 px-2 text-slate-600" :class="{ 'text-emerald-700 font-bold': $route.path === '/' }">
        看板
      </router-link>
      <router-link to="/practice?mode=ebbinghaus" class="py-1 px-2 text-slate-600 relative" :class="{ 'text-emerald-700 font-bold': $route.query.mode === 'ebbinghaus' }">
        艾宾浩斯
        <span v-if="quizStore.dueTodayCount > 0" class="absolute -top-1 -right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
      </router-link>
      <router-link to="/categories" class="py-1 px-2 text-slate-600" :class="{ 'text-emerald-700 font-bold': $route.path === '/categories' }">
        专项
      </router-link>
      <router-link to="/wrong-book" class="py-1 px-2 text-slate-600" :class="{ 'text-emerald-700 font-bold': $route.path === '/wrong-book' }">
        错题
      </router-link>
      <router-link to="/exam" class="py-1 px-2 text-slate-600" :class="{ 'text-emerald-700 font-bold': $route.path === '/exam' }">
        模考
      </router-link>
    </div>

    <!-- Sync Modal -->
    <SyncModal :isOpen="isSyncModalOpen" @close="isSyncModalOpen = false" />
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useQuizStore } from '../stores/quizStore'
import { useAuthStore } from '../stores/authStore'
import SyncModal from './SyncModal.vue'

const quizStore = useQuizStore()
const authStore = useAuthStore()
const isSyncModalOpen = ref(false)
const isSyncing = ref(false)

async function triggerManualSync() {
  isSyncing.value = true
  try {
    await quizStore.performManualSync()
    alert('已成功执行手动全量同步！云端数据与本地已完全一致。')
  } catch (err) {
    alert('手动同步失败: ' + err.message)
  } finally {
    isSyncing.value = false
  }
}
</script>
