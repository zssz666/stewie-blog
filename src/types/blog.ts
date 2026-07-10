export interface Post {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  /** 封面图 URL（上传返回，可空；为空时卡片回退渐变占位） */
  cover?: string
  coverColor: string
  category: string
  tag: string
  /** 标签名列表（多标签） */
  tags?: string[]
  date: string
  readingTime: number
  views: number
  /** 状态：0=草稿 1=已发布（管理后台用） */
  status?: number
  /** 后端 PostVO 返回，详情页用于初始化点赞数 */
  likes?: number
}

/* ── 管理后台：文章创建/更新请求 ── */
export interface PostInput {
  title: string
  slug?: string
  excerpt?: string
  content: string
  cover?: string
  categoryId?: number | null
  /** 标签名列表 */
  tags?: string[]
  /** 0=草稿 1=已发布 */
  status: number
  /** 发布日期 yyyy-MM-dd */
  publishDate?: string
  readingTime?: number
}

/** 文件上传返回 */
export interface UploadResult {
  url: string
}

/* ── 互动模块（阶段 5：点赞 / 评论） ── */

/** 点赞状态（指纹去重） */
export interface LikeStatus {
  liked: boolean
  likes: number
}

/** 评论（树形：replies 为子评论） */
export interface Comment {
  id: number
  postId: number
  parentId: number | null
  nickname: string
  content: string
  status: number
  createdAt: string
  replies?: Comment[]
}

/** 提交评论请求 */
export interface CommentRequest {
  nickname: string
  email?: string
  content: string
  parentId?: number | null
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
