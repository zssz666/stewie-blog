/**
 * 管理后台 API（文章 CRUD / 封面上传 / 评论审核）
 * request() 已内置 /api 前缀与 Bearer token，故路径写 /admin/...
 */
import type { Comment, PageResult, Post, PostInput, UploadResult } from '@/types/blog'
import { request } from './request'
import { getToken } from '@/utils/token'

const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/* ── 文章 ── */
export function listAdminPosts(params: { page?: number; size?: number; status?: number } = {}) {
  const qs = new URLSearchParams()
  if (params.page != null) qs.set('page', String(params.page))
  if (params.size != null) qs.set('size', String(params.size))
  if (params.status != null) qs.set('status', String(params.status))
  const q = qs.toString()
  return request<PageResult<Post>>(q ? `/admin/posts?${q}` : '/admin/posts')
}

export function getAdminPost(id: number) {
  return request<Post>(`/admin/posts/${id}`)
}

export function createPost(input: PostInput) {
  return request<Post>('/admin/posts', { method: 'POST', body: JSON.stringify(input) })
}

export function updatePost(id: number, input: PostInput) {
  return request<Post>(`/admin/posts/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deletePost(id: number) {
  return request<void>(`/admin/posts/${id}`, { method: 'DELETE' })
}

/* ── 封面上传（multipart）── */
export async function uploadCover(file: File): Promise<UploadResult> {
  const token = getToken()
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/admin/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })
  const data = await res.json()
  if (!res.ok || data.code !== 200) {
    throw new Error(data.message || '封面上传失败')
  }
  return data.data as UploadResult
}

/* ── 评论审核 ── */
export function listAdminComments(
  params: { postId?: number; status?: number; page?: number; size?: number } = {},
) {
  const qs = new URLSearchParams()
  if (params.postId != null) qs.set('postId', String(params.postId))
  if (params.status != null) qs.set('status', String(params.status))
  if (params.page != null) qs.set('page', String(params.page))
  if (params.size != null) qs.set('size', String(params.size))
  const q = qs.toString()
  return request<PageResult<Comment>>(q ? `/admin/comments?${q}` : '/admin/comments')
}

export function reviewComment(id: number, status: number) {
  return request<void>(`/admin/comments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export function deleteComment(id: number) {
  return request<void>(`/admin/comments/${id}`, { method: 'DELETE' })
}

/* ── 仪表盘统计 ── */
export interface DashboardStats {
  postsTotal: number
  postsPublished: number
  commentsTotal: number
  commentsPending: number
  viewsTotal: number
  likesTotal: number
}

export function getStats(): Promise<DashboardStats> {
  return request<DashboardStats>('/admin/stats')
}

/* ── 作者信息更新 ── */
export interface AuthorUpdateInput {
  name?: string
  role?: string
  bio?: string
  avatar?: string
  skills?: string[]
  socials?: { label: string; href: string }[]
}

export function updateAuthor(input: AuthorUpdateInput): Promise<void> {
  return request<void>('/admin/author', { method: 'PUT', body: JSON.stringify(input) })
}
