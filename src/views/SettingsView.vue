<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
    <!-- Header -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
      <h1 class="text-2xl font-bold text-slate-800">⚙️ 系统设置与数据管理</h1>
      <p class="text-xs text-slate-500 mt-1">
        管理多端数据同步、做题自动保存、本地备份导出与恢复
      </p>
    </div>

    <!-- 1. 云端数据多端同步中心 (已移除“Supabase 云端数据库”字样) -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
            ☁️
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-800">云端多端同步中心</h2>
            <p class="text-xs text-slate-500">支持手机、电脑、平板跨设备无缝同步当前题库学习进度与错题本</p>
          </div>
        </div>

        <span 
          :class="[
            'px-3.5 py-1 rounded-full text-xs font-semibold border',
            authStore.isAuthenticated ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'
          ]"
        >
          {{ authStore.isAuthenticated ? '🟢 云端已连接' : '⚪ 本地离线（未登录）' }}
        </span>
      </div>

      <!-- 用户账号与登录信息 -->
      <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-3 text-xs">
        <div class="space-y-0.5">
          <div class="font-bold text-slate-700 flex items-center gap-2">
            <span>当前同步账户：</span>
            <span class="font-mono text-emerald-700 text-sm">{{ authStore.userEmail }}</span>
          </div>
          <div class="text-[11px] text-slate-400">
            {{ authStore.isAuthenticated ? `上次全量同步时间：${authStore.lastSyncTime || '刚刚'}` : '未注册登录用户仅保存在本地浏览器，不支持云端同步' }}
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="!authStore.isAuthenticated"
            @click="isSyncModalOpen = true"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            注册 / 登录云端账号
          </button>
          <button
            v-else
            @click="handleSignOut"
            class="px-3 py-1.5 border border-slate-300 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl font-medium transition-colors"
          >
            退出账号
          </button>
        </div>
      </div>

      <!-- 同步模式控制区：自动同步与手动同步 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- 自动同步设置卡片 -->
        <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span>⚡</span> 做题实时自动同步
              </span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  :checked="authStore.isAutoSync" 
                  @change="authStore.setAutoSync($event.target.checked)" 
                  class="sr-only peer"
                />
                <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p class="text-xs text-slate-500 mt-2 leading-relaxed">
              开启后，每答完一道题、排程复习或标记错题时，系统将在后台自动静默推送至云端。
            </p>
          </div>
          <div class="text-[11px] font-semibold" :class="authStore.isAutoSync ? 'text-emerald-600' : 'text-slate-400'">
            {{ authStore.isAutoSync ? '✓ 实时自动同步已启用' : '✕ 自动同步已关闭 (仅本地保存)' }}
          </div>
        </div>

        <!-- 手动全量同步卡片 -->
        <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span>🔄</span> 手动全量同步
              </span>
              <span class="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-600 font-mono">
                当前题库数据比对
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-2 leading-relaxed">
              将当前浏览器中的全部进度与云端进行双向深度核对与合并，确保跨设备数据绝对完整。
            </p>
          </div>

          <button
            @click="triggerManualSync"
            :disabled="isManualSyncing"
            class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <span :class="{ 'animate-spin': isManualSyncing }">🔄</span>
            <span>{{ isManualSyncing ? '正在全量同步中...' : '立即执行手动全量同步' }}</span>
          </button>
        </div>
      </div>

      <!-- 数据库配置与 SQL 脚本 -->
      <div class="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>📄</span> 云端数据库初始化脚本 (SQL)
          </span>
          <button
            @click="copySql"
            class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors shadow-2xs"
          >
            {{ isCopied ? '已复制到剪贴板 ✅' : '复制初始化 SQL' }}
          </button>
        </div>
        <p class="text-xs text-slate-500 leading-relaxed">
          若需在云端数据库控制台执行一键初始化，请复制下方 SQL 并在控制台 <strong>SQL Editor</strong> 中运行即可：
        </p>
        <pre class="bg-slate-900 text-emerald-400 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40 leading-relaxed">{{ SUPABASE_SQL_SCHEMA }}</pre>
      </div>
    </div>

    <!-- 2. 本地备份与恢复 -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div>
        <h2 class="text-base font-bold text-slate-800">💾 本地数据备份与还原</h2>
        <p class="text-xs text-slate-500 mt-0.5">随时导出您的做题进度 JSON 文件，或导入到其他浏览器中</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          @click="exportData"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
        >
          <span>📥 导出学习进度备份 (JSON)</span>
        </button>

        <label class="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer">
          <span>📤 恢复/导入备份文件</span>
          <input type="file" accept=".json" @change="importData" class="hidden" />
        </label>
      </div>

      <!-- Danger Zone -->
      <div class="pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div class="text-xs font-bold text-rose-600">重置当前题库进度</div>
          <div class="text-[11px] text-slate-400">将清除本地已做题目的记忆阶段、错题记录和打卡历史</div>
        </div>
        <button
          @click="handleReset"
          class="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
        >
          重置学习数据
        </button>
      </div>
    </div>

    <!-- Sync Modal -->
    <SyncModal :isOpen="isSyncModalOpen" @close="isSyncModalOpen = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuizStore } from '../stores/quizStore'
import { useAuthStore } from '../stores/authStore'
import { SUPABASE_SQL_SCHEMA } from '../services/supabase'
import SyncModal from '../components/SyncModal.vue'

const quizStore = useQuizStore()
const authStore = useAuthStore()
const isCopied = ref(false)
const isManualSyncing = ref(false)
const isSyncModalOpen = ref(false)

function copySql() {
  navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA)
  isCopied.value = true
  setTimeout(() => isCopied.value = false, 3000)
}

async function triggerManualSync() {
  if (!authStore.isAuthenticated) {
    isSyncModalOpen.value = true
    return
  }
  isManualSyncing.value = true
  try {
    await quizStore.performManualSync()
    alert('已成功执行手动全量同步！云端数据已与本地完全同步。')
  } catch (err) {
    alert('同步失败: ' + err.message)
  } finally {
    isManualSyncing.value = false
  }
}

async function handleSignOut() {
  if (confirm('确认退出当前云端账号吗？退出后将切换为本地模式。')) {
    await authStore.signOut()
    alert('已安全退出账号。')
  }
}

function exportData() {
  const data = {
    bankId: quizStore.activeBankId,
    bankName: quizStore.currentBank?.name,
    progress: quizStore.progressMap,
    dailyLogs: quizStore.dailyLogs,
    exportedAt: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aishua_backup_${quizStore.activeBankId}_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result)
      if (data.progress) {
        quizStore.progressMap = data.progress
        if (data.dailyLogs) quizStore.dailyLogs = data.dailyLogs
        quizStore.saveProgress()
        alert('进度恢复成功！')
      } else {
        alert('文件格式不正确，缺少 progress 字段')
      }
    } catch (err) {
      alert('解析文件失败: ' + err.message)
    }
  }
  reader.readAsText(file)
}

function handleReset() {
  if (confirm('确定要清空当前题库的刷题记录吗？此操作无法恢复！')) {
    if (confirm('请再次确认：清空后将从第 1 题开始重新排程。')) {
      quizStore.resetAllProgress()
      alert('已重置所有学习数据。')
    }
  }
}
</script>
