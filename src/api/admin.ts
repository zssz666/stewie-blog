/**
 * 管理后台 API（文章 CRUD / 封面上传 / 评论审核）
 * request() 已内置 /api 前缀与 Bearer token，故路径写 /admin/...
 */
import type { Comment, MovieCover, PageResult, Post, PostInput, UploadResult } from '@/types/blog'
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

/* ── AI 摘要生成 ── */
export function generateExcerpt(title: string, content: string) {
  return request<{ excerpt: string }>('/admin/posts/generate-excerpt', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  })
}

/* ── 媒体上传（multipart：封面图 / 正文图片 / 正文视频）── */

export interface UploadOptions {
  /** 显式指定媒体类型；不传则由后端按文件真实类型自动判断 */
  type?: 'image' | 'video'
  /** 传 cover 表示封面图（后端放入 covers/ 目录）；不传按正文媒体处理 */
  scene?: 'cover'
  /** 上传进度回调，百分比 0-100 */
  onProgress?: (percent: number) => void
}

/**
 * 通用媒体上传。
 * <p>用 XMLHttpRequest 而非 fetch：fetch 无法获取上传进度，而正文视频动辄几十 MB，
 * 没有进度条用户会以为卡死。不走 request() 包装是因为 FormData 需要浏览器自己带 boundary。</p>
 */
export function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
  const token = getToken()
  const form = new FormData()
  form.append('file', file)

  const qs = new URLSearchParams()
  if (options.type) qs.set('type', options.type)
  if (options.scene) qs.set('scene', options.scene)
  const query = qs.toString()
  const url = `${BASE}/admin/upload${query ? `?${query}` : ''}`

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && options.onProgress) {
        options.onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      let data: { code?: number; message?: string; data?: UploadResult }
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        reject(new Error(`上传失败：服务端返回了非 JSON 响应（HTTP ${xhr.status}）`))
        return
      }
      if (xhr.status < 200 || xhr.status >= 300 || data.code !== 200 || !data.data) {
        reject(new Error(data.message || `上传失败（HTTP ${xhr.status}）`))
        return
      }
      resolve(data.data)
    }

    xhr.onerror = () =>
      reject(new Error('上传失败：网络中断或请求被拒。文件较大时请确认 Nginx client_max_body_size 已放开'))
    xhr.onabort = () => reject(new Error('上传已取消'))
    xhr.send(form)
  })
}

/** 封面上传（兼容旧调用） */
export function uploadCover(file: File): Promise<UploadResult> {
  return uploadFile(file, { scene: 'cover' })
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
  movies?: MovieCover[]
}

export function updateAuthor(input: AuthorUpdateInput): Promise<void> {
  return request<void>('/admin/author', { method: 'PUT', body: JSON.stringify(input) })
}
