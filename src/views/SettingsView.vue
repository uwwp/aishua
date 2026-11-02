<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
    <!-- Header -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
      <h1 class="text-2xl font-bold text-slate-800">⚙️ 系统设置与数据管理</h1>
      <p class="text-xs text-slate-500 mt-1">
        配置 Supabase 云端同步、备份/恢复本地刷题进度、重置数据
      </p>
    </div>

    <!-- 1. Supabase Cloud Sync Card -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
            ⚡
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-800">Supabase 云端数据库</h2>
            <p class="text-xs text-slate-500">已接入官方 Free 实例，支持跨端多设备数据同步</p>
          </div>
        </div>
        <span 
          :class="[
            'px-3 py-1 rounded-full text-xs font-semibold border',
            authStore.syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
          ]"
        >
          {{ authStore.syncStatus === 'synced' ? '云端已连接' : '本地离线模式' }}
        </span>
      </div>

      <!-- SQL Script Box -->
      <div class="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>📄</span> Supabase 数据库一键建表脚本 (SQL)
          </span>
          <button
            @click="copySql"
            class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors shadow-2xs"
          >
            {{ isCopied ? '已复制到剪贴板 ✅' : '复制建表 SQL' }}
          </button>
        </div>
        <p class="text-xs text-slate-500 leading-relaxed">
          若需在 Supabase 开启云端持久化同步，请前往 
          <a href="https://supabase.com/dashboard" target="_blank" class="text-emerald-600 underline font-semibold">Supabase 控制台</a> 
          ➔ <strong>SQL Editor</strong>，将下方脚本粘贴并点击 <strong>Run</strong> 执行即可：
        </p>
        <pre class="bg-slate-900 text-emerald-400 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40 leading-relaxed">{{ SUPABASE_SQL_SCHEMA }}</pre>
      </div>

      <!-- Vercel Deployment Guide -->
      <div class="p-5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2 text-xs text-blue-900">
        <div class="font-bold flex items-center gap-1.5">
          <span>▲</span> 部署到 Vercel 说明
        </div>
        <p class="leading-relaxed text-blue-800">
          本项目已配置好 <code>vercel.json</code>。在 Vercel 导入代码仓库后，请在 <strong>Settings -> Environment Variables</strong> 中添加：
        </p>
        <div class="font-mono bg-white/80 p-2.5 rounded-lg border border-blue-200 space-y-1 text-[11px]">
          <div>VITE_SUPABASE_URL = https://saigwpqwinueodihnvib.supabase.co</div>
          <div>VITE_SUPABASE_ANON_KEY = sb_publishable_Ml61D5xU_pgC2DIjRhzERw_G5HiKac6</div>
        </div>
      </div>
    </div>

    <!-- 2. Local Backup & Reset -->
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
          <div class="text-xs font-bold text-rose-600">重置所有进度</div>
          <div class="text-[11px] text-slate-400">将清除所有已做题目的艾宾浩斯阶段、错题记录和打卡历史</div>
        </div>
        <button
          @click="handleReset"
          class="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
        >
          重置学习数据
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuizStore } from '../stores/quizStore'
import { useAuthStore } from '../stores/authStore'
import { SUPABASE_SQL_SCHEMA } from '../services/supabase'

const quizStore = useQuizStore()
const authStore = useAuthStore()
const isCopied = ref(false)

function copySql() {
  navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA)
  isCopied.value = true
  setTimeout(() => isCopied.value = false, 3000)
}

function exportData() {
  const data = {
    progress: quizStore.progressMap,
    dailyLogs: quizStore.dailyLogs,
    exportedAt: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dianwang_ebbinghaus_backup_${new Date().toISOString().split('T')[0]}.json`
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
        localStorage.setItem('dianwang_ebbinghaus_progress_v2', JSON.stringify(data.progress))
        if (data.dailyLogs) localStorage.setItem('dianwang_study_logs_v2', JSON.stringify(data.dailyLogs))
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
  if (confirm('确定要清空所有刷题记录吗？此操作无法恢复！')) {
    if (confirm('请再次确认：清空后将从第 1 题开始重新排程。')) {
      quizStore.resetAllProgress()
      alert('已重置所有学习数据。')
    }
  }
}
</script>
