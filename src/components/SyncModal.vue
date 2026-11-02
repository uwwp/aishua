<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
    <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            ☁️
          </div>
          <div>
            <h3 class="font-bold text-slate-800 text-sm">云端多端同步与账号</h3>
            <p class="text-[11px] text-slate-400">登录账号即可将本地 832 题学习进度自动备份至云端</p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto space-y-5">
        <!-- 登录状态横幅 -->
        <div 
          :class="[
            'p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs',
            authStore.isAuthenticated 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          ]"
        >
          <div class="flex items-center gap-2.5">
            <span class="text-xl">{{ authStore.isAuthenticated ? '🟢' : '⚪' }}</span>
            <div>
              <div class="font-bold text-sm">
                {{ authStore.isAuthenticated ? '云端多端同步已连接' : '本地离线模式 (未登录)' }}
              </div>
              <div class="text-[11px] opacity-80 mt-0.5">
                {{ authStore.isAuthenticated ? `当前绑定邮箱：${authStore.userEmail}` : '未注册登录不允许同步云端，进度仅保存在当前浏览器中' }}
              </div>
            </div>
          </div>
          <button 
            v-if="authStore.isAuthenticated"
            @click="handleSignOut"
            class="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-colors shrink-0 font-medium"
          >
            退出账号
          </button>
        </div>

        <!-- 已经登录状态下：展示同步控制选项 -->
        <div v-if="authStore.isAuthenticated" class="space-y-4">
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-bold text-slate-800 text-sm">⚡ 实时自动同步</div>
                <div class="text-[11px] text-slate-400 mt-0.5">每次做题、复习后自动在后台推送至云端</div>
              </div>
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

            <div class="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span class="text-slate-500">上次全量同步：{{ authStore.lastSyncTime || '刚刚' }}</span>
              <button
                @click="manualSync"
                :disabled="isSyncing"
                class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span :class="{ 'animate-spin': isSyncing }">🔄</span>
                <span>{{ isSyncing ? '正在全量同步...' : '立即手动同步' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 未登录状态下：IP 状态与登录注册表单 -->
        <div v-else class="space-y-4">
          <!-- IP 检测与安全状态卡片 -->
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="text-slate-500">🌐 客户端 IP:</span>
              <span class="font-mono font-bold text-slate-700">{{ authStore.currentIp || '正在解析...' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span 
                :class="[
                  'px-2 py-0.5 rounded-md font-semibold text-[11px]',
                  authStore.ipBlocked 
                    ? 'bg-rose-100 text-rose-700' 
                    : (authStore.remainingAttempts < 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')
                ]"
              >
                {{ authStore.ipBlocked ? '该IP已被系统拉黑' : `剩余注册机会: ${authStore.remainingAttempts} 次` }}
              </span>
            </div>
          </div>

          <!-- IP 被拉黑警告大横幅 -->
          <div v-if="authStore.ipBlocked" class="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-1.5 animate-pulse">
            <div class="font-bold text-sm flex items-center gap-1.5">
              <span>🚫</span> 该 IP 已被系统封锁！
            </div>
            <p class="leading-relaxed">
              因连续 <strong>5 次输入错误的注册授权码</strong>，系统已拉黑您的 IP 地址 ({{ authStore.currentIp }})。该 IP 已无法进行新用户注册！
            </p>
          </div>

          <!-- Tab 切换 -->
          <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              @click="activeTab = 'signin'"
              :class="[
                'py-2 rounded-lg transition-all text-center',
                activeTab === 'signin' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              ]"
            >
              已有账号登录
            </button>
            <button
              @click="activeTab = 'signup'"
              :class="[
                'py-2 rounded-lg transition-all text-center',
                activeTab === 'signup' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              ]"
            >
              新用户注册 (需授权码)
            </button>
          </div>

          <!-- 1. 登录表单 -->
          <div v-if="activeTab === 'signin'" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">登录邮箱</label>
              <input 
                v-model="loginEmail" 
                type="email" 
                placeholder="例如 your-name@example.com"
                class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">登录密码</label>
              <input 
                v-model="loginPassword" 
                type="password" 
                placeholder="请输入密码"
                class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              @click="handleSignIn"
              :disabled="isLoading"
              class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors"
            >
              {{ isLoading ? '正在登录并同步云端...' : '立即登录并同步云端' }}
            </button>
          </div>

          <!-- 2. 注册表单 -->
          <div v-else class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">注册邮箱</label>
              <input 
                v-model="regEmail" 
                :disabled="authStore.ipBlocked"
                type="email" 
                placeholder="例如 your-name@example.com"
                class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">设置密码 (不少于6位)</label>
              <input 
                v-model="regPassword" 
                :disabled="authStore.ipBlocked"
                type="password" 
                placeholder="请输入密码"
                class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-emerald-800">
                  🛡️ 系统注册授权码
                </label>
                <span class="text-[11px] text-rose-500 font-medium">
                  输错 5 次拉黑本 IP
                </span>
              </div>
              <input 
                v-model="regAuthCode" 
                :disabled="authStore.ipBlocked"
                type="text" 
                placeholder="请输入注册授权码 (区分大小写)"
                class="w-full px-3.5 py-2 text-xs font-mono font-bold tracking-widest bg-emerald-50/50 border border-emerald-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              <p class="text-[10px] text-slate-400 mt-1">
                提示：本系统的专有注册授权码为 <strong>ADBC</strong>。
              </p>
            </div>

            <button
              @click="handleSignUp"
              :disabled="isLoading || authStore.ipBlocked"
              class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-colors"
            >
              {{ isLoading ? '正在校验并注册...' : '提交注册 (验证授权码)' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
        <span class="text-slate-400">
          云端数据中心
        </span>
        <button 
          @click="$emit('close')" 
          class="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors"
        >
          完成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useQuizStore } from '../stores/quizStore'

defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const quizStore = useQuizStore()

const activeTab = ref('signin')
const loginEmail = ref('')
const loginPassword = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regAuthCode = ref('')
const isLoading = ref(false)
const isSyncing = ref(false)

async function handleSignIn() {
  if (!loginEmail.value || !loginPassword.value) {
    alert('请输入邮箱和密码')
    return
  }
  isLoading.value = true
  try {
    await authStore.signInWithEmail(loginEmail.value, loginPassword.value)
    await quizStore.syncFromCloud()
    alert('登录成功！已成功启用云端数据同步。')
    emit('close')
  } catch (err) {
    alert('登录失败: ' + (err.message || '请检查邮箱与密码'))
  } finally {
    isLoading.value = false
  }
}

async function handleSignUp() {
  if (!regEmail.value || !regPassword.value) {
    alert('请输入邮箱和密码')
    return
  }
  if (!regAuthCode.value) {
    alert('请输入注册授权码！')
    return
  }
  if (regPassword.value.length < 6) {
    alert('密码长度不能少于 6 位')
    return
  }

  isLoading.value = true
  try {
    await authStore.signUpWithEmail(regEmail.value, regPassword.value, regAuthCode.value)
    // 注册成功后全量上传本地已做记录
    await quizStore.syncLocalToCloud()
    alert('注册成功！已为您自动登录，本地 832 题学习进度已同步至云端。')
    emit('close')
  } catch (err) {
    alert(err.message || '注册发生错误，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

async function handleSignOut() {
  if (confirm('退出登录后，后续做题记录将仅保存在本地，不再同步到云端。确认退出吗？')) {
    await authStore.signOut()
    alert('已退出登录，当前为纯本地模式。')
  }
}

async function manualSync() {
  isSyncing.value = true
  try {
    await quizStore.performManualSync()
    alert('云端与本地 832 题数据已全量同步完成！')
  } catch (e) {
    alert('同步失败: ' + e.message)
  } finally {
    isSyncing.value = false
  }
}
</script>
