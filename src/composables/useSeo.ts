import { useHead } from '@unhead/vue'

/** 站点根 URL，换域名时改这一处即可 */
const SITE_URL = 'http://8.137.165.237:88'
const SITE_NAME = 'Stewie 的前端博客'
const DEFAULT_TITLE = 'Stewie 的前端博客 | Vue 3 踩坑 · TypeScript · Vite 实战笔记'
const DEFAULT_DESC =
  '分享 Vue 3 踩坑实录、TypeScript 类型避坑、Vite 配置技巧。不搞高深理论，专注问题解决。'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

interface SeoOptions {
  /** 页面标题（不含站点名，会自动拼接） */
  title?: string
  /** 页面描述 */
  description?: string
  /** 路由路径，用于拼 canonical/og:url，如 '/articles' */
  path?: string
  /** 社交分享图，默认站点 og-image */
  image?: string
  /** OG 类型：website | article */
  type?: 'website' | 'article'
}

/**
 * 统一设置页面 SEO meta
 * 在各 view 的 setup 顶层调用
 */
export function useSeo(options: SeoOptions = {}) {
  const url = options.path ? `${SITE_URL}${options.path}` : SITE_URL
  const title = options.title ? `${options.title} | ${SITE_NAME}` : DEFAULT_TITLE
  const description = options.description || DEFAULT_DESC
  const image = options.image || DEFAULT_IMAGE
  const type = options.type || 'website'

  useHead({
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: type },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:site_name', content: SITE_NAME },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    link: [{ rel: 'canonical', href: url }],
  })
}
