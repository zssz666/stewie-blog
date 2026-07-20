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
  <section>
    <div class="admin-pagehead">
      <div>
        <h1 class="admin-pagehead__title">评论审核</h1>
        <p class="admin-pagehead__sub">共 {{ total }} 条评论</p>
      </div>
    </div>

    <div class="admin-panel">
      <div class="admin-panel__body" style="padding-top: 16px">
        <div class="admin-pills">
          <button class="pill" :class="{ 'is-active': statusFilter === null }" @click="changeStatus(null)">全部</button>
          <button class="pill" :class="{ 'is-active': statusFilter === 0 }" @click="changeStatus(0)">待审</button>
          <button class="pill" :class="{ 'is-active': statusFilter === 1 }" @click="changeStatus(1)">已通过</button>
          <button class="pill" :class="{ 'is-active': statusFilter === 2 }" @click="changeStatus(2)">垃圾</button>
        </div>

        <div v-if="loading" class="admin-loading">加载中…</div>

        <ul v-else class="cmt-list">
          <li v-for="c in comments" :key="c.id" class="cmt">
            <div class="cmt__avatar">{{ c.nickname.charAt(0) }}</div>
            <div class="cmt__body">
              <div class="cmt__meta">
                <span class="cmt__nick">{{ c.nickname }}</span>
                <span v-if="c.parentId" class="tag tag--info" style="padding: 1px 8px">回复</span>
                <span
                  class="tag"
                  :class="{
                    'tag--warning': c.status === 0,
                    'tag--success': c.status === 1,
                    'tag--danger': c.status === 2,
                  }"
                  style="padding: 1px 8px"
                >{{ statusText(c.status) }}</span>
                <span class="cmt__date">{{ c.createdAt }}</span>
                <span class="cmt__post">· 文章 #{{ c.postId }}</span>
              </div>
              <p class="cmt__content">{{ c.content }}</p>
              <div class="cmt__ops">
                <button
                  v-if="c.status !== 1"
                  class="btn btn--link is-ok"
                  :disabled="busyId === c.id"
                  @click="setStatus(c, 1)"
                >通过</button>
                <button
                  v-if="c.status !== 2"
                  class="btn btn--link"
                  :disabled="busyId === c.id"
                  @click="setStatus(c, 2)"
                >标记垃圾</button>
                <button
                  class="btn btn--link is-danger"
                  :disabled="busyId === c.id"
                  @click="remove(c)"
                >删除</button>
              </div>
            </div>
          </li>
          <li v-if="!comments.length" class="admin-empty">暂无评论</li>
        </ul>

        <div class="admin-pager" v-if="total > size">
          <button class="admin-pager__btn" :disabled="page <= 1" @click="prev">上一页</button>
          <span>第 {{ page }} 页 / 共 {{ Math.ceil(total / size) }} 页</span>
          <button class="admin-pager__btn" :disabled="page * size >= total" @click="next">下一页</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cmt-list {
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
</style>
