import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { getToken } from '@/utils/token'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/post/:slug',
      name: 'post',
      component: () => import('../views/PostView.vue'),
    },
    {
      path: '/articles',
      name: 'articles',
      component: () => import('../views/ArticlesView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      // 管理后台（作者入口，需登录）
      path: '/admin',
      component: () => import('../components/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'admin',
          component: () => import('../views/admin/AdminDashboard.vue'),
        },
        {
          path: 'posts/new',
          name: 'admin-post-new',
          component: () => import('../views/admin/PostEditor.vue'),
        },
        {
          path: 'posts/:id/edit',
          name: 'admin-post-edit',
          component: () => import('../views/admin/PostEditor.vue'),
          props: true,
        },
        {
          path: 'comments',
          name: 'admin-comments',
          component: () => import('../views/admin/AdminComments.vue'),
        },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

// 登录守卫：需登录的路由，未带 token 则跳登录并带回跳地址
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getToken()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
