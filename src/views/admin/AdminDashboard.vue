<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { Post } from '@/types/blog'
import { deletePost, listAdminPosts } from '@/api/admin'

const router = useRouter()
const posts = ref<Post[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const statusFilter = ref<number | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await listAdminPosts({
      page: page.value,
      size: size.value,
      status: statusFilter.value ?? undefined,
    })
    posts.value = res.list
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

async function remove(post: Post) {
  if (!confirm(`确定删除《${post.title}》？该操作不可恢复（逻辑删除）。`)) return
  await deletePost(post.id)
  if (posts.value.length === 1 && page.value > 1) page.value--
  await load()
}

function statusText(s?: number) {
  return s === 1 ? '已发布' : '草稿'
}

onMounted(load)
</script>

<template>
  <section class="dash">
    <div class="dash__head">
      <div>
        <h1 class="dash__title">文章管理</h1>
        <p class="dash__sub">共 {{ total }} 篇 · 含草稿</p>
      </div>
      <RouterLink to="/admin/posts/new" class="dash__new">✍️ 写新文章</RouterLink>
    </div>

    <div class="dash__filters">
      <button :class="{ on: statusFilter === null }" @click="changeStatus(null)">全部</button>
      <button :class="{ on: statusFilter === 1 }" @click="changeStatus(1)">已发布</button>
      <button :class="{ on: statusFilter === 0 }" @click="changeStatus(0)">草稿</button>
    </div>

    <div v-if="loading" class="dash__loading">加载中…</div>

    <table v-else class="dash__table">
      <thead>
        <tr>
          <th>标题</th>
          <th>状态</th>
          <th>分类</th>
          <th>日期</th>
          <th>浏览</th>
          <th class="dash__ops">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in posts" :key="p.id">
          <td class="dash__title-cell">
            <span class="dash__cover" v-if="p.cover" :style="{ backgroundImage: `url(${p.cover})` }" />
            <span v-else class="dash__cover dash__cover--ph" />
            <div class="dash__title-meta">
              <span class="dash__name">{{ p.title }}</span>
              <span class="dash__slug">/{{ p.slug }}</span>
            </div>
          </td>
          <td>
            <span class="badge" :class="p.status === 1 ? 'badge--on' : 'badge--off'">
              {{ statusText(p.status) }}
            </span>
          </td>
          <td>{{ p.category || '—' }}</td>
          <td>{{ p.date || '—' }}</td>
          <td>{{ p.views }}</td>
          <td class="dash__ops">
            <RouterLink :to="`/admin/posts/${p.id}/edit`" class="op op--edit">编辑</RouterLink>
            <button class="op op--del" @click="remove(p)">删除</button>
            <RouterLink v-if="p.status === 1" :to="`/post/${p.slug}`" class="op" target="_blank">查看</RouterLink>
          </td>
        </tr>
        <tr v-if="!posts.length">
          <td colspan="6" class="dash__empty">还没有文章，点击右上角写一篇吧～</td>
        </tr>
      </tbody>
    </table>

    <div class="dash__pager" v-if="total > size">
      <button :disabled="page <= 1" @click="prev">上一页</button>
      <span>第 {{ page }} 页</span>
      <button :disabled="page * size >= total" @click="next">下一页</button>
    </div>
  </section>
</template>

<style scoped>
.dash {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
}
.dash__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.dash__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-heading);
  font-family: var(--font-serif);
}
.dash__sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text-tertiary);
}
.dash__new {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: 10px;
}
.dash__new:hover {
  opacity: 0.92;
}
.dash__filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.dash__filters button {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
}
.dash__filters button.on {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.dash__loading {
  padding: 40px;
  text-align: center;
  color: var(--color-text-tertiary);
}
.dash__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.dash__table th {
  text-align: left;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  border-bottom: 1px solid var(--color-border);
}
.dash__table td {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}
.dash__title-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dash__cover {
  width: 44px;
  height: 32px;
  border-radius: 6px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}
.dash__cover--ph {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  opacity: 0.5;
}
.dash__title-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.dash__name {
  font-weight: 600;
  color: var(--color-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}
.dash__slug {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.badge {
  padding: 3px 10px;
  font-size: 12px;
  border-radius: 999px;
}
.badge--on {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.12);
}
.badge--off {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}
.dash__ops {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}
.op {
  padding: 5px 12px;
  font-size: 13px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  text-decoration: none;
}
.op:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.op--edit {
  color: var(--color-primary);
}
.op--del:hover {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}
.dash__empty {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: 40px;
}
.dash__pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 18px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.dash__pager button {
  padding: 7px 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
}
.dash__pager button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
