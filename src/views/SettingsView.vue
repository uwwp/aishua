<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
    <!-- Header -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
      <h1 class="text-2xl font-bold text-slate-800">⚙️ 系统设置与题库管理</h1>
      <p class="text-xs text-slate-500 mt-1">
        切换与管理当前默认题库、导入专属自定义题库、设置多端数据同步与备份
      </p>
    </div>

    <!-- 1. 题库管理与切换 (设为默认题库) -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
            📚
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-800">当前题库与切换管理</h2>
            <p class="text-xs text-slate-500">选择的题库将作为系统的默认题库，做题进度与排程独立维护</p>
          </div>
        </div>

        <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          当前默认：{{ quizStore.currentBank.name }} ({{ quizStore.totalCount }}题)
        </span>
      </div>

      <!-- 题库卡片列表 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="b in quizStore.allBanks"
          :key="b.id"
          :class="[
            'p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3',
            b.id === quizStore.activeBankId
              ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
          ]"
        >
          <div>
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-bold text-sm text-slate-800 leading-snug">
                {{ b.name }}
              </h3>
              <span
                :class="[
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                  b.isBuiltIn ? 'bg-slate-200 text-slate-700' : 'bg-teal-100 text-teal-800'
                ]"
              >
                {{ b.isBuiltIn ? '系统内置' : '自定义' }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2">
              {{ b.description || '自定义导入题库' }}
            </p>
          </div>

          <div class="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span class="text-slate-500 font-mono font-medium">共 {{ b.count }} 题</span>

            <div class="flex items-center gap-2">
              <button
                v-if="!b.isBuiltIn"
                @click.stop="handleDeleteBank(b)"
                class="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-[11px]"
                title="删除此自定义题库"
              >
                删除
              </button>

              <button
                v-if="b.id !== quizStore.activeBankId"
                @click="handleSelectBank(b.id)"
                class="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 font-medium text-xs transition-colors shadow-2xs"
              >
                设为默认题库
              </button>
              <span
                v-else
                class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xs flex items-center gap-1"
              >
                <span>✓</span>
                <span>当前默认</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 自定义题库导入中心 (登录用户支持，含3种题型 JSON/CSV 样例) -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg">
            📥
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-800">自定义题库导入中心</h2>
            <p class="text-xs text-slate-500">支持登录用户上传专属题库（JSON 或 CSV 格式），并自动同步多端</p>
          </div>
        </div>

        <span
          :class="[
            'px-3 py-1 rounded-full text-xs font-semibold border',
            authStore.isAuthenticated ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-200'
          ]"
        >
          {{ authStore.isAuthenticated ? '✓ 导入权限已解锁' : '🔒 需登录后导入' }}
        </span>
      </div>

      <!-- 未登录用户展示引导提示 -->
      <div
        v-if="!authStore.isAuthenticated"
        class="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between flex-wrap gap-4"
      >
        <div class="space-y-1">
          <div class="font-bold text-sm text-amber-900 flex items-center gap-1.5">
            <span>🔐</span> 登录后即可解锁自定义题库导入
          </div>
          <p class="text-xs text-amber-800/80 leading-relaxed">
            注册并登录账号后，您可以上传任意专业科目、行业考试或考证题库，数据将在云端与本地同步保存。
          </p>
        </div>
        <button
          @click="isSyncModalOpen = true"
          class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          立即注册 / 登录
        </button>
      </div>

      <!-- 已登录用户展示题库导入表单 -->
      <div v-else class="space-y-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">题库名称 *</label>
            <input
              v-model="importForm.name"
              type="text"
              placeholder="例如：大学英语四级核心词汇 / 综合通识真题"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">题库简介 (选填)</label>
            <input
              v-model="importForm.description"
              type="text"
              placeholder="简要说明此题库的考试范围或模块"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <!-- 导入数据输入区 (支持选择文件或直接粘贴) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="text-xs font-bold text-slate-700">题库题目数据 (支持 JSON 或 CSV) *</span>
            <div class="flex items-center gap-2">
              <label class="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-2xs">
                <span>📁 选择本地文件 (.json / .csv)</span>
                <input type="file" accept=".json,.csv,.txt" @change="handleFileUpload" class="hidden" />
              </label>
              <button
                @click="fillSampleData"
                class="px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 text-xs font-medium transition-colors"
                title="快速将下方的三种题型样例载入输入框测试"
              >
                ✨ 填入样例数据测试
              </button>
            </div>
          </div>

          <textarea
            v-model="importForm.rawContent"
            rows="6"
            placeholder="请在此粘贴题目数据（支持 JSON 数组或 CSV 文本），或点击上方“选择本地文件”上传..."
            class="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
          ></textarea>
        </div>

        <div class="flex items-center justify-between pt-1">
          <span class="text-[11px] text-slate-400">
            导入后系统将自动识别题型并设为默认题库
          </span>
          <button
            @click="executeImport"
            :disabled="isImporting"
            class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <span>🚀 确认导入并设为默认题库</span>
          </button>
        </div>
      </div>

      <!-- 3. 题目格式样例展示区 (三种题型：单选、多选、判断) -->
      <div class="space-y-3 pt-2">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-700">📋 题库格式样例说明 (包含单选、多选、判断题)</span>
          </div>

          <!-- 格式切换器 -->
          <div class="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <button
              @click="activeSampleTab = 'json'"
              :class="[
                'px-3 py-1 rounded-lg font-medium transition-colors',
                activeSampleTab === 'json' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              ]"
            >
              JSON 格式样例
            </button>
            <button
              @click="activeSampleTab = 'csv'"
              :class="[
                'px-3 py-1 rounded-lg font-medium transition-colors',
                activeSampleTab === 'csv' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              ]"
            >
              CSV / Excel 样例
            </button>
          </div>
        </div>

        <!-- 样例代码框 -->
        <div class="relative bg-slate-900 rounded-2xl p-4 text-[11px] font-mono text-emerald-300 overflow-hidden">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5 text-slate-400 text-[11px]">
            <span>{{ activeSampleTab === 'json' ? 'sample_questions.json' : 'sample_questions.csv' }}</span>
            <button
              @click="copyActiveSample"
              class="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-[11px] transition-colors"
            >
              {{ isSampleCopied ? '已复制样例 ✅' : '一键复制样例' }}
            </button>
          </div>

          <pre class="overflow-x-auto max-h-56 leading-relaxed select-all">{{ activeSampleTab === 'json' ? JSON_SAMPLE : CSV_SAMPLE }}</pre>
        </div>

        <div class="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
          <span>• <strong>单选题</strong>：包含 A/B/C/D 选项，answer 为单个选项字母（如 "A"）。</span>
          <span>• <strong>多选题</strong>：包含 A/B/C/D 选项，answer 为数组（如 ["A","B"]）或字母组合（如 "AB"）。</span>
          <span>• <strong>判断题</strong>：选项为 正确/错误，answer 为 "A" 或 "B"。</span>
        </div>
      </div>
    </div>

    <!-- 3. 云端数据多端同步中心 (已移除 SQL 初始化脚本) -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
            ☁️
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-800">云端多端同步中心</h2>
            <p class="text-xs text-slate-500">支持手机、电脑、平板跨设备无缝同步当前题库进度与错题记录</p>
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
    </div>

    <!-- 4. 本地备份与恢复 -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div>
        <h2 class="text-base font-bold text-slate-800">💾 本地数据备份与还原</h2>
        <p class="text-xs text-slate-500 mt-0.5">随时导出当前题库的做题进度 JSON 文件，或导入到其他浏览器中</p>
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
          <div class="text-[11px] text-slate-400">将清除当前题库本地已做题目的记忆阶段、错题记录和打卡历史</div>
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
import { ref, reactive } from 'vue'
import { useQuizStore } from '../stores/quizStore'
import { useAuthStore } from '../stores/authStore'
import { JSON_SAMPLE, CSV_SAMPLE, parseQuestionsData } from '../utils/bankParser'
import SyncModal from '../components/SyncModal.vue'

