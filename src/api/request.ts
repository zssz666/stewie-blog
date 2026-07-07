/**
 * HTTP 请求封装
 * 后端统一响应：{ code, message, data, timestamp }
 */

interface ApiResult<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

// Vite 环境变量：import.meta.env.VITE_xxx
const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }

  const json: ApiResult<T> = await res.json()
  if (json.code !== 200) {
    throw new Error(json.message || `业务错误 ${json.code}`)
  }
  return json.data
}