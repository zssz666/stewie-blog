import type { Category, PageResult, Post, Tag } from '@/types/blog'
import { request } from './request'

/** 文章列表查询参数 */
export interface PostQuery {
  page?: number
  size?: number
  category?: string
  tag?: string
}

/**
 * 分页获取已发布文章列表（支持 分类/标签 过滤）
 * 对应后端 GET /api/posts?page=&size=&category=&tag=
 */
export function getPosts(query: PostQuery = {}): Promise<PageResult<Post>> {
  const params = new URLSearchParams()
  if (query.page != null) params.set('page', String(query.page))
  if (query.size != null) params.set('size', String(query.size))
  if (query.category) params.set('category', query.category)
  if (query.tag) params.set('tag', query.tag)
  const qs = params.toString()
  return request<PageResult<Post>>(qs ? `/posts?${qs}` : '/posts')
}

/** 根据 slug 获取文章详情（浏览量 +1） */
export function getPostBySlug(slug: string): Promise<Post> {
  return request<Post>(`/posts/${slug}`)
}

/** 热门文章 Top 5（后端按 views 倒序） */
export function getPopularPosts(): Promise<Post[]> {
  return request<Post[]>('/posts/popular')
}

/** 分类列表 */
export function getCategories(): Promise<Category[]> {
  return request<Category[]>('/categories')
}

/** 标签列表 */
export function getTags(): Promise<Tag[]> {
  return request<Tag[]>('/tags')
}
