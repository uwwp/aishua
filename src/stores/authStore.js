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

const STORAGE_KEY_USER = 'dianwang_current_user_v2'
const STORAGE_KEY_AUTO_SYNC = 'dianwang_auto_sync_enabled'
const STORAGE_KEY_LAST_SYNC = 'dianwang_last_sync_time'

// 简单的 SHA-256 密码哈希 (利用浏览器原生 Web Crypto API)
async function hashPassword(plainText) {
  const msgUint8 = new TextEncoder().encode(plainText)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const useAuthStore = defineStore('auth', () => {
  // 1. 初始化时尝试读取本地已登录用户凭证
  const savedUserJson = localStorage.getItem(STORAGE_KEY_USER)
  let initialUser = null
  try {
    if (savedUserJson) initialUser = JSON.parse(savedUserJson)
  } catch (e) {
    // ignore
  }

  const user = ref(initialUser)
  const session = ref(null)
  const isInitialized = ref(false)
  const syncStatus = ref(initialUser ? 'synced' : 'local') // 'local' | 'synced' | 'syncing' | 'error'
  const syncMessage = ref(initialUser ? '已连接云端同步' : '未登录：数据保存在本地')
  
  // 自动同步与手动同步状态
  const isAutoSync = ref(localStorage.getItem(STORAGE_KEY_AUTO_SYNC) !== 'false')
  const lastSyncTime = ref(localStorage.getItem(STORAGE_KEY_LAST_SYNC) || '')

  // IP 状态
  const currentIp = ref('')
  const ipBlocked = ref(false)
  const remainingAttempts = ref(5)

  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '本地未登录访客')

  // 初始化监听 Auth 状态
  async function initAuth() {
    try {
      currentIp.value = await getClientIp()
      await refreshIpStatus()
    } catch (e) {
      console.warn('IP resolution failed:', e)
    }

    const client = getSupabaseClient()
    if (!client) {
      isInitialized.value = true
      return
    }

    try {
      const { data } = await client.auth.getSession()
      if (data?.session?.user) {
        session.value = data.session
        user.value = {
          id: data.session.user.id,
          email: data.session.user.email
        }
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user.value))
        syncStatus.value = 'synced'
        syncMessage.value = '已连接云端同步'
      }

      client.auth.onAuthStateChange((_event, currentSession) => {
        if (currentSession?.user) {
          session.value = currentSession
          user.value = {
            id: currentSession.user.id,
            email: currentSession.user.email
          }
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user.value))
          syncStatus.value = 'synced'
          syncMessage.value = '已连接云端同步'
        }
      })
    } catch (err) {
      console.warn('Auth init check:', err)
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

  // 设置自动同步开关
  function setAutoSync(enabled) {
    isAutoSync.value = enabled
    localStorage.setItem(STORAGE_KEY_AUTO_SYNC, enabled ? 'true' : 'false')
  }

  // 更新最后同步时间
  function recordSyncSuccess() {
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    lastSyncTime.value = timeStr
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, timeStr)
    syncStatus.value = 'synced'
  }

  // 邮箱登录 (双通道保障：先查 app_users，同时尝试 Supabase Auth)
  async function signInWithEmail(email, password) {
    const cleanEmail = email.trim().toLowerCase()
    const client = getSupabaseClient()
    if (!client) throw new Error('云端服务未连接，请检查网络')

    let loginUser = null
    const pwdHash = await hashPassword(password)

    // 通道 1: 验证 app_users 独立用户表
    try {
      const { data: appUserData, error: appUserErr } = await client
        .from('app_users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (!appUserErr && appUserData) {
        if (appUserData.password_hash === pwdHash) {
          loginUser = {
            id: appUserData.id,
            email: appUserData.email
          }
          // 更新最后登录时间
          await client.from('app_users').update({ last_login_at: new Date().toISOString() }).eq('id', appUserData.id)
        } else {
          throw new Error('密码错误，请重新输入')
        }
      }
    } catch (err) {
      if (err.message.includes('密码错误')) throw err
    }

    // 通道 2: 尝试 Supabase 内置 Auth 登录
    try {
      const { data: authData, error: authErr } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password
      })
      if (!authErr && authData?.user) {
        loginUser = {
          id: authData.user.id,
          email: authData.user.email
        }
        session.value = authData.session
      }
    } catch (e) {
      // 容错
    }

    if (!loginUser) {
      throw new Error('用户不存在或密码不正确，请先注册或核对信息')
    }

    // 成功登录：持久化状态并即时切换
    user.value = loginUser
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(loginUser))
    syncStatus.value = 'synced'
    syncMessage.value = '已登录，云端同步正常'
    recordSyncSuccess()
    return loginUser
  }

  // 用户注册 (校验授权码 ADBC，输错 5 次拉黑该 IP)
  async function signUpWithEmail(email, password, authCode) {
    const cleanEmail = email.trim().toLowerCase()
    const client = getSupabaseClient()
    if (!client) throw new Error('云端服务未连接，请检查网络')

    // 1. 检查 IP 黑名单状态
    const ipCheck = await refreshIpStatus()
    if (ipCheck.isBlocked) {
      throw new Error(`您的 IP (${currentIp.value}) 因多次输错授权码已被系统拉黑，禁止注册！`)
    }

    // 2. 校验授权码
    const code = (authCode || '').trim().toUpperCase()
    if (code !== AUTH_INVITE_CODE) {
      const failResult = await recordFailedAttempt(currentIp.value)
      ipBlocked.value = failResult.isBlocked
      remainingAttempts.value = failResult.remaining

      if (failResult.isBlocked) {
        throw new Error(`授权码错误！已连续输错 5 次，您的 IP (${currentIp.value}) 已被永久拉黑，无法再注册！`)
      } else {
        throw new Error(`授权码错误！您还剩 ${failResult.remaining} 次尝试机会，输错 5 次该 IP 将被拉黑！`)
      }
    }

    // 3. 授权码验证通过，生成用户 ID
    const newUserId = crypto.randomUUID()
    const pwdHash = await hashPassword(password)

    // 写入 app_users 表
    try {
      const { error: insertErr } = await client.from('app_users').insert({
        id: newUserId,
        email: cleanEmail,
        password_hash: pwdHash,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      })
      if (insertErr && insertErr.message.includes('unique')) {
        throw new Error('该邮箱已被注册，请直接点击“已有账号登录”')
      }
    } catch (e) {
      if (e.message.includes('已被注册')) throw e
      console.warn('Write app_users fallback:', e)
    }

    // 同步尝试写入 Supabase Auth (静默执行，不阻断注册)
    try {
      const { data: authData } = await client.auth.signUp({
        email: cleanEmail,
        password
      })
      if (authData?.user) {
        session.value = authData.session || null
      }
    } catch (e) {
      // ignore
    }

    // 注册成功：清除该 IP 失败尝试
    await resetIpAttempts(currentIp.value)
    await refreshIpStatus()

    // 注册成功后直接设置为登录状态！
    const newUserObj = {
      id: newUserId,
      email: cleanEmail
    }
    user.value = newUserObj
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUserObj))
    syncStatus.value = 'synced'
    syncMessage.value = '注册并登录成功，已接入云端同步'
    recordSyncSuccess()

    return newUserObj
  }

  // 退出登录 (恢复本地模式)
  async function signOut() {
    const client = getSupabaseClient()
    if (client) {
      try {
        await client.auth.signOut()
      } catch (e) {
        // ignore
      }
    }
    user.value = null
    session.value = null
    localStorage.removeItem(STORAGE_KEY_USER)
    syncStatus.value = 'local'
    syncMessage.value = '未登录：数据保存在本地，不允许存到云端'
  }

  return {
    user,
    session,
    isInitialized,
    syncStatus,
    syncMessage,
    isAutoSync,
    lastSyncTime,
    currentIp,
    ipBlocked,
    remainingAttempts,
    isAuthenticated,
    userEmail,
    initAuth,
    refreshIpStatus,
    setAutoSync,
    recordSyncSuccess,
    signInWithEmail,
    signUpWithEmail,
    signOut
  }
})
