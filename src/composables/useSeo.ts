import { useHead } from '@unhead/vue'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

/** 站点根 URL，换域名时改这一处即可（已切到 ICP 备案通过的正式域名） */
const SITE_URL = 'https://stewie.fun'
const SITE_NAME = 'Stewie 的前端博客'
const DEFAULT_TITLE = 'Stewie 的前端博客 | Vue 3 踩坑 · TypeScript · Vite 实战笔记'
const DEFAULT_DESC =
  '分享 Vue 3 踩坑实录、TypeScript 类型避坑、Vite 配置技巧。不搞高深理论，专注问题解决。'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

interface SeoOptions {
  /** 页面标题（不含站点名，会自动拼接） */
  title?: MaybeRefOrGetter<string | undefined>
  /** 页面描述 */
  description?: MaybeRefOrGetter<string | undefined>
  /** 路由路径，用于拼 canonical/og:url，如 '/articles' */
  path?: MaybeRefOrGetter<string | undefined>
  /** 社交分享图，默认站点 og-image */
  image?: MaybeRefOrGetter<string | undefined>
  /** OG 类型：website | article */
  type?: MaybeRefOrGetter<'website' | 'article' | undefined>
}

/**
 * 统一设置页面 SEO meta（支持响应式：可传 ref / computed，切换文章时自动更新）
 * 在各 view 的 setup 顶层调用一次即可
 */
export function useSeo(options: SeoOptions = {}) {
  const url = computed(() =>
    toValue(options.path) ? `${SITE_URL}${toValue(options.path)}` : SITE_URL,
  )
  const title = computed(() =>
    toValue(options.title) ? `${toValue(options.title)} | ${SITE_NAME}` : DEFAULT_TITLE,
  )
  const description = computed(() => toValue(options.description) || DEFAULT_DESC)
  const image = computed(() => toValue(options.image) || DEFAULT_IMAGE)
  const type = computed(() => toValue(options.type) || 'website')

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
