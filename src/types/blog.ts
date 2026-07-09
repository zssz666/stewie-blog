export interface Post {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  coverColor: string
  category: string
  tag: string
  date: string
  readingTime: number
  views: number
  /** 后端 PostVO 返回，详情页用于初始化点赞数（后端暂无独立点赞接口，前端本地切换） */
  likes?: number
}

export interface Author {
  name: string
  role: string
  bio: string
  socials: SocialLink[]
  skills: string[]
  /** 后端 AuthorVO 返回，可选 */
  avatar?: string
}

export interface SocialLink {
  label: string
  href: string
}

export interface Category {
  id: number
  name: string
  slug: string
  sort?: number
}

export interface Tag {
  id: number
  name: string
  slug: string
}

/** 后端统一分页包装（对齐 common.PageResult） */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
  pages?: number
}
