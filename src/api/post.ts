import type { Post } from '@/types/blog'
import { request } from './request'

/** 获取已发布文章列表 */
export function getPosts(): Promise<Post[]> {
  return request<Post[]>('/posts')
}

/** 根据 slug 获取文章详情（浏览量 +1） */
export function getPostBySlug(slug: string): Promise<Post> {
  return request<Post>(`/posts/${slug}`)
}
