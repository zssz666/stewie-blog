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
export async function getPosts(query: PostQuery = {}): Promise<PageResult<Post>> {
  const params = new URLSearchParams()
  if (query.page != null) params.set('page', String(query.page))
  if (query.size != null) params.set('size', String(query.size))
  if (query.category) params.set('category', query.category)
  if (query.tag) params.set('tag', query.tag)
  const qs = params.toString()
  const raw = await request<any>(qs ? `/posts?${qs}` : '/posts')
  // 兼容后端两种返回结构：
  //   新版: PageResult { list, total, pages, page, size }
  //   旧版: 裸数组 Post[]
  if (Array.isArray(raw)) {
    return { list: raw, total: raw.length, page: 1, size: raw.length }
  }
  return {
    list: raw?.list ?? [],
    total: raw?.total ?? 0,
    page: raw?.page ?? 1,
    size: raw?.size ?? raw?.list?.length ?? 0,
    pages: raw?.pages,
  }
}

/** 根据 slug 获取文章详情 */
export function getPostBySlug(slug: string): Promise<Post> {
  return request<Post>(`/posts/${slug}`)
}

/**
 * 浏览量埋点：打开文章时调用，views +1（不阻塞渲染）
 * 对应后端 POST /api/posts/{id}/view
 */
export function incrementViews(id: number): Promise<void> {
  return request<void>(`/posts/${id}/view`, { method: 'POST' })
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

/**
 * 全文搜索（MySQL ngram FULLTEXT，后端按相关度排序）
 * 对应后端 GET /api/search?q=&page=&size=
 */
export async function searchPosts(
  q: string,
  page = 1,
  size = 10,
): Promise<PageResult<Post>> {
  const params = new URLSearchParams()
  params.set('q', q)
  params.set('page', String(page))
  params.set('size', String(size))
  const raw = await request<any>(`/search?${params.toString()}`)
  // 兼容后端 PageResult 结构（list/total/page/size/pages）
  if (!raw || !Array.isArray(raw.list)) {
    return { list: [], total: 0, page: 1, size }
  }
  return {
    list: raw.list,
    total: raw.total ?? 0,
    page: raw.page ?? 1,
    size: raw.size ?? raw.list.length,
    pages: raw.pages,
  }
}
