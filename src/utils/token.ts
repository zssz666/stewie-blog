/**
 * Token 持久化工具。
 * 独立成模块，避免 request.ts 与 auth store 之间的循环依赖：
 * request.ts 只读取 getToken()，auth store 负责写入/清除。
 */
const TOKEN_KEY = 'stewie_blog_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore (隐私模式下 localStorage 可能不可用) */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}
