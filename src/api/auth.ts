import { request } from './request'
import type { AuthUser, LoginResponse } from '@/types/auth'

/**
 * 登录：POST /api/auth/login
 * 成功返回 { token, tokenType, expiresIn, user }
 * 失败（用户名不存在/密码错误）后端返回 code≠200，由 request 抛错并带业务 message
 */
export function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

/** 获取当前登录用户：GET /api/auth/me（需携带有效 JWT） */
export function getCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>('/auth/me')
}

/**
 * 登出：POST /api/auth/logout
 * 后端为无状态 JWT，登出目前为「尽力通知」——成功与否都不影响前端清 token。
 * 用 try/catch 包裹，即便后端未实现也不阻断前端退出流程。
 */
export async function apiLogout(): Promise<void> {
  try {
    await request<void>('/auth/logout', { method: 'POST' })
  } catch {
    /* 忽略：无状态登出失败不影响前端清空本地会话 */
  }
}
