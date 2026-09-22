import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/components/layout/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/pages/home/index.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'teachers',
        name: 'Teachers',
        component: () => import('@/pages/teachers/index.vue'),
        meta: { title: '找老师' },
      },
      {
        path: 'teachers/:id',
        name: 'TeacherDetail',
        component: () => import('@/pages/teachers/detail.vue'),
        meta: { title: '老师详情' },
      },
      {
        path: 'demand/publish',
        name: 'DemandPublish',
        component: () => import('@/pages/demand/publish.vue'),
        meta: { title: '学员求聘' },
      },
      {
        path: 'teacher/join',
        name: 'TeacherJoin',
        component: () => import('@/pages/teacher/join.vue'),
        meta: { title: '老师入驻' },
      },
      {
        path: 'auth/login',
        name: 'Login',
        component: () => import('@/pages/auth/login.vue'),
        meta: { title: '登录注册' },
      },
      {
        path: 'legal/agreement',
        name: 'Agreement',
        component: () => import('@/pages/legal/agreement.vue'),
        meta: { title: '用户协议' },
      },
      {
        path: 'legal/privacy',
        name: 'Privacy',
        component: () => import('@/pages/legal/privacy.vue'),
        meta: { title: '隐私政策' },
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/components/layout/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/pages/admin/dashboard.vue'),
        meta: { title: '数据看板', requiresAdmin: true },
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/pages/admin/users.vue'),
        meta: { title: '用户管理', requiresAdmin: true },
      },
      {
        path: 'audit',
        name: 'AdminAudit',
        component: () => import('@/pages/admin/audit.vue'),
        meta: { title: '老师资质审核', requiresAdmin: true },
      },
      {
        path: 'demands',
        name: 'AdminDemands',
        component: () => import('@/pages/admin/demands.vue'),
        meta: { title: '需求管理', requiresAdmin: true },
      },
      {
        path: 'comments',
        name: 'AdminComments',
        component: () => import('@/pages/admin/comments.vue'),
        meta: { title: '评论管理', requiresAdmin: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    return { name: 'Login', query: { redirect: to.fullPath, role: 'admin' } }
  }
  document.title = `${(to.meta.title as string) || '首页'} - 合肥同城家教`
  return true
})

export default router
