import { useHead } from '@unhead/vue'
import { computed, onBeforeUnmount, toValue, watch, type MaybeRefOrGetter } from 'vue'

/** 站点根 URL，换域名时改这一处即可（已切到 ICP 备案通过的正式域名） */
const SITE_URL = 'https://stewie.fun'
const SITE_NAME = 'Stewie 的前端实验室'
const DEFAULT_TITLE = 'Stewie 的前端实验室 — Vue 3 · TypeScript · Vite 踩坑实验报告'
const DEFAULT_DESC =
  '把每个 bug 做成一次实验：Vue 3 踩坑实录、TypeScript 类型避坑、Vite 构建调优，每篇都有复现步骤与修复方案。拒绝空洞理论，只登记真实战例。'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

/** 站点通用关键词：自动并入每个页面的 keywords */
const SITE_KEYWORDS = ['前端开发', 'Vue 3', 'TypeScript', 'Vite', '踩坑记录']

/** JSON-LD 注入标记（head 内由 useSeo 管理的 ld+json 标签） */
const LD_ATTR = 'data-seo-jsonld'

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
  /** 页面关键词（文章页传 tags），自动并入站点通用词 */
  keywords?: MaybeRefOrGetter<string[] | undefined>
  /** 发布时间 ISO 8601（article 页：article:published_time 与结构化数据用） */
  publishedTime?: MaybeRefOrGetter<string | undefined>
  /** 修改时间 ISO 8601（article 页可选） */
  modifiedTime?: MaybeRefOrGetter<string | undefined>
  /** 禁止收录：搜索结果页 / 404 / 登录页等无独立内容价值的页面 */
  noindex?: boolean
  /** 附加 JSON-LD 结构化数据（如文章页 BlogPosting），随响应式数据自动更新 */
  jsonLd?: MaybeRefOrGetter<Record<string, unknown>[] | undefined>
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
  const keywords = computed(() =>
    [...(toValue(options.keywords) ?? []), ...SITE_KEYWORDS].join(', '),
  )
  const publishedTime = computed(() => toValue(options.publishedTime))
  const modifiedTime = computed(() => toValue(options.modifiedTime))

  useHead({
    title,
    meta: [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      {
        name: 'robots',
        content: options.noindex
          ? 'noindex, follow'
          : 'index, follow, max-image-preview:large, max-snippet:-1',
      },
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
      /* article 专属字段：仅调用方传参时注册（content 保持响应式，加载完成后自动填充） */
      ...(options.publishedTime !== undefined
        ? [{ property: 'article:published_time', content: publishedTime }]
        : []),
      ...(options.modifiedTime !== undefined
        ? [{ property: 'article:modified_time', content: modifiedTime }]
        : []),
    ],
    link: [{ rel: 'canonical', href: url }],
  })

  /* ── JSON-LD 结构化数据：DOM 直操作（ SPA 场景下比 head 库的 script 条目更可控） ── */
  if (typeof document !== 'undefined') {
    const jsonLdList = computed(() => toValue(options.jsonLd) ?? [])
    watch(
      jsonLdList,
      (list) => {
        document.head.querySelectorAll(`script[${LD_ATTR}]`).forEach((el) => el.remove())
        for (const data of list) {
          const el = document.createElement('script')
          el.type = 'application/ld+json'
          el.setAttribute(LD_ATTR, '')
          el.textContent = JSON.stringify(data)
          document.head.appendChild(el)
        }
      },
      { immediate: true, deep: true },
    )
    onBeforeUnmount(() => {
      document.head.querySelectorAll(`script[${LD_ATTR}]`).forEach((el) => el.remove())
    })
  }
}
