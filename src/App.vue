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
          <span class="font-bold text-slate-700">⚡ 艾刷 aishua</span>
          <span>· 现代智能刷题与抗遗忘精熟系统</span>
        </div>
        <div class="flex items-center gap-4 text-slate-500">
          <span>Vue 3</span>
          <span>云端多端同步</span>
          <span>多题库支持</span>
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
