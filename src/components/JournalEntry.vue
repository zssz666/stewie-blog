<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { resolveAsset } from '@/api/request'
import type { Post } from '@/types/blog'

const props = defineProps<{ post: Post; featured?: boolean }>()
const weekdayFormat = new Intl.DateTimeFormat('zh-CN', { weekday: 'short', timeZone: 'UTC' })

const dateStamp = computed(() => {
  if (!props.post.date) return
  const iso = props.post.date.slice(0, 10)
  const date = new Date(iso)
  return {
    iso,
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    weekday: weekdayFormat.format(date),
  }
})

const opening = computed(() => {
  if (!props.post.content) return ''
  const draft = document.createElement('template')
  draft.innerHTML = props.post.content
  const paragraph = Array.from(draft.content.querySelectorAll('p')).find(
    (item) => item.textContent?.trim() && !item.closest('blockquote, pre'),
  )
  return paragraph?.textContent?.replace(/\s+/g, ' ').trim()
})
</script>

<template>
  <article class="journal-entry" :class="{ 'journal-entry--featured': featured }">
    <time v-if="dateStamp" class="journal-entry__date" :datetime="dateStamp.iso">
      <span>{{ dateStamp.month }} 月</span>
      <span class="journal-entry__day">{{ dateStamp.day }}<span class="sr-only"> 日</span></span>
      <span>{{ dateStamp.weekday }}</span>
    </time>

    <RouterLink
      :to="{ name: 'post', params: { slug: post.slug } }"
      class="journal-entry__page"
      :class="{ 'journal-entry__page--illustrated': post.cover }"
    >
      <img
        v-if="post.cover"
        :src="resolveAsset(post.cover)"
        class="journal-entry__photo"
        alt=""
        :loading="featured ? 'eager' : 'lazy'"
        decoding="async"
      />
      <div class="journal-entry__writing">
        <h3 class="journal-entry__title">{{ post.title }}</h3>
        <p v-if="opening" class="journal-entry__opening">{{ opening }}</p>
        <span class="journal-entry__more" aria-hidden="true">翻开这一篇 <span>↗</span></span>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.journal-entry {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  gap: clamp(14px, 2.5vw, 30px);
  align-items: start;
  padding-block: clamp(18px, 3vw, 30px);
  border-bottom: 1px solid var(--color-border);
}

.journal-entry__date {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding-top: 6px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.journal-entry__day {
  color: var(--color-primary-hover);
  font: 700 clamp(30px, 4.1vw, 48px)/1 var(--font-display);
}

.journal-entry__page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-column: 2;
  align-items: center;
  gap: clamp(14px, 2.6vw, 28px);
  min-width: 0;
  color: var(--color-heading);
}

.journal-entry__page--illustrated {
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
}

.journal-entry--featured .journal-entry__page--illustrated {
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
}

.journal-entry__photo {
  width: 100%;
  aspect-ratio: 16 / 10;
  display: block;
  object-fit: cover;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-soft);
}

.journal-entry__writing { min-width: 0; }
.journal-entry__title { color: var(--color-heading); font: 700 clamp(17px, 2vw, 22px)/1.45 var(--font-sans); overflow-wrap: anywhere; }
.journal-entry--featured .journal-entry__title { font-size: clamp(19px, 2.3vw, 25px); }
.journal-entry__opening {
  display: -webkit-box;
  margin-top: 10px;
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.75;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
.journal-entry__more { display: inline-flex; gap: 7px; margin-top: 12px; color: var(--color-accent); font-size: 13px; }
.journal-entry__page:is(:hover, :focus-visible) .journal-entry__title {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.journal-entry__page:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 5px; }

@media (max-width: 640px) {
  .journal-entry { grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .journal-entry__date { flex-direction: row; align-items: baseline; gap: 6px; padding: 0; }
  .journal-entry__day { font-size: 27px; }
  .journal-entry .journal-entry__page--illustrated,
  .journal-entry .journal-entry__page { grid-column: 1; grid-template-columns: minmax(0, 1fr); }
}
</style>
