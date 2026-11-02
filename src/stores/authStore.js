import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getSupabaseClient, 
  getClientIp, 
  checkIpStatus, 
  recordFailedAttempt, 
  resetIpAttempts,
  AUTH_INVITE_CODE 
} from '../services/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)
  const isInitialized = ref(false)
  const syncStatus = ref('local') // 'local' | 'synced' | 'syncing' | 'error'
  const syncMessage = ref('本地离线模式：仅保存在当前浏览器')

  // IP 状态
  const currentIp = ref('')
  const ipBlocked = ref(false)
  const remainingAttempts = ref(5)

  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '未注册（仅本地存储）')

  // 初始化监听 Supabase Auth 状态与获取 IP
  async function initAuth() {
    // 获取当前客户端 IP 并检测黑名单状态
    try {
      currentIp.value = await getClientIp()
      await refreshIpStatus()
    } catch (e) {
      console.warn('IP resolution failed:', e)
    }

    const client = getSupabaseClient()
    if (!client) {
      isInitialized.value = true
      syncStatus.value = 'local'
      return
    }

    try {
      const { data } = await client.auth.getSession()
      session.value = data?.session || null
      user.value = data?.session?.user || null

      if (user.value) {
        syncStatus.value = 'synced'
        syncMessage.value = '已登录，云端同步正常'
      } else {
        syncStatus.value = 'local'
        syncMessage.value = '未登录：进度仅保存在本地，不允许存到云端'
      }

      client.auth.onAuthStateChange((_event, currentSession) => {
        session.value = currentSession
        user.value = currentSession?.user || null
        if (user.value) {
          syncStatus.value = 'synced'
          syncMessage.value = '已登录，云端同步正常'
        } else {
          syncStatus.value = 'local'
          syncMessage.value = '未登录：进度仅保存在本地，不允许存到云端'
        }
      })
    } catch (err) {
      console.warn('Auth init fallback to local:', err)
      syncStatus.value = 'local'
    } finally {
      isInitialized.value = true
    }
  }

  // 刷新当前 IP 状态
  async function refreshIpStatus() {
    if (!currentIp.value) {
      currentIp.value = await getClientIp()
    }
    const status = await checkIpStatus(currentIp.value)
    ipBlocked.value = status.isBlocked
    remainingAttempts.value = status.remaining
    return status
  }

  // 邮箱登录
  async function signInWithEmail(email, password) {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase 客户端未初始化，请检查配置')
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password
    })
    if (error) throw error
    user.value = data.user
    session.value = data.session
    syncStatus.value = 'synced'
    syncMessage.value = '登录成功，已启用云端同步'
    return data
  }

  // 用户注册（必须校验授权码 ADBC，输错 5 次拉黑该 IP）
  async function signUpWithEmail(email, password, authCode) {
    const client = getSupabaseClient()
    if (!client) throw new Error('Supabase 客户端未初始化，请检查配置')

    // 1. 检查 IP 黑名单状态
    const ipCheck = await refreshIpStatus()
    if (ipCheck.isBlocked) {
      throw new Error(`您的 IP (${currentIp.value}) 因多次输错授权码已被系统拉黑，禁止注册！`)
    }

    // 2. 校验授权码
    const code = (authCode || '').trim().toUpperCase()
    if (code !== AUTH_INVITE_CODE) {
      // 记录失败尝试
      const failResult = await recordFailedAttempt(currentIp.value)
      ipBlocked.value = failResult.isBlocked
      remainingAttempts.value = failResult.remaining

      if (failResult.isBlocked) {
        throw new Error(`授权码错误！已连续输错 5 次，您的 IP (${currentIp.value}) 已被永久拉黑，无法再注册！`)
      } else {
        throw new Error(`授权码错误！您还剩 ${failResult.remaining} 次尝试机会，输错 5 次该 IP 将被拉黑！`)
      }
    }

    // 3. 授权码正确，执行注册
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password
    })
    if (error) throw error

    // 注册成功，重置失败计数
    await resetIpAttempts(currentIp.value)
    await refreshIpStatus()

    if (data.user) {
      user.value = data.user
      session.value = data.session
      if (data.session) {
        syncStatus.value = 'synced'
        syncMessage.value = '注册并登录成功，已接入云端同步'
      } else {
        syncMessage.value = '注册成功，请在邮箱确认邮件后登录'
      }
    }
    return data
  }

  // 退出登录（退回本地模式）
  async function signOut() {
    const client = getSupabaseClient()
    if (client) {
      await client.auth.signOut()
    }
    user.value = null
    session.value = null
    syncStatus.value = 'local'
    syncMessage.value = '未登录：进度仅保存在本地，不允许存到云端'
  }

  return {
    user,
    session,
    isInitialized,
    syncStatus,
    syncMessage,
    currentIp,
    ipBlocked,
    remainingAttempts,
    isAuthenticated,
    userEmail,
    initAuth,
    refreshIpStatus,
    signInWithEmail,
    signUpWithEmail,
    signOut
  }
})