const quizStore = useQuizStore()
const authStore = useAuthStore()

const isManualSyncing = ref(false)
const isSyncModalOpen = ref(false)

// 样例 Tab 与复制状态
const activeSampleTab = ref('json')
const isSampleCopied = ref(false)

// 导入表单
const isImporting = ref(false)
const importForm = reactive({
  name: '',
  description: '',
  rawContent: ''
})

function handleSelectBank(bankId) {
  quizStore.switchBank(bankId)
  alert('已成功切换并设为默认题库！')
}

function handleDeleteBank(bank) {
  if (confirm(`确认删除题库 "${bank.name}" 吗？该题库的本地刷题进度也将被清理。`)) {
    quizStore.deleteCustomBank(bank.id)
    alert('题库已成功删除。')
  }
}

function copyActiveSample() {
  const sampleText = activeSampleTab.value === 'json' ? JSON_SAMPLE : CSV_SAMPLE
  navigator.clipboard.writeText(sampleText)
  isSampleCopied.value = true
  setTimeout(() => isSampleCopied.value = false, 2500)
}

function fillSampleData() {
  importForm.name = activeSampleTab.value === 'json' ? '测试通用精选题库 (JSON)' : '测试综合通识题库 (CSV)'
  importForm.description = '涵盖单选题、多选题、判断题三种经典题型'
  importForm.rawContent = activeSampleTab.value === 'json' ? JSON_SAMPLE : CSV_SAMPLE
}

function handleFileUpload(e) {
  const file = e.target.files[0]
  if (!file) return

  if (!importForm.name) {
    importForm.name = file.name.replace(/\.[^/.]+$/, '')
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    importForm.rawContent = event.target.result
  }
  reader.readAsText(file)
}

function executeImport() {
  if (!authStore.isAuthenticated) {
    alert('请先登录云端账号后再导入题库！')
    isSyncModalOpen.value = true
    return
  }

  if (!importForm.name.trim()) {
    alert('请输入题库名称')
    return
  }
  if (!importForm.rawContent.trim()) {
    alert('请输入或上传题目数据')
    return
  }

  isImporting.value = true
  try {
    const questions = parseQuestionsData(importForm.rawContent)
    if (!questions.length) {
      throw new Error('未解析出有效题目数据')
    }

    const created = quizStore.importCustomBank({
      name: importForm.name.trim(),
      description: importForm.description.trim(),
      questionsList: questions
    })

    alert(`🎉 题库 "${created.name}" 导入成功！共导入 ${questions.length} 道题目，已自动设为当前默认题库。`)

    // 清空表单
    importForm.name = ''
    importForm.description = ''
    importForm.rawContent = ''
  } catch (err) {
    alert('导入失败: ' + err.message)
  } finally {
    isImporting.value = false
  }
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
