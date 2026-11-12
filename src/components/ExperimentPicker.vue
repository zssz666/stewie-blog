<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/blog'

const props = defineProps<{ posts: Post[]; loading: boolean; error: boolean }>()
const emit = defineEmits<{ scanStart: []; scanEnd: [] }>()
const selected = ref<Post | null>(null)
const scanning = ref(false)
const available = computed(() => props.posts.filter(post => post.slug))
const exhausted = computed(() => available.value.length === 1 && selected.value !== null)
const disabled = computed(() => props.loading || props.error || !available.value.length || scanning.value || exhausted.value)
let timer: ReturnType<typeof setTimeout> | undefined

function drawExperiment() {
  if (disabled.value) return
  const pool = available.value.filter(post => post.id !== selected.value?.id)
  const next = pool[Math.floor(Math.random() * pool.length)]
  if (!next) return
  scanning.value = true
  emit('scanStart')
  const finish = () => {
    selected.value = next
    scanning.value = false
    emit('scanEnd')
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish()
  else timer = setTimeout(finish, 360)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <section class="experiment-picker" aria-label="随机推荐实验记录">
    <div class="experiment-picker__head">
      <h2>下一篇，交给实验室。</h2>
      <button data-lab-draw class="experiment-picker__draw" type="button" :disabled="disabled" :aria-busy="scanning" aria-controls="experiment-result" @click="drawExperiment">
        {{ scanning ? '正在抽取…' : selected ? (exhausted ? '已是唯一一篇' : '换一篇') : '抽一个实验' }}
        <span v-if="!scanning && !exhausted" aria-hidden="true">↗</span>
      </button>
    </div>
    <div id="experiment-result" class="experiment-picker__result" aria-live="polite" aria-atomic="true">
      <Transition name="experiment" mode="out-in">
        <article v-if="selected" :key="selected.id" class="experiment-result">
          <p class="experiment-result__meta">{{ selected.tag }} · {{ selected.readingTime }} 分钟阅读</p>
          <RouterLink :to="`/post/${selected.slug}`">{{ selected.title }} <span aria-hidden="true">→</span></RouterLink>
          <p class="experiment-result__excerpt">{{ selected.excerpt }}</p>
        </article>
        <p v-else class="experiment-picker__hint">{{ loading ? '正在读取实验记录…' : error ? '实验记录暂时未能加载，请稍后刷新重试。' : available.length ? `从最近的 ${available.length} 篇记录里，发现一个值得研究的问题。` : '还没有可抽取的实验记录，先去登记簿看看。' }}</p>
      </Transition>
    </div>
    <RouterLink to="/articles" class="experiment-picker__all">自己挑选，浏览全部文章</RouterLink>
  </section>
</template>

<style scoped>
.experiment-picker { padding: 20px; background: var(--color-surface); border-radius: var(--radius-md); }
.experiment-picker__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.experiment-picker h2 { margin: 0; font-family: var(--font-display); font-size: 19px; color: var(--color-heading); }
.experiment-picker__draw { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 44px; padding: 8px 14px; background: var(--color-primary-hover); color: var(--color-on-primary); border-radius: var(--radius-sm); font-weight: 600; font-size: 14px; transition: transform 140ms var(--ease-out), background-color 180ms ease; }
.experiment-picker__draw:disabled { background: var(--color-bg-mute); color: var(--color-text-secondary); cursor: default; }
.experiment-picker__draw:active:not(:disabled) { transform: scale(.97); }
.experiment-picker__draw:focus-visible, .experiment-picker a:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 4px; }
.experiment-picker__result { margin-top: 16px; min-height: 76px; }
.experiment-picker__hint, .experiment-result__excerpt { font-size: 14px; line-height: 1.7; color: var(--color-text-secondary); }
.experiment-result__meta { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 6px; }
.experiment-result a { display: block; font-size: 17px; font-weight: 600; line-height: 1.5; color: var(--color-heading); overflow-wrap: anywhere; }
.experiment-result a span { display: inline-block; transition: transform 180ms var(--ease-out); }
.experiment-result__excerpt { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 6px; }
.experiment-picker__all { display: inline-block; margin-top: 14px; padding-block: 4px; font-size: 13px; color: var(--color-accent); text-decoration: underline; text-underline-offset: 4px; }
.experiment-enter-active { transition: opacity 200ms ease, transform 240ms var(--ease-out); }
.experiment-leave-active { transition: opacity 120ms ease; }
.experiment-enter-from { opacity: 0; transform: translateY(10px); }
.experiment-leave-to { opacity: 0; }
@media (hover: hover) and (pointer: fine) {
  .experiment-picker__draw:hover:not(:disabled) { background: var(--color-primary-active); }
  .experiment-result a:hover span { transform: translateX(4px); }
}
@media (prefers-reduced-motion: reduce) {
  .experiment-enter-active, .experiment-leave-active, .experiment-picker__draw, .experiment-result a span { transition: none; }
  .experiment-enter-from, .experiment-picker__draw:active:not(:disabled) { transform: none; }
}
</style>
