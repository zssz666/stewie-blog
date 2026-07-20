import type { Author } from '@/types/blog'
import { request } from './request'

/**
 * 获取作者信息（/api/author）。
 * 用模块级 Promise 缓存：多个组件同时调用只发一次请求。
 */
let cached: Promise<Author> | null = null

export function getAuthor(force = false): Promise<Author> {
  if (!cached || force) {
    cached = request<Author>('/author')
  }
  return cached
}

/** 作者信息变更后清除缓存，使关于页/文章页下次拉取最新数据 */
export function invalidateAuthorCache(): void {
  cached = null
}
