<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { Post } from '@/types/blog'
import { deletePost, listAdminPosts } from '@/api/admin'
import { resolveAsset } from '@/api/request'

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

function coverBg(url?: string) {
  return url ? { backgroundImage: `url(${resolveAsset(url)})` } : {}
}

onMounted(load)
</script>

<template>
  <section>
    <div class="admin-pagehead">
      <div>
        <h1 class="admin-pagehead__title">文章管理</h1>
        <p class="admin-pagehead__sub">共 {{ total }} 篇 · 含草稿</p>
      </div>
      <div class="admin-pagehead__actions">
        <RouterLink to="/admin/posts/new" class="btn btn--primary btn--md">✍️ 写新文章</RouterLink>
      </div>
    </div>

    <div class="admin-panel">
      <div class="admin-panel__body" style="padding-top: 16px">
        <div class="admin-pills">
          <button class="pill" :class="{ 'is-active': statusFilter === null }" @click="changeStatus(null)">全部</button>
          <button class="pill" :class="{ 'is-active': statusFilter === 1 }" @click="changeStatus(1)">已发布</button>
          <button class="pill" :class="{ 'is-active': statusFilter === 0 }" @click="changeStatus(0)">草稿</button>
        </div>

        <div v-if="loading" class="admin-loading">加载中…</div>

        <table v-else class="admin-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>状态</th>
              <th>分类</th>
              <th>日期</th>
              <th>浏览</th>
              <th class="admin-table__ops">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in posts" :key="p.id">
              <td>
                <div class="admin-cell-title">
                  <span v-if="p.cover" class="admin-cell-title__cover" :style="coverBg(p.cover)" />
                  <span v-else class="admin-cell-title__cover admin-cell-title__cover--ph" />
                  <div class="admin-cell-title__meta">
                    <span class="admin-cell-title__name">{{ p.title }}</span>
                    <span class="admin-cell-title__slug">/{{ p.slug }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="tag" :class="p.status === 1 ? 'tag--success' : 'tag--warning'">
                  {{ statusText(p.status) }}
                </span>
              </td>
              <td>{{ p.category || '—' }}</td>
              <td>{{ p.date || '—' }}</td>
              <td>{{ p.views }}</td>
              <td class="admin-table__ops">
                <div class="admin-table__ops-inner">
                  <RouterLink :to="`/admin/posts/${p.id}/edit`" class="btn btn--link is-primary">编辑</RouterLink>
                  <button class="btn btn--link is-danger" @click="remove(p)">删除</button>
                  <RouterLink v-if="p.status === 1" :to="`/post/${p.slug}`" class="btn btn--link" target="_blank">查看</RouterLink>
                </div>
              </td>
            </tr>
            <tr v-if="!posts.length">
              <td colspan="6" class="admin-empty">还没有文章，点击右上角写一篇吧～</td>
            </tr>
          </tbody>
        </table>

        <div class="admin-pager" v-if="total > size">
          <button class="admin-pager__btn" :disabled="page <= 1" @click="prev">上一页</button>
          <span>第 {{ page }} 页 / 共 {{ Math.ceil(total / size) }} 页</span>
          <button class="admin-pager__btn" :disabled="page * size >= total" @click="next">下一页</button>
        </div>
      </div>
    </div>
  </section>
</template>
