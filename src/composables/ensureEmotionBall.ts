/**
 * emotion-ball 引擎兜底加载器（幂等、按序）
 *
 * index.html 中以 4 个 <script defer> 引入 public/emotion-ball/*.js，
 * 正常情况下会在应用入口前按序执行完毕。但生产部署中若脚本请求
 * 404 / 被 SPA 回退成 index.html（HTML 非法 JS 解析失败）/ 子路径
 * 部署导致根绝对路径失效，window.EmotionBall 将不存在，
 * 所有表情小球会静默消失。
 *
 * 本加载器在组件挂载时检测兜底：未就绪则按
 * rings → emotions → ball → engine 顺序动态注入脚本
 * （存在依赖关系，顺序不可乱）；多组件并发调用共享同一 Promise，
 * 只加载一次。脚本地址基于 import.meta.env.BASE_URL 拼接，
 * 兼容子路径部署。
 */

/** 引擎脚本清单（按依赖顺序） */
const ENGINE_SCRIPTS = ['rings.js', 'emotions.js', 'ball.js', 'engine.js'] as const

let loadPromise: Promise<void> | null = null

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.async = false // 双保险：动态脚本默认 async，显式关掉保序
    el.onload = () => resolve()
    el.onerror = () => {
      el.remove()
      reject(new Error(`emotion-ball 脚本加载失败: ${src}`))
    }
    document.head.appendChild(el)
  })
}

/** 确保 window.EmotionBall 就绪；已在则零开销直通 */
export function ensureEmotionBall(): Promise<void> {
  if (typeof window !== 'undefined' && window.EmotionBall) return Promise.resolve()
  if (loadPromise) return loadPromise

  const base = import.meta.env.BASE_URL || '/'
  loadPromise = (async () => {
    for (const name of ENGINE_SCRIPTS) {
      await injectScript(`${base}emotion-ball/${name}`)
    }
    if (!window.EmotionBall) {
      throw new Error('emotion-ball 脚本已加载，但 window.EmotionBall 仍未定义')
    }
  })().catch((e) => {
    // 失败清空缓存：允许后续组件挂载时重试（如网络瞬时抖动）
    loadPromise = null
    throw e
  })

  return loadPromise
}
