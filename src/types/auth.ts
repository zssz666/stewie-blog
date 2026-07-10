/**
 * 认证相关类型，与后端 dto.vo.UserVO / dto.response.LoginResponse 对齐
 */

/** 登录用户信息（不含密码） */
export interface AuthUser {
  id: number
  username: string
  nickname?: string
  avatar?: string
  email?: string
  status?: number
  lastLoginAt?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}
