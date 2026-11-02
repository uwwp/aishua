import { createClient } from '@supabase/supabase-js'

const DEFAULT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://saigwpqwinueodihnvib.supabase.co'
const DEFAULT_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Ml61D5xU_pgC2DIjRhzERw_G5HiKac6'

export const AUTH_INVITE_CODE = 'ADBC' // 系统固定注册授权码
export const MAX_AUTH_ATTEMPTS = 5    // 输错5次拉黑

export const SUPABASE_SQL_SCHEMA = `-- 1. 创建用户题目学习进度表 (包含艾宾浩斯核心字段)
CREATE TABLE IF NOT EXISTS public.user_question_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    question_id INT NOT NULL,
    stage INT DEFAULT 0,
    review_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ DEFAULT now(),
    next_review_at TIMESTAMPTZ DEFAULT now(),
    is_favorite BOOLEAN DEFAULT false,
    in_wrong_book BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, question_id)
);

-- 2. 创建答题日志表 (用于统计每日打卡、正确率趋势)
CREATE TABLE IF NOT EXISTS public.quiz_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    question_id INT NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    mode TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 创建授权码防暴力破解与 IP 黑名单表
CREATE TABLE IF NOT EXISTS public.registration_ip_blacklist (
    ip TEXT PRIMARY KEY,
    failed_count INT DEFAULT 0,
    is_blocked BOOLEAN DEFAULT false,
    last_attempt_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 创建系统注册用户表 (支持免邮箱二次验证直连登录)
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 启用行级权限安全 (RLS)
ALTER TABLE public.user_question_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_ip_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 6. 权限策略 (允许注册用户与客户端数据同步)
CREATE POLICY "Allow public read blacklist" 
ON public.registration_ip_blacklist FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public update blacklist" 
ON public.registration_ip_blacklist FOR ALL 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow user manage progress" 
ON public.user_question_progress FOR ALL 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow user manage logs" 
ON public.quiz_logs FOR ALL 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow app users auth" 
ON public.app_users FOR ALL 
TO anon, authenticated 
USING (true)
WITH CHECK (true);
`

let clientInstance = null

export function getSupabaseConfig() {
  const customUrl = localStorage.getItem('custom_supabase_url')
  const customKey = localStorage.getItem('custom_supabase_key')
  return {
    url: customUrl || DEFAULT_URL,
    key: customKey || DEFAULT_KEY
  }
}

export function saveSupabaseConfig(url, key) {
  if (url) localStorage.setItem('custom_supabase_url', url.trim())
  if (key) localStorage.setItem('custom_supabase_key', key.trim())
  clientInstance = null
  return getSupabaseClient()
}

export function getSupabaseClient() {
  if (clientInstance) return clientInstance
  const { url, key } = getSupabaseConfig()
  if (!url || !key) return null
  try {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
    return clientInstance
  } catch (err) {
    console.error('Failed to init Supabase client:', err)
    return null
  }
}

/**
 * 获取当前用户的公网 IP
 */
export async function getClientIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const data = await res.json()
      if (data?.ip) return data.ip
    }
  } catch (e) {
    // 备用方式
  }

  try {
    const res = await fetch('https://icanhazip.com', { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const text = await res.text()
      if (text && text.trim()) return text.trim()
    }
  } catch (e) {
    // ignore
  }

  let localId = localStorage.getItem('dianwang_device_id')
  if (!localId) {
    localId = 'device_' + Math.random().toString(36).substring(2, 10)
    localStorage.setItem('dianwang_device_id', localId)
  }
  return localId
}

/**
 * 检查指定 IP 是否被拉黑及输错次数
 */
export async function checkIpStatus(ip) {
  const localKey = `ip_attempts_${ip}`
  const localData = JSON.parse(localStorage.getItem(localKey) || '{"failed_count":0,"is_blocked":false}')
  if (localData.is_blocked || localData.failed_count >= MAX_AUTH_ATTEMPTS) {
    return { isBlocked: true, failedCount: localData.failed_count, remaining: 0 }
  }

  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('registration_ip_blacklist')
        .select('*')
        .eq('ip', ip)
        .maybeSingle()

      if (!error && data) {
        if (data.is_blocked || data.failed_count >= MAX_AUTH_ATTEMPTS) {
          localStorage.setItem(localKey, JSON.stringify({ failed_count: data.failed_count, is_blocked: true }))
          return { isBlocked: true, failedCount: data.failed_count, remaining: 0 }
        }
        return { 
          isBlocked: false, 
          failedCount: data.failed_count || 0, 
          remaining: Math.max(0, MAX_AUTH_ATTEMPTS - (data.failed_count || 0)) 
        }
      }
    } catch (e) {
      // 容错使用本地记录
    }
  }

  return {
    isBlocked: false,
    failedCount: localData.failed_count || 0,
    remaining: Math.max(0, MAX_AUTH_ATTEMPTS - (localData.failed_count || 0))
  }
}

/**
 * 记录一次授权码输入错误并判断是否拉黑
 */
export async function recordFailedAttempt(ip) {
  const localKey = `ip_attempts_${ip}`
  const localData = JSON.parse(localStorage.getItem(localKey) || '{"failed_count":0,"is_blocked":false}')
  const newCount = (localData.failed_count || 0) + 1
  const isNowBlocked = newCount >= MAX_AUTH_ATTEMPTS

  localStorage.setItem(localKey, JSON.stringify({ failed_count: newCount, is_blocked: isNowBlocked }))

  const client = getSupabaseClient()
  if (client) {
    try {
      await client.from('registration_ip_blacklist').upsert({
        ip,
        failed_count: newCount,
        is_blocked: isNowBlocked,
        last_attempt_at: new Date().toISOString()
      })
    } catch (e) {
      console.warn('Sync blacklist to cloud failed:', e)
    }
  }

  return {
    failedCount: newCount,
    isBlocked: isNowBlocked,
    remaining: Math.max(0, MAX_AUTH_ATTEMPTS - newCount)
  }
}

/**
 * 注册成功后重置该 IP 的失败记录
 */
export async function resetIpAttempts(ip) {
  const localKey = `ip_attempts_${ip}`
  localStorage.removeItem(localKey)

  const client = getSupabaseClient()
  if (client) {
    try {
      await client.from('registration_ip_blacklist').delete().eq('ip', ip)
    } catch (e) {
      // ignore
    }
  }
}

/**
 * 测试云端 API 连通性
 */
export async function testSupabaseConnection() {
  const client = getSupabaseClient()
  if (!client) return { ok: false, error: '客户端未初始化，请检查配置' }

  try {
    const { error: tableErr } = await client
      .from('user_question_progress')
      .select('question_id')
      .limit(1)

    if (tableErr) {
      if (tableErr.message.includes('relation') || tableErr.code === 'PGRST205' || tableErr.message.includes('schema cache')) {
        return {
          ok: true,
          tableMissing: true,
          message: '云端服务连通成功！但检测到数据库尚未执行建表 SQL，请在控制台 SQL Editor 执行初始化脚本。'
        }
      }
      return { ok: false, error: tableErr.message }
    }

    return { ok: true, tableMissing: false, message: '云端数据库服务与数据表状态一切正常！' }
  } catch (err) {
    return { ok: false, error: err.message || '网络连接异常' }
  }
}
