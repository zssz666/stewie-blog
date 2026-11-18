<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { searchPosts } from '@/api/post'
import { POST_TYPE_LABELS, type Post } from '@/types/blog'

const PREVIEW_SIZE = 6
const SEARCH_DELAY = 180

const router = useRouter()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const input = useTemplateRef<HTMLInputElement>('input')
const search = ref('')
const query = computed(() => search.value.trim())
const results = ref<Post[]>([])
const activeIndex = ref(-1)
const loading = ref(false)
const failed = ref(false)
const activeId = computed(() => activeIndex.value < 0 ? undefined : 'quick-search-' + activeIndex.value)
let previousFocus: HTMLElement | null = null

watch(query, (term, _oldTerm, onCleanup) => {
  results.value = []
  activeIndex.value = -1
  failed.value = false
  loading.value = !!term
  if (!term) return

  let current = true
  const timer = window.setTimeout(async () => {
    try {
      const page = await searchPosts(term, 1, PREVIEW_SIZE)
      if (current) results.value = page.list
    } catch (error) {
      if (current) {
        failed.value = true
        console.error('搜索预览失败:', error)
      }
    } finally {
      if (current) loading.value = false
    }
  }, SEARCH_DELAY)
  onCleanup(() => {
    current = false
    window.clearTimeout(timer)
  })
}, { flush: 'sync' })

function open(trigger: HTMLElement | null) {
  if (!dialog.value || dialog.value.open) return
  previousFocus = trigger
  dialog.value.showModal()
  input.value?.focus()
}

function close() {
  dialog.value?.close()
}

function reset() {
  search.value = ''
  if (previousFocus?.isConnected) previousFocus.focus()
  previousFocus = null
}

function selectResult(direction: number) {
  const count = results.value.length
  if (!count) return
  activeIndex.value = activeIndex.value < 0
    ? (direction > 0 ? 0 : count - 1)
    : (activeIndex.value + direction + count) % count
  document.getElementById('quick-search-' + activeIndex.value)?.scrollIntoView({ block: 'nearest' })
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.isComposing || !results.value.length) return
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  selectResult(event.key === 'ArrowDown' ? 1 : -1)
}

function openResult(post: Post) {
  close()
  void router.push({ name: 'post', params: { slug: post.slug } })
}

function openAllResults() {
  if (!query.value) return
  const term = query.value
  close()
  void router.push({ name: 'search', query: { q: term } })
}

function submit() {
  const selected = results.value[activeIndex.value]
  if (selected) openResult(selected)
  else openAllResults()
}

defineExpose({ open, close })
</script>

<template>
  <dialog ref="dialog" class="quick-search" aria-labelledby="quick-search-label" @close="reset">
    <form class="quick-search__form" @submit.prevent="submit">
      <div class="quick-search__head">
        <label id="quick-search-label" for="quick-search-input">搜索实验记录</label>
        <button type="button" class="quick-search__close" @click="close">关闭</button>
      </div>
      <input
        id="quick-search-input"
        ref="input"
        v-model="search"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="quick-search-results"
        :aria-expanded="results.length > 0"
        :aria-activedescendant="activeId"
        placeholder="文章标题或关键词"
        autocomplete="off"
        @keydown="onInputKeydown"
      />

      <p v-if="loading || failed || (query && !results.length)" class="quick-search__status" role="status">
        {{ loading ? '正在查找…' : failed ? '暂时无法预览结果。' : '没有找到匹配的记录。' }}
      </p>
      <ul id="quick-search-results" v-show="results.length" role="listbox" aria-label="搜索预览">
        <li
          v-for="(post, index) in results"
          :id="'quick-search-' + index"
          :key="post.id"
          role="option"
          :aria-selected="activeIndex === index"
          @mousedown.prevent
          @click="openResult(post)"
        >
          <span>{{ post.title }}</span>
          <small>{{ POST_TYPE_LABELS[post.postType] }}</small>
        </li>
      </ul>
      <button v-if="query" type="button" class="quick-search__all" @click="openAllResults">
        查看全部结果 <span aria-hidden="true">↗</span>
      </button>
    </form>
  </dialog>
</template>

<style scoped>
.quick-search {
  width: min(560px, calc(100% - 28px));
  max-height: 78dvh;
  margin: 10vh auto auto;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  color: var(--color-heading);
  box-shadow: var(--shadow-lg);
}
.quick-search::backdrop { background: rgba(6, 14, 22, 0.6); }
.quick-search__form { padding: clamp(14px, 4vw, 24px); }
.quick-search__head { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 10px; font-weight: 700; }
.quick-search input {
  width: 100%;
  min-height: 48px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}
.quick-search button { min-height: 44px; color: var(--color-accent); font: inherit; }
.quick-search__close { padding-inline: 8px; }
.quick-search__status { margin-top: 12px; color: var(--color-text-secondary); font-size: 14px; }
.quick-search ul { padding: 0; margin: 10px 0 0; list-style: none; }
.quick-search li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 2px 12px; min-height: 44px; padding: 8px 10px; border-radius: var(--radius-sm); cursor: pointer; }
.quick-search li:is(:hover, [aria-selected='true']) { background: var(--color-primary-soft); }
.quick-search li small { color: var(--color-text-secondary); }
.quick-search__all { margin-top: 6px; text-decoration: underline; text-underline-offset: 4px; }
.quick-search :is(button, input):focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
</style>
