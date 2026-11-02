import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import allQuestionsRaw from '../data/all_questions.json'
import { calculateNextReview, isQuestionDue } from '../services/ebbinghaus'
import { getSupabaseClient } from '../services/supabase'
import { useAuthStore } from './authStore'

const STORAGE_KEY_PROGRESS = 'dianwang_ebbinghaus_progress_v2'
const STORAGE_KEY_STUDY_LOGS = 'dianwang_study_logs_v2'

export const useQuizStore = defineStore('quiz', () => {
  // 1. 全部静态题目数据
  const questions = ref(allQuestionsRaw)

  // 2. 题目进度字典: { [questionId]: { ...progress } }
  const progressMap = ref({})

  // 3. 每日打卡历史: { 'YYYY-MM-DD': { total: 0, correct: 0 } }
  const dailyLogs = ref({})

  // 初始化加载本地进度
  function loadLocalProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS)
      if (saved) {
        progressMap.value = JSON.parse(saved)
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
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressMap.value))
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

  // 手动全量同步 (拉取云端合并后推送到云端)
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

  // 记录答题并触发艾宾浩斯更新
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

    // 记录今日学习历史
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

  // 切换收藏状态
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

  // 移出错题本
  function removeFromWrongBook(questionId) {
    if (progressMap.value[questionId]) {
      progressMap.value[questionId].in_wrong_book = false
      saveLocalProgress()
      pushProgressToCloud(progressMap.value[questionId])
    }
  }

  // 清空全部错题本
  function clearWrongBook() {
    Object.keys(progressMap.value).forEach(qId => {
      if (progressMap.value[qId]) {
        progressMap.value[qId].in_wrong_book = false
      }
    })
    saveLocalProgress()
  }

  // 重置全部学习进度
  function resetAllProgress() {
    progressMap.value = {}
    dailyLogs.value = {}
    localStorage.removeItem(STORAGE_KEY_PROGRESS)
    localStorage.removeItem(STORAGE_KEY_STUDY_LOGS)
  }

  // --- 统计指标 Getters ---

  const totalCount = computed(() => questions.value.length) // 832

  const learnedCount = computed(() => {
    return Object.values(progressMap.value).filter(p => (p.review_count || 0) > 0).length
  })

  const unlearnedCount = computed(() => totalCount.value - learnedCount.value)

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

  const categoryStats = computed(() => {
    const parts = [
      '第一部分形势政策',
      '第二部分企业文化',
      '第三部分公司战略',
      '第四部分新型电力系统',
      '第五部分品牌建设'
    ]

    return parts.map(partName => {
      const partQuestions = questions.value.filter(q => q.category === partName)
      const total = partQuestions.length
      const learned = partQuestions.filter(q => {
        const p = progressMap.value[q.id]
        return p && (p.review_count || 0) > 0
      }).length
      const mastered = partQuestions.filter(q => {
        const p = progressMap.value[q.id]
        return p && p.stage === 6
      }).length
      const wrong = partQuestions.filter(q => {
        const p = progressMap.value[q.id]
        return p && p.in_wrong_book
      }).length

      return {
        name: partName.replace(/^第[一二三四五]部分/, ''),
        fullName: partName,
        total,
        learned,
        mastered,
        wrong,
        progressPercent: total ? Math.round((learned / total) * 100) : 0,
        masterPercent: total ? Math.round((mastered / total) * 100) : 0
      }
    })
  })

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
