<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800">
    <Navbar />

    <main class="flex-1 pb-16">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="font-bold text-slate-700">⚡ 电网智刷</span>
          <span>· 832 题艾宾浩斯抗遗忘记忆系统</span>
        </div>
        <div class="flex items-center gap-4 text-slate-500">
          <span>Vue 3 + Vite</span>
          <span>Supabase Free</span>
          <span>Vercel Ready</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import Navbar from './components/Navbar.vue'
import { useAuthStore } from './stores/authStore'
import { useQuizStore } from './stores/quizStore'

const authStore = useAuthStore()
const quizStore = useQuizStore()

onMounted(async () => {
  await authStore.initAuth()
  if (authStore.isAuthenticated) {
    await quizStore.syncFromCloud()
  }
})
</script>
