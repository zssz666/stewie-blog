import type { Author } from '@/types/blog'
import { request } from './request'

/**
 * 获取作者信息（/api/author）。
 * 用模块级 Promise 缓存：多个组件同时调用只发一次请求。
 */
let cached: Promise<Author> | null = null

export function getAuthor(): Promise<Author> {
  if (!cached) {
    cached = request<Author>('/author')
  }
  return cached
}
