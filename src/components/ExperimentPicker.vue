<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { getPosts } from '@/api/post'
import type { Post } from '@/types/blog'

defineProps<{ topics: string[] }>()
const emit = defineEmits<{ scanStart: []; scanEnd: [found: boolean] }>()
const topic = ref('')
const selected = ref<Post | null>(null)
const scanning = ref(false)
const notice = ref('')
let lastPage = 0

watch(topic, () => {
  selected.value = null
  notice.value = ''
  lastPage = 0
})

async function drawExperiment() {
  if (scanning.value) return
  scanning.value = true
  notice.value = ''
  emit('scanStart')
  let found = false
  try {
    const query = { size: 1, tag: topic.value || undefined }
    const first = await getPosts(query)
    if (!first.total) {
      selected.value = null
      notice.value = '这个范围里还没有可抽取的公开文章。'
      return
    }
    if (first.total === 1 && lastPage === 1 && first.list[0]?.id === selected.value?.id) {
      notice.value = '这个范围里只有这一篇。'
      return
    }
    const excludedPage = first.total > 1 && lastPage <= first.total ? lastPage : 0
    const drawCount = first.total - Number(Boolean(excludedPage))
    const drawIndex = Math.floor(Math.random() * drawCount) + 1
    const page = excludedPage && drawIndex >= excludedPage ? drawIndex + 1 : drawIndex
    const result = page === 1 ? first : await getPosts({ ...query, page })
    const post = result.list[0]
    if (!post?.slug) throw new Error('抽取时未返回有效文章')
    selected.value = post
    lastPage = page
    found = true
  } catch (error) {
    console.error('抽取文章失败:', error)
    notice.value = '这一抽没能完成，请重试。'
  } finally {
    scanning.value = false
    emit('scanEnd', found)
  }
}
</script>

<template>
  <section class="experiment-picker" aria-label="随机推荐实验记录">
    <div class="experiment-picker__head">
      <h2>下一篇，交给实验室。</h2>
      <div class="experiment-picker__controls">
        <label>主题
          <select v-model="topic" :disabled="scanning">
            <option value="">全部主题</option>
            <option v-for="name in topics" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>
        <button data-lab-draw class="experiment-picker__draw" type="button" :disabled="scanning" :aria-busy="scanning" aria-controls="experiment-result" @click="drawExperiment">
          {{ scanning ? '正在抽取…' : selected ? '换一篇' : '抽一个实验' }}
        </button>
      </div>
    </div>
    <div id="experiment-result" class="experiment-picker__result" aria-live="polite" aria-atomic="true">
      <Transition name="experiment" mode="out-in">
        <article v-if="selected" :key="selected.id" class="experiment-result">
          <p class="experiment-result__meta">{{ topic || selected.tag }} · {{ selected.readingTime }} 分钟阅读</p>
          <RouterLink :to="`/post/${selected.slug}`">{{ selected.title }} <span aria-hidden="true">→</span></RouterLink>
        </article>
        <p v-else-if="!notice" class="experiment-picker__hint">从已发布的实验记录里找一篇，旧文章也会被抽到。</p>
      </Transition>
      <p v-if="notice" class="experiment-picker__hint">{{ notice }}</p>
    </div>
    <RouterLink to="/articles" class="experiment-picker__all">自己挑选，浏览全部文章</RouterLink>
  </section>
</template>

<style scoped>
.experiment-picker { padding: 20px; background: var(--color-surface); border-radius: var(--radius-md); }
.experiment-picker__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.experiment-picker__controls, .experiment-picker__controls label { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.experiment-picker__controls label { color: var(--color-text-secondary); font-size: 14px; }
.experiment-picker__controls select { max-width: 100%; min-height: 44px; padding: 6px 12px; background: var(--color-bg-soft); color: var(--color-text); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font: inherit; }
.experiment-picker h2 { margin: 0; font-family: var(--font-display); font-size: 19px; color: var(--color-heading); }
.experiment-picker__draw { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 44px; padding: 8px 14px; background: var(--color-primary-hover); color: var(--color-on-primary); border-radius: var(--radius-sm); font-weight: 600; font-size: 14px; transition: transform 140ms var(--ease-out), background-color 180ms ease; }
.experiment-picker__draw:disabled { background: var(--color-bg-mute); color: var(--color-text-secondary); cursor: default; }
.experiment-picker__draw:active:not(:disabled) { transform: scale(.97); }
.experiment-picker__draw:focus-visible, .experiment-picker a:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 4px; }
.experiment-picker__result { margin-top: 12px; }
.experiment-picker__hint { font-size: 14px; line-height: 1.7; color: var(--color-text-secondary); }
.experiment-result__meta { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 6px; }
.experiment-result a { display: block; font-size: 17px; font-weight: 600; line-height: 1.5; color: var(--color-heading); overflow-wrap: anywhere; }
.experiment-result a span { display: inline-block; transition: transform 180ms var(--ease-out); }
.experiment-picker__all { display: inline-block; margin-top: 14px; padding-block: 4px; font-size: 13px; color: var(--color-accent); text-decoration: underline; text-underline-offset: 4px; }
.experiment-enter-active { transition: opacity 200ms ease, transform 240ms var(--ease-out); }
.experiment-leave-active { transition: opacity 120ms ease; }
.experiment-enter-from { opacity: 0; transform: translateY(10px); }
.experiment-leave-to { opacity: 0; }
@media (hover: hover) and (pointer: fine) {
  .experiment-picker__draw:hover:not(:disabled) { background: var(--color-primary-active); }
  .experiment-result a:hover span { transform: translateX(4px); }
}
</style>
