<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Comment } from '@/types/blog'
import { deleteComment, listAdminComments, reviewComment } from '@/api/admin'

const comments = ref<Comment[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(15)
const statusFilter = ref<number | null>(null)
const loading = ref(false)
const busyId = ref<number | null>(null)

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

function prev() {
  if (page.value > 1) {
    page.value--
    load()
  }
}

function next() {
  if (page.value * size.value < total.value) {
    page.value++
    load()
  }
}

async function setStatus(c: Comment, s: number) {
  busyId.value = c.id
  try {
    await reviewComment(c.id, s)
    await load()
  } finally {
    busyId.value = null
  }
}

async function remove(c: Comment) {
  if (!confirm(`确定删除这条评论？该操作不可恢复。`)) return
  busyId.value = c.id
  try {
    await deleteComment(c.id)
    if (comments.value.length === 1 && page.value > 1) page.value--
    await load()
  } finally {
    busyId.value = null
  }
}

function statusText(s: number) {
  return s === 1 ? '已通过' : s === 2 ? '垃圾' : '待审'
}

onMounted(load)
</script>

<template>
  <section class="cmts">
    <div class="cmts__head">
      <div>
        <h1 class="cmts__title">评论审核</h1>
        <p class="cmts__sub">共 {{ total }} 条评论</p>
      </div>
    </div>

    <div class="cmts__filters">
      <button :class="{ on: statusFilter === null }" @click="changeStatus(null)">全部</button>
      <button :class="{ on: statusFilter === 0 }" @click="changeStatus(0)">待审</button>
      <button :class="{ on: statusFilter === 1 }" @click="changeStatus(1)">已通过</button>
      <button :class="{ on: statusFilter === 2 }" @click="changeStatus(2)">垃圾</button>
    </div>

    <div v-if="loading" class="cmts__loading">加载中…</div>

    <ul v-else class="cmts__list">
      <li v-for="c in comments" :key="c.id" class="cmt">
        <div class="cmt__avatar">{{ c.nickname.charAt(0) }}</div>
        <div class="cmt__body">
          <div class="cmt__meta">
            <span class="cmt__nick">{{ c.nickname }}</span>
            <span v-if="c.parentId" class="cmt__reply-tag">回复</span>
            <span
              class="cmt__badge"
              :class="{
                'cmt__badge--pending': c.status === 0,
                'cmt__badge--ok': c.status === 1,
                'cmt__badge--spam': c.status === 2,
              }"
            >{{ statusText(c.status) }}</span>
            <span class="cmt__date">{{ c.createdAt }}</span>
            <span class="cmt__post">· 文章 #{{ c.postId }}</span>
          </div>
          <p class="cmt__content">{{ c.content }}</p>
          <div class="cmt__ops">
            <button
              v-if="c.status !== 1"
              class="op op--ok"
              :disabled="busyId === c.id"
              @click="setStatus(c, 1)"
            >通过</button>
            <button
              v-if="c.status !== 2"
              class="op"
              :disabled="busyId === c.id"
              @click="setStatus(c, 2)"
            >标记垃圾</button>
            <button
              class="op op--del"
              :disabled="busyId === c.id"
              @click="remove(c)"
            >删除</button>
          </div>
        </div>
      </li>
      <li v-if="!comments.length" class="cmts__empty">暂无评论</li>
    </ul>

    <div class="cmts__pager" v-if="total > size">
      <button :disabled="page <= 1" @click="prev">上一页</button>
      <span>第 {{ page }} 页</span>
      <button :disabled="page * size >= total" @click="next">下一页</button>
    </div>
  </section>
</template>

<style scoped>
.cmts {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
}
.cmts__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.cmts__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-heading);
  font-family: var(--font-serif);
}
.cmts__sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text-tertiary);
}
.cmts__filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.cmts__filters button {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
}
.cmts__filters button.on {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.cmts__loading {
  padding: 40px;
  text-align: center;
  color: var(--color-text-tertiary);
}
.cmts__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.cmt {
  display: flex;
  gap: 14px;
  padding: 16px 4px;
  border-bottom: 1px solid var(--color-border);
}
.cmt:last-child {
  border-bottom: none;
}
.cmt__avatar {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
}
.cmt__body {
  flex: 1;
  min-width: 0;
}
.cmt__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--color-text-tertiary);
}
.cmt__nick {
  font-weight: 600;
  color: var(--color-heading);
}
.cmt__reply-tag {
  padding: 1px 8px;
  font-size: 11px;
  color: var(--color-primary);
  background: var(--color-primary-soft, rgba(37, 99, 235, 0.12));
  border-radius: 999px;
}
.cmt__badge {
  padding: 2px 9px;
  font-size: 12px;
  border-radius: 999px;
}
.cmt__badge--pending {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}
.cmt__badge--ok {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.12);
}
.cmt__badge--spam {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}
.cmt__content {
  margin: 8px 0 10px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-word;
}
.cmt__ops {
  display: flex;
  gap: 8px;
}
.op {
  padding: 5px 14px;
  font-size: 13px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
}
.op:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.op:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.op--ok {
  color: #16a34a;
  border-color: rgba(22, 163, 74, 0.35);
}
.op--ok:hover:not(:disabled) {
  color: #16a34a;
  border-color: #16a34a;
  background: rgba(22, 163, 74, 0.08);
}
.op--del:hover:not(:disabled) {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}
.cmts__empty {
  padding: 40px;
  text-align: center;
  color: var(--color-text-tertiary);
}
.cmts__pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 18px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.cmts__pager button {
  padding: 7px 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
}
.cmts__pager button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
