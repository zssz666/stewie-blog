/**
 * emotion-ball 库的全局类型声明
 * 对应 public/emotion-ball/*.js（rings → emotions → ball → engine 按序加载）
 * 库本身是零依赖浏览器脚本，通过 window.EmotionBall 暴露 SDK
 */

/** 表情小球实例（EmotionBall.create 的返回值） */
export interface EmotionBallEngine {
  /** 切换表情（未知 ID 自动回退待机）；auto=true 不重置待机计时 */
  setEmotion(id: string, opts?: { auto?: boolean }): boolean
  /** AI 对接入口：接受 { emotionId, tips } 对象或其 JSON 字符串 */
  handleAIMessage(msg: string | { emotionId: string; tips?: string }): boolean
  /** 设置注视目标（横向 ±1、纵向 ±1，球心为原点） */
  setGaze(nx: number, ny: number): EmotionBallEngine
  clearGaze(): EmotionBallEngine
  /** 整圈自旋（达速甩彩带）；进行中不可打断 */
  spin(turns?: number, dir?: number): EmotionBallEngine
  /** 一次性撒花粒子爆发 */
  burst(count?: number): EmotionBallEngine
  /** 4 段递减抛物线弹跳 */
  bounce(): EmotionBallEngine
  setActive(on: boolean): void
  replay(): void
  destroy(): void
  on(evt: 'change' | 'tips' | 'error', cb: (payload: never) => void): EmotionBallEngine
  off(evt: 'change' | 'tips' | 'error', cb: (payload: never) => void): EmotionBallEngine
  startTour(ids: string[], interval?: number): void
  stopTour(): void
  readonly emotionId: string | null
  readonly touring: boolean
  /** 实例主题色（体色恒定覆盖表情自带色）；运行时可直接改以跟随站点主题切换 */
  _theme: { body: string; eyes: string } | null
}

/** create 可选项 */
export interface EmotionBallCreateOptions {
  /** 初始表情 ID（'00'~'41'） */
  emotion?: string
  /** 身体形状：blob 圆胖 / wedge 三角 / gem 菱形 */
  shape?: 'blob' | 'wedge' | 'gem'
  /** 主题色：传入后体色恒为该色（覆盖表情自带色），眼睛变 eyeColor */
  color?: string
  eyeColor?: string
  /** 小尺寸实例放大眼睛占比 */
  eyeScale?: number
  /** 待机策略：超时自动回待机 / 睡眠 */
  idle?:
    | boolean
    | { standbyAfter?: number; sleepAfter?: number; standbyId?: string; sleepId?: string }
  /** 无障碍名称 */
  label?: string
  /** 轻量模式：关闭 zzz / 彩带 / 撒花特效 */
  lite?: boolean
  autostart?: boolean
  fallbackId?: string
}

/** window.EmotionBall 静态入口 */
export interface EmotionBallStatic {
  create(target: HTMLElement | string, opts?: EmotionBallCreateOptions): EmotionBallEngine
  createBall(container: HTMLElement, opts?: EmotionBallCreateOptions): unknown
  version: string
  config: {
    register(raw: unknown): { ok: boolean; id?: string; errors?: string[] }
    get(id: string): unknown
    list(group?: string): unknown[]
    groups(): { key: string; name: string; en: string }[]
    exportConfig(): string
    importConfig(json: string | unknown): { ok: boolean; added: number; errors: string[] }
  }
}

declare global {
  interface Window {
    EmotionBall?: EmotionBallStatic
  }
}
