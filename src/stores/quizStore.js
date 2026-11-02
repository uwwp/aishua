import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import defaultQuestionsRaw from '../data/all_questions.json'
import { calculateNextReview, isQuestionDue } from '../services/ebbinghaus'
import { getSupabaseClient } from '../services/supabase'
import { useAuthStore } from './authStore'

const STORAGE_KEY_PROGRESS = 'dianwang_ebbinghaus_progress_v2'
const STORAGE_KEY_STUDY_LOGS = 'dianwang_study_logs_v2'
const STORAGE_KEY_CUSTOM_BANKS = 'aishua_custom_banks_v1'
const STORAGE_KEY_ACTIVE_BANK = 'aishua_active_bank_id'

const BUILTIN_BANK_ID = 'default_bank'

export const useQuizStore = defineStore('quiz', () => {
  // 1. 默认内置题库
  const defaultBank = {
    id: BUILTIN_BANK_ID,
    name: '国家电网核心精选题库',
    description: '包含形势政策、企业文化、公司战略、新型电力系统、品牌建设五大模块',
    questions: defaultQuestionsRaw,
    isBuiltIn: true
  }

  // 2. 自定义题库列表 (从 LocalStorage 读取)
  const customBanks = ref([])
  try {
    const savedBanks = localStorage.getItem(STORAGE_KEY_CUSTOM_BANKS)
    if (savedBanks) {
      customBanks.value = JSON.parse(savedBanks)
    }
  } catch (e) {
    console.warn('Failed to parse custom banks', e)
  }

  // 当前选中题库 ID
  const activeBankId = ref(localStorage.getItem(STORAGE_KEY_ACTIVE_BANK) || BUILTIN_BANK_ID)

  // 当前可用的所有题库列表
  const allBanks = computed(() => {
    return [
      {
        id: defaultBank.id,
        name: defaultBank.name,
        description: defaultBank.description,
        count: defaultBank.questions.length,
        isBuiltIn: true
      },
      ...customBanks.value.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description || '用户自定义导入题库',
        count: b.questions?.length || 0,
        isBuiltIn: false
      }))
    ]
  })

  // 当前激活的题库对象
  const currentBank = computed(() => {
    if (activeBankId.value === BUILTIN_BANK_ID) {
      return defaultBank
    }
    const found = customBanks.value.find(b => b.id === activeBankId.value)
    return found || defaultBank
  })

  // 当前激活题库的全部题目
  const questions = computed(() => {
    return currentBank.value.questions || []
  })

  // 切换题库
  function switchBank(bankId) {
    activeBankId.value = bankId
    localStorage.setItem(STORAGE_KEY_ACTIVE_BANK, bankId)
    loadLocalProgress()
  }

  // 导入新的自定义题库
  function importCustomBank({ name, description = '', questionsList = [] }) {
    if (!questionsList.length) {
      throw new Error('导入的题目数量不能为空！')
    }

    // 格式化与规范化题目
    const normalized = questionsList.map((item, idx) => {
      const qType = item.type || (item.options?.C ? (Array.isArray(item.answer) ? '多选题' : '单选题') : '判断题')
      return {
        id: item.id || (idx + 1),
        type: qType,
        category: item.category || '综合练习',
        question: item.question || item.title || '',
        options: item.options || { A: item.optionA, B: item.optionB, C: item.optionC, D: item.optionD },
        answer: item.answer || 'A',
        answer_str: Array.isArray(item.answer) ? item.answer.join('、') : (item.answer || 'A')
      }
    })

    const newBank = {
      id: 'bank_' + Date.now(),
      name: name || `自定义题库 (${new Date().toLocaleDateString()})`,
      description,
      questions: normalized,
      createdAt: new Date().toISOString()
    }

    customBanks.value.push(newBank)
    localStorage.setItem(STORAGE_KEY_CUSTOM_BANKS, JSON.stringify(customBanks.value))
    
    // 自动切换为新导入的题库
    switchBank(newBank.id)
    return newBank
  }

  // 删除自定义题库
  function deleteCustomBank(bankId) {
    if (bankId === BUILTIN_BANK_ID) {
      throw new Error('内置基础题库不支持删除')
    }
    customBanks.value = customBanks.value.filter(b => b.id !== bankId)
    localStorage.setItem(STORAGE_KEY_CUSTOM_BANKS, JSON.stringify(customBanks.value))
    if (activeBankId.value === bankId) {
      switchBank(BUILTIN_BANK_ID)
    }
  }

  // 题目进度字典: { [questionId]: { ...progress } }
  const progressMap = ref({})
  const dailyLogs = ref({})

  function getStorageKeyForProgress() {
    return `${STORAGE_KEY_PROGRESS}_${activeBankId.value}`
  }

  // 初始化加载本地进度
  function loadLocalProgress() {
    try {
      const key = getStorageKeyForProgress()
      const saved = localStorage.getItem(key) || (activeBankId.value === BUILTIN_BANK_ID ? localStorage.getItem(STORAGE_KEY_PROGRESS) : null)
      if (saved) {
        progressMap.value = JSON.parse(saved)
      } else {
        progressMap.value = {}
      }

      const savedLogs = localStorage.getItem(STORAGE_KEY_STUDY_LOGS)
      if (savedLogs) {
        dailyLogs.value = JSON.parse(savedLogs)
      }
    } catch (e) {
      console.warn('Failed to parse local storage progress', e)
    }
  }

  // 保存到本地 LocalStorage
  function saveLocalProgress() {
    try {
      const key = getStorageKeyForProgress()
      localStorage.setItem(key, JSON.stringify(progressMap.value))
      if (activeBankId.value === BUILTIN_BANK_ID) {
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressMap.value))
      }
      localStorage.setItem(STORAGE_KEY_STUDY_LOGS, JSON.stringify(dailyLogs.value))
    } catch (e) {
      console.error('LocalStorage write failed:', e)
    }
  }

  // 云端同步：从云端拉取 (仅限已注册登录用户)
  async function syncFromCloud() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    const client = getSupabaseClient()
    if (!client) return

    authStore.syncStatus = 'syncing'

    try {
      const { data, error } = await client
        .from('user_question_progress')
        .select('*')
        .eq('user_id', authStore.user.id)

      if (error) {
        console.warn('Cloud progress fetch failed:', error.message)
        authStore.syncStatus = 'synced'
        return
      }

      if (data && data.length > 0) {
        data.forEach(item => {
          const qId = item.question_id
          const local = progressMap.value[qId]
          if (!local || (new Date(item.updated_at).getTime() > new Date(local.last_reviewed_at || 0).getTime())) {
            progressMap.value[qId] = {
              question_id: qId,
              stage: item.stage ?? 0,
              review_count: item.review_count ?? 0,
              wrong_count: item.wrong_count ?? 0,
              last_reviewed_at: item.last_reviewed_at,
              next_review_at: item.next_review_at,
              is_favorite: !!item.is_favorite,
              in_wrong_book: !!item.in_wrong_book,
            }
          }
        })
        saveLocalProgress()
      } else {
        await syncLocalToCloud()
      }
      authStore.recordSyncSuccess()
    } catch (err) {
      console.warn('Sync from cloud error:', err)
      authStore.syncStatus = 'synced'
    }
  }

  // 云端同步：将本地已做题目全量上传至用户云端账户
  async function syncLocalToCloud() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    const client = getSupabaseClient()
    if (!client) return

    const items = Object.values(progressMap.value).map(p => ({
      user_id: authStore.user.id,
      question_id: p.question_id,
      stage: p.stage ?? 0,
      review_count: p.review_count ?? 0,
      wrong_count: p.wrong_count ?? 0,
      last_reviewed_at: p.last_reviewed_at || new Date().toISOString(),
      next_review_at: p.next_review_at || new Date().toISOString(),
      is_favorite: !!p.is_favorite,
      in_wrong_book: !!p.in_wrong_book,
      updated_at: new Date().toISOString()
    }))

    if (!items.length) {
      authStore.recordSyncSuccess()
      return
    }

    authStore.syncStatus = 'syncing'

    try {
      for (let i = 0; i < items.length; i += 100) {
        const chunk = items.slice(i, i + 100)
        await client.from('user_question_progress').upsert(chunk, { onConflict: 'user_id,question_id' })
      }
      authStore.recordSyncSuccess()
    } catch (err) {
      console.warn('Batch upload local progress failed:', err)
      authStore.syncStatus = 'synced'
    }
  }

  // 手动全量同步
  async function performManualSync() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      throw new Error('请先注册或登录账号，未登录无法同步至云端')
    }
    await syncFromCloud()
    await syncLocalToCloud()
    return true
  }

  // 云端同步：做题时异步自动推送 (受 isAutoSync 开关控制)
  async function pushProgressToCloud(progress) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated || !authStore.isAutoSync) return

    const client = getSupabaseClient()
    if (!client) return

    try {
      await client.from('user_question_progress').upsert({
        user_id: authStore.user.id,
        question_id: progress.question_id,
        stage: progress.stage,
        review_count: progress.review_count,
        wrong_count: progress.wrong_count,
        last_reviewed_at: progress.last_reviewed_at,
        next_review_at: progress.next_review_at,
        is_favorite: progress.is_favorite,
        in_wrong_book: progress.in_wrong_book,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,question_id' })
      authStore.recordSyncSuccess()
    } catch (err) {
      console.warn('Silent cloud sync failed:', err)
    }
  }

  // 记录答题并触发记忆阶段更新
  function recordAnswer({ questionId, userAnswer, isCorrect, mode = 'practice' }) {
    const current = progressMap.value[questionId] || {
      question_id: questionId,
      stage: 0,
      review_count: 0,
      wrong_count: 0,
      last_reviewed_at: null,
      next_review_at: null,
      is_favorite: false,
      in_wrong_book: false,
    }

    const { nextStage, nextReviewAt } = calculateNextReview(current.stage, isCorrect)

    const updated = {
      ...current,
      question_id: questionId,
      stage: nextStage,
      review_count: (current.review_count || 0) + 1,
      wrong_count: isCorrect ? (current.wrong_count || 0) : (current.wrong_count || 0) + 1,
      last_reviewed_at: new Date().toISOString(),
      next_review_at: nextReviewAt,
      in_wrong_book: isCorrect ? (nextStage >= 3 ? false : current.in_wrong_book) : true,
    }

    progressMap.value[questionId] = updated

    const today = new Date().toISOString().split('T')[0]
    if (!dailyLogs.value[today]) {
      dailyLogs.value[today] = { total: 0, correct: 0 }
    }
    dailyLogs.value[today].total += 1
    if (isCorrect) dailyLogs.value[today].correct += 1

    saveLocalProgress()
    pushProgressToCloud(updated)

    return updated
  }

  function toggleFavorite(questionId) {
    const current = progressMap.value[questionId] || {
      question_id: questionId,
      stage: 0,
      review_count: 0,
      wrong_count: 0,
      last_reviewed_at: null,
      next_review_at: null,
      is_favorite: false,
      in_wrong_book: false,
    }
    current.is_favorite = !current.is_favorite
    progressMap.value[questionId] = { ...current }
    saveLocalProgress()
    pushProgressToCloud(progressMap.value[questionId])
    return current.is_favorite
  }

  function removeFromWrongBook(questionId) {
    if (progressMap.value[questionId]) {
      progressMap.value[questionId].in_wrong_book = false
      saveLocalProgress()
      pushProgressToCloud(progressMap.value[questionId])
    }
  }

  function clearWrongBook() {
    Object.keys(progressMap.value).forEach(qId => {
      if (progressMap.value[qId]) {
        progressMap.value[qId].in_wrong_book = false
      }
    })
    saveLocalProgress()
  }

  function resetAllProgress() {
    progressMap.value = {}
    dailyLogs.value = {}
    localStorage.removeItem(getStorageKeyForProgress())
    if (activeBankId.value === BUILTIN_BANK_ID) {
      localStorage.removeItem(STORAGE_KEY_PROGRESS)
    }
    localStorage.removeItem(STORAGE_KEY_STUDY_LOGS)
  }

  // --- 统计指标 Getters ---

  const totalCount = computed(() => questions.value.length)

  const learnedCount = computed(() => {
    return Object.values(progressMap.value).filter(p => (p.review_count || 0) > 0).length
  })

  const unlearnedCount = computed(() => Math.max(0, totalCount.value - learnedCount.value))

  const masteredCount = computed(() => {
    return Object.values(progressMap.value).filter(p => p.stage === 6).length
  })

  const learningCount = computed(() => {
    return Object.values(progressMap.value).filter(p => p.stage >= 1 && p.stage <= 5).length
  })

  const dueTodayQuestions = computed(() => {
    return questions.value.filter(q => {
      const p = progressMap.value[q.id]
      if (!p || (p.review_count || 0) === 0) return false
      if (p.stage === 6) return false
      return isQuestionDue(p.next_review_at)
    })
  })

  const dueTodayCount = computed(() => dueTodayQuestions.value.length)

  const newQuestions = computed(() => {
    return questions.value.filter(q => {
      const p = progressMap.value[q.id]
      return !p || (p.review_count || 0) === 0
    })
  })

  const wrongQuestions = computed(() => {
    return questions.value.filter(q => {
      const p = progressMap.value[q.id]
      return p && p.in_wrong_book
    })
  })

  const favoriteQuestions = computed(() => {
    return questions.value.filter(q => {
      const p = progressMap.value[q.id]
      return p && p.is_favorite
    })
  })

  const stageDistribution = computed(() => {
    const dist = [0, 0, 0, 0, 0, 0, 0]
    questions.value.forEach(q => {
      const p = progressMap.value[q.id]
      if (!p || (p.review_count || 0) === 0) {
        dist[0]++
      } else {
        const stage = Math.min(Math.max(p.stage || 0, 0), 6)
        dist[stage]++
      }
    })
    return dist
  })

  // 动态提取所属分类统计
  const categoryStats = computed(() => {
    const catMap = {}
    questions.value.forEach(q => {
      const cat = q.category || '综合分类'
      if (!catMap[cat]) {
        catMap[cat] = []
      }
      catMap[cat].push(q)
    })

    return Object.keys(catMap).map(catName => {
      const catQuestions = catMap[catName]
      const total = catQuestions.length
      const learned = catQuestions.filter(q => {
        const p = progressMap.value[q.id]
        return p && (p.review_count || 0) > 0
      }).length
      const mastered = catQuestions.filter(q => {
        const p = progressMap.value[q.id]
        return p && p.stage === 6
      }).length
      const wrong = catQuestions.filter(q => {
        const p = progressMap.value[q.id]
        return p && p.in_wrong_book
      }).length

      return {
        name: catName.replace(/^第[一二三四五六七八九十]+部分/, ''),
        fullName: catName,
        total,
        learned,
        mastered,
        wrong,
        progressPercent: total ? Math.round((learned / total) * 100) : 0,
        masterPercent: total ? Math.round((mastered / total) * 100) : 0
      }
    })
  })

  // 动态提取题型统计
  const typeStats = computed(() => {
    const types = ['单选题', '多选题', '判断题']
    return types.map(typeName => {
      const typeQuestions = questions.value.filter(q => q.type === typeName)
      const total = typeQuestions.length
      const learned = typeQuestions.filter(q => {
        const p = progressMap.value[q.id]
        return p && (p.review_count || 0) > 0
      }).length
      const mastered = typeQuestions.filter(q => {
        const p = progressMap.value[q.id]
        return p && p.stage === 6
      }).length
      const wrong = typeQuestions.filter(q => {
        const p = progressMap.value[q.id]
        return p && p.in_wrong_book
      }).length

      return {
        type: typeName,
        total,
        learned,
        mastered,
        wrong,
        percent: total ? Math.round((learned / total) * 100) : 0
      }
    })
  })

  const streakDays = computed(() => {
    const dates = Object.keys(dailyLogs.value).sort().reverse()
    if (!dates.length) return 0
    let streak = 0
    let checkDate = new Date()

    const todayStr = checkDate.toISOString().split('T')[0]
    let currentCheckStr = todayStr

    if (!dailyLogs.value[todayStr]) {
      checkDate.setDate(checkDate.getDate() - 1)
      currentCheckStr = checkDate.toISOString().split('T')[0]
      if (!dailyLogs.value[currentCheckStr]) {
        return 0
      }
    }

    while (dailyLogs.value[currentCheckStr]) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
      currentCheckStr = checkDate.toISOString().split('T')[0]
    }
    return streak
  })

  const todayAnsweredCount = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return dailyLogs.value[today]?.total || 0
  })

  loadLocalProgress()

  return {
    questions,
    allBanks,
    currentBank,
    activeBankId,
    progressMap,
    dailyLogs,
    totalCount,
    learnedCount,
    unlearnedCount,
    masteredCount,
    learningCount,
    dueTodayQuestions,
    dueTodayCount,
    newQuestions,
    wrongQuestions,
    favoriteQuestions,
    stageDistribution,
    categoryStats,
    typeStats,
    streakDays,
    todayAnsweredCount,
    switchBank,
    importCustomBank,
    deleteCustomBank,
    recordAnswer,
    toggleFavorite,
    removeFromWrongBook,
    clearWrongBook,
    resetAllProgress,
    syncFromCloud,
    syncLocalToCloud,
    performManualSync
  }
})
