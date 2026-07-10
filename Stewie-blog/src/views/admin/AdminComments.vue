<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Comment } from '@/types/blog'
import { deleteComment, listAdminComments, reviewComment } from '@/api/admin'

const comments = ref<Comment[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const statusFilter = ref<number | null>(0)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await listAdminComments({
      page: page.value,
      size: size.value,
      status: statusFilter.value ?? undefined,
    })
    comments.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function changeStatus(s: number | null) {
  statusFilter.value = s
  page.value = 1
  load()
}

async function approve(c: Comment) {
  await reviewComment(c.id, 1)
  await load()
}
async function spam(c: Comment) {
  await reviewComment(c.id, 2)
  await load()
}
async function remove(c: Comment) {
  if (!confirm('确定删除该评论？')) return
  await deleteComment(c.id)
  await load()
}

function statusText(s: number) {
  return s === 1 ? '已通过' : s === 2 ? '垃圾' : '待审核'
}

onMounted(load)
</script>

<template>
  <section class="cm">
    <div class="cm__head">
      <h1 class="cm__title">评论审核</h1>
      <p class="cm__sub">共 {{ total }} 条</p>
    </div>

    <div class="cm__filters">
      <button :class="{ on: statusFilter === 0 }" @click="changeStatus(0)">待审核</button>
      <button :class="{ on: statusFilter === 1 }" @click="changeStatus(1)">已通过</button>
      <button :class="{ on: statusFilter === 2 }" @click="changeStatus(2)">垃圾</button>
      <button :class="{ on: statusFilter === null }" @click="changeStatus(null)">全部</button>
    </div>

    <div v-if="loading" class="cm__loading">加载中…</div>

    <ul v-else class="cm__list">
      <li v-for="c in comments" :key="c.id" class="cm__item">
        <div class="cm__meta">
          <span class="cm__nick">{{ c.nickname }}</span>
          <span class="cm__badge" :class="{
            'cm__badge--0': c.status === 0,
            'cm__badge--1': c.status === 1,
            'cm__badge--2': c.status === 2,
          }">{{ statusText(c.status) }}</span>
          <span class="cm__post">文章 #{{ c.postId }}</span>
          <span class="cm__date">{{ c.createdAt }}</span>
        </div>
        <p class="cm__content">{{ c.content }}</p>
        <div class="cm__ops">
          <button v-if="c.status !== 1" class="op op--ok" @click="approve(c)">通过</button>
          <button v-if="c.status !== 2" class="op op--warn" @click="spam(c)">标记垃圾</button>
          <button class="op op--del" @click="remove(c)">删除</button>
        </div>
      </li>
      <li v-if="!comments.length" class="cm__empty">暂无评论</li>
    </ul>
  </section>
</template>

<style scoped>
.cm {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
}
.cm__head {
  margin-bottom: 16px;
}
.cm__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-heading);
  font-family: var(--font-serif);
}
.cm__sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text-tertiary);
}
.cm__filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.cm__filters button {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
}
.cm__filters button.on {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.cm__loading {
  padding: 40px;
  text-align: center;
  color: var(--color-text-tertiary);
}
.cm__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cm__item {
  padding: 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.cm__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
}
.cm__nick {
  font-weight: 600;
  color: var(--color-heading);
}
.cm__badge {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 12px;
}
.cm__badge--0 {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}
.cm__badge--1 {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.12);
}
.cm__badge--2 {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}
.cm__post,
.cm__date {
  color: var(--color-text-tertiary);
  font-size: 12px;
}
.cm__content {
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text);
  white-space: pre-wrap;
}
.cm__ops {
  display: flex;
  gap: 8px;
}
.op {
  padding: 5px 12px;
  font-size: 13px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}
.op--ok:hover {
  color: #16a34a;
  border-color: rgba(22, 163, 74, 0.4);
}
.op--warn:hover {
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.4);
}
.op--del:hover {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}
.cm__empty {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: 40px;
}
</style>
