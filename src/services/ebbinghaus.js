/**
 * 艾宾浩斯遗忘曲线核心算法模块
 * 记忆阶段与间隔配置（基于经典遗忘曲线与现代间隔重复理论）
 */

export const EBBINGHAUS_STAGES = [
  { stage: 0, days: 0, label: '生疏/待学', desc: '当天复习', color: 'text-slate-500 bg-slate-100 border-slate-200', retention: 20 },
  { stage: 1, days: 1, label: '初步记忆', desc: '1天后复习', color: 'text-rose-600 bg-rose-50 border-rose-200', retention: 40 },
  { stage: 2, days: 2, label: '短时记忆', desc: '2天后复习', color: 'text-amber-600 bg-amber-50 border-amber-200', retention: 55 },
  { stage: 3, days: 4, label: '中期巩固', desc: '4天后复习', color: 'text-blue-600 bg-blue-50 border-blue-200', retention: 70 },
  { stage: 4, days: 7, label: '稳固记忆', desc: '7天后复习', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', retention: 85 },
  { stage: 5, days: 15, label: '长效记忆', desc: '15天后复习', color: 'text-purple-600 bg-purple-50 border-purple-200', retention: 92 },
  { stage: 6, days: 30, label: '彻底掌握', desc: '进入稳固记忆库', color: 'text-emerald-700 bg-emerald-50 border-emerald-300', retention: 100 },
]

/**
 * 根据当前阶段和答题正误计算下一状态
 * @param {number} currentStage 当前阶段 0-6
 * @param {boolean} isCorrect 本次答题是否正确
 * @returns {{ nextStage: number, nextReviewAt: string, daysAdded: number }}
 */
export function calculateNextReview(currentStage = 0, isCorrect = false) {
  const now = new Date()

  if (isCorrect) {
    // 答对：阶段递增（最高到 6）
    const nextStage = Math.min((currentStage ?? 0) + 1, 6)
    const daysToAdd = EBBINGHAUS_STAGES[nextStage].days
    
    // 下次复习时间加 daysToAdd 天
    const nextDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
    
    return {
      nextStage,
      nextReviewAt: nextDate.toISOString(),
      daysAdded: daysToAdd
    }
  } else {
    // 答错：重置为 Stage 0，当天或数小时后必须重新复习
    const nextDate = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2小时后即进入复习池
    return {
      nextStage: 0,
      nextReviewAt: nextDate.toISOString(),
      daysAdded: 0
    }
  }
}

/**
 * 判断一道题目是否已到复习时间
 * @param {string|null} nextReviewAt 
 * @returns {boolean}
 */
export function isQuestionDue(nextReviewAt) {
  if (!nextReviewAt) return true
  return new Date(nextReviewAt).getTime() <= Date.now()
}

/**
 * 计算距离下次复习的相对时间描述
 * @param {string|null} nextReviewAt 
 * @returns {string}
 */
export function formatReviewTimeRemaining(nextReviewAt) {
  if (!nextReviewAt) return '立即复习'
  const diff = new Date(nextReviewAt).getTime() - Date.now()
  if (diff <= 0) return '已到期，需复习'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 24) {
    return `${Math.max(1, hours)} 小时后复习`
  }
  const days = Math.ceil(hours / 24)
  return `${days} 天后复习`
}
