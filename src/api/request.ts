/**
 * HTTP 请求封装
 * 后端统一响应：{ code, message, data, timestamp }
 */

import { clearToken, getToken } from '@/utils/token'

interface ApiResult<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

// Vite 环境变量：import.meta.env.VITE_xxx
const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  // 合并默认头与调用方传入的头，并自动携带 Bearer token
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (options?.headers) {
    new Headers(options.headers).forEach((value, key) => headers.set(key, value))
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers,
  })

  // 401 说明 token 失效/过期，清理本地登录态（UI 自动反映为未登录）
  if (res.status === 401) {
    clearToken()
    throw new Error('登录已失效，请重新登录')
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }

  const json: ApiResult<T> = await res.json()
  if (json.code !== 200) {
    throw new Error(json.message || `业务错误 ${json.code}`)
  }
  return json.data
}