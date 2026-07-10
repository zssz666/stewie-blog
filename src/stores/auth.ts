import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getCurrentUser, login as apiLogin } from '@/api/auth'
import { clearToken, getToken, setToken } from '@/utils/token'
import type { AuthUser } from '@/types/auth'

/**
 * 认证状态：token 持久化到 localStorage，刷新页面后可恢复会话。
 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken())
  const user = ref<AuthUser | null>(null)
  // 防止重复 init（HMR / 多次挂载）
  const initialized = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  async function login(username: string, password: string) {
    const res = await apiLogin(username, password)
    token.value = res.token
    user.value = res.user
    setToken(res.token)
    return res
  }

  function logout() {
    token.value = null
    user.value = null
    clearToken()
  }

  /** 用当前 token 拉取最新用户信息；token 失效则自动登出 */
  async function fetchCurrentUser() {
    if (!token.value) return
    try {
      user.value = await getCurrentUser()
    } catch {
      logout()
    }
  }

  /** 应用启动时调用：若本地有 token，则恢复登录态 */
  async function init() {
    if (initialized.value) return
    initialized.value = true
    if (token.value) {
      await fetchCurrentUser()
    }
  }

  return { token, user, isLoggedIn, initialized, login, logout, fetchCurrentUser, init }
})
