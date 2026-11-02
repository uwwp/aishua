import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import PracticeView from '../views/PracticeView.vue'
import ExamView from '../views/ExamView.vue'
import WrongBookView from '../views/WrongBookView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { title: '学习看板 - 电网智刷' }
  },
  {
    path: '/practice',
    name: 'practice',
    component: PracticeView,
    meta: { title: '智能刷题 - 电网智刷' }
  },
  {
    path: '/exam',
    name: 'exam',
    component: ExamView,
    meta: { title: '模拟考试 - 电网智刷' }
  },
  {
    path: '/wrong-book',
    name: 'wrong-book',
    component: WrongBookView,
    meta: { title: '错题攻坚 - 电网智刷' }
  },
  {
    path: '/categories',
    name: 'categories',
    component: CategoriesView,
    meta: { title: '分类题库 - 电网智刷' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { title: '系统设置与云端同步 - 电网智刷' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
