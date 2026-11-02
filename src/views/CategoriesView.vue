<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
    <!-- Header -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold text-slate-800">📑 知识专题与题库管理</h1>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            当前: {{ quizStore.currentBank.name }}
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-1">
          分模块击破薄弱环节，支持多题库切换与自定义题库导入，自动接入科学记忆排程
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          @click="isImportModalOpen = true"
          class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
        >
          <span>＋</span>
          <span>导入自定义题库</span>
        </button>

        <router-link
          to="/practice?mode=all"
          class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
        >
          题库全量刷题 ({{ quizStore.totalCount }}题)
        </router-link>
      </div>
    </div>

    <!-- 0. 题库列表与切换卡片 (多题库刷题支持) -->
    <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-base font-bold text-slate-800">📚 已挂载题库列表 ({{ quizStore.allBanks.length }})</span>
          <span class="text-xs text-slate-400">点击即可一键切换当前刷题库</span>
        </div>
        <button
          @click="isImportModalOpen = true"
          class="text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline"
        >
          导入外部题库 (JSON)
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="b in quizStore.allBanks"
          :key="b.id"
          :class="[
            'p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 cursor-pointer',
            b.id === quizStore.activeBankId 
              ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' 
              : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
          ]"
          @click="quizStore.switchBank(b.id)"
        >
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-800">{{ b.name }}</span>
              <span 
                :class="[
                  'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                  b.id === quizStore.activeBankId ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                ]"
              >
                {{ b.id === quizStore.activeBankId ? '当前激活' : '点击切换' }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {{ b.description }}
            </p>
          </div>

          <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
            <span class="text-slate-400 font-mono">共 {{ b.count }} 道试题</span>
            <div class="flex items-center gap-2">
              <span v-if="b.isBuiltIn" class="text-[10px] text-emerald-700 font-medium bg-emerald-100/60 px-1.5 py-0.5 rounded">系统内置</span>
              <button 
                v-else
                @click.stop="handleDeleteBank(b.id, b.name)"
                class="text-[11px] text-rose-500 hover:text-rose-700 font-medium"
              >
                删除题库
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 1. 当前题库的分类专题 -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="text-base font-bold text-slate-800">🏛️ 当前题库分类专题 ({{ quizStore.categoryStats.length }})</span>
        <span class="text-xs text-slate-400">共 {{ quizStore.totalCount }} 道试题</span>
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
                {{ cat.name }}
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

    <!-- 2. 基础题型专攻 -->
    <div class="space-y-4 pt-4">
      <div class="flex items-center gap-2">
        <span class="text-base font-bold text-slate-800">🎯 题型专项攻坚</span>
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

    <!-- 自定义题库导入模态弹窗 -->
    <div v-if="isImportModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">📥</span>
            <h3 class="font-bold text-slate-800 text-base">导入自定义题库 (JSON)</h3>
          </div>
          <button @click="isImportModalOpen = false" class="text-slate-400 hover:text-slate-600 p-1">
            ✕
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">题库名称</label>
            <input 
              v-model="importBankName" 
              type="text" 
              placeholder="例如：计算机二级等级考试 / 英语词汇精选" 
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">题库简介 (可选)</label>
            <input 
              v-model="importBankDesc" 
              type="text" 
              placeholder="简要描述题库涵盖的考点与知识范围" 
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="font-semibold text-slate-700">题目数据 (上传文件或粘贴 JSON)</label>
              <button @click="fillSampleData" class="text-[11px] text-emerald-600 underline">填入示范样例</button>
            </div>
            <textarea 
              v-model="importJsonText" 
              rows="5" 
              placeholder='[ { "question": "题目内容", "options": { "A": "选项A", "B": "选项B" }, "answer": "A" } ]'
              class="w-full font-mono text-[11px] p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-slate-500">或者选择本地 JSON 文件：</span>
            <input type="file" accept=".json" @change="handleFileUpload" class="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button @click="isImportModalOpen = false" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold">
            取消
          </button>
          <button @click="executeImport" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs">
            确认导入并切换
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuizStore } from '../stores/quizStore'

const quizStore = useQuizStore()

const isImportModalOpen = ref(false)
const importBankName = ref('')
const importBankDesc = ref('')
const importJsonText = ref('')

function handleDeleteBank(bankId, bankName) {
  if (confirm(`确定要删除题库「${bankName}」吗？`)) {
    quizStore.deleteCustomBank(bankId)
  }
}

function handleFileUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    importJsonText.value = event.target.result
    if (!importBankName.value) {
      importBankName.value = file.name.replace(/\.[^/.]+$/, '')
    }
  }
  reader.readAsText(file)
}

function fillSampleData() {
  importBankName.value = '示范通用题库'
  importBankDesc.value = '涵盖单选、多选、判断题的通用测试题库'
  importJsonText.value = JSON.stringify([
    {
      "id": 1,
      "type": "单选题",
      "category": "综合通识",
      "question": "中国空间站核心舱的名称是？",
      "options": {
        "A": "问天",
        "B": "天和",
        "C": "梦天",
        "D": "天舟"
      },
      "answer": "B"
    },
    {
      "id": 2,
      "type": "多选题",
      "category": "科技常识",
      "question": "下列属于现代信息技术核心支柱的有？",
      "options": {
        "A": "微电子技术",
        "B": "计算机技术",
        "C": "通信技术",
        "D": "机械重工"
      },
      "answer": ["A", "B", "C"]
    },
    {
      "id": 3,
      "type": "判断题",
      "category": "常识判断",
      "question": "太阳系中最大的行星是木星。（）",
      "options": {
        "A": "正确",
        "B": "错误"
      },
      "answer": "A"
    }
  ], null, 2)
}

function executeImport() {
  if (!importJsonText.value.trim()) {
    alert('请粘贴或上传题库 JSON 内容！')
    return
  }

  try {
    const list = JSON.parse(importJsonText.value)
    if (!Array.isArray(list)) {
      alert('题库数据必须为数组格式 [ { ... }, { ... } ]')
      return
    }

    quizStore.importCustomBank({
      name: importBankName.value.trim() || '自定义导入题库',
      description: importBankDesc.value.trim(),
      questionsList: list
    })

    alert(`成功导入题库，共 ${list.length} 道试题，已自动切换为当前做题题库！`)
    isImportModalOpen.value = false
    importBankName.value = ''
    importBankDesc.value = ''
    importJsonText.value = ''
  } catch (err) {
    alert('解析 JSON 失败: ' + err.message)
  }
}
</script>
