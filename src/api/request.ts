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
// 开发/同源部署时为 '/api'；跨域部署（如 GitHub Pages + 云后端）时设为后端公共基址，
// 例如 VITE_API_BASE_URL=https://api.stewie.com/api
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * 解析静态资源地址（封面图、上传文件等）。
 * - 已是完整 http(s) 地址：原样返回。
 * - API_BASE 为跨域绝对地址时：把相对路径 /uploads/xxx 拼成 https://后端域名/uploads/xxx。
 * - API_BASE 为同源 '/api' 时：相对路径原样返回（同源即可）。
 */
export function resolveAsset(url?: string): string {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  const origin = API_BASE.replace(/\/api\/?$/, '')
  return origin && /^https?:\/\//.test(origin) ? origin + url : url
}

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  // 合并默认头与调用方传入的头，并自动携带 Bearer token
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (options?.headers) {
    new Headers(options.headers).forEach((value, key) => headers.set(key, value))
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${url}`, {
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