<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Comment, Post } from '@/types/blog'
import { getStats, listAdminComments, listAdminPosts, type DashboardStats } from '@/api/admin'
import { resolveAsset } from '@/api/request'

/* ── 统计 ── */
const stats = ref<DashboardStats | null>(null)

/* ── 最近文章 / 待审核评论 ── */
const recentPosts = ref<Post[]>([])
const pendingComments = ref<Comment[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const [s, posts, comments] = await Promise.all([
      getStats(),
      listAdminPosts({ page: 1, size: 5 }),
      listAdminComments({ page: 1, size: 5, status: 0 }),
    ])
    stats.value = s
    recentPosts.value = posts.list
    pendingComments.value = comments.list
  } catch (e) {
    console.error('加载概览失败:', e)
  } finally {
    loading.value = false
  }
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
        <h1 class="admin-pagehead__title">仪表盘</h1>
        <p class="admin-pagehead__sub">站点数据概览与快捷操作</p>
      </div>
      <div class="admin-pagehead__actions">
        <RouterLink to="/admin/posts/new" class="btn btn--primary btn--md">✍️ 写新文章</RouterLink>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid" v-reveal>
      <div class="stat stat--primary">
        <span class="stat__ico">📄</span>
        <div class="stat__body">
          <span class="stat__num">{{ stats ? stats.postsPublished : '–' }}</span>
          <span class="stat__label">已发布文章</span>
        </div>
      </div>
      <div class="stat stat--info">
        <span class="stat__ico">📚</span>
        <div class="stat__body">
          <span class="stat__num">{{ stats ? stats.postsTotal : '–' }}</span>
          <span class="stat__label">文章总数（含草稿）</span>
        </div>
      </div>
      <div class="stat stat--accent">
        <span class="stat__ico">💬</span>
        <div class="stat__body">
          <span class="stat__num">{{ stats ? stats.commentsTotal : '–' }}</span>
          <span class="stat__label">评论总数</span>
        </div>
      </div>
      <div class="stat stat--warning">
        <span class="stat__ico">⏳</span>
        <div class="stat__body">
          <span class="stat__num" :class="{ 'stat__num--warn': stats && stats.commentsPending > 0 }">
            {{ stats ? stats.commentsPending : '–' }}
          </span>
          <span class="stat__label">待审核评论</span>
        </div>
      </div>
      <div class="stat stat--success">
        <span class="stat__ico">👁️</span>
        <div class="stat__body">
          <span class="stat__num">{{ stats ? stats.viewsTotal.toLocaleString() : '–' }}</span>
          <span class="stat__label">总浏览量</span>
        </div>
      </div>
      <div class="stat stat--rose">
        <span class="stat__ico">❤️</span>
        <div class="stat__body">
          <span class="stat__num">{{ stats ? stats.likesTotal : '–' }}</span>
          <span class="stat__label">总点赞</span>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="qa-grid">
      <RouterLink to="/admin/posts/new" class="qa">
        <span class="qa__ico">✍️</span>
        <span class="qa__text">
          <span class="qa__title">撰写文章</span>
          <span class="qa__sub">发布新内容到博客</span>
        </span>
      </RouterLink>
      <RouterLink to="/admin/comments" class="qa">
        <span class="qa__ico">💬</span>
        <span class="qa__text">
          <span class="qa__title">审核评论</span>
          <span class="qa__sub">处理读者互动与反馈</span>
        </span>
      </RouterLink>
      <RouterLink to="/admin/author" class="qa">
        <span class="qa__ico">👤</span>
        <span class="qa__text">
          <span class="qa__title">编辑关于页</span>
          <span class="qa__sub">更新作者信息与简介</span>
        </span>
      </RouterLink>
    </div>

    <div v-if="loading" class="admin-loading">加载中…</div>

    <div v-else class="admin-cols">
      <!-- 最近文章 -->
      <div class="admin-panel">
        <div class="admin-panel__head">
          <span class="admin-panel__title"><span class="admin-panel__title-ico">📄</span> 最近文章</span>
          <RouterLink to="/admin/posts" class="admin-panel__more">查看全部 →</RouterLink>
        </div>
        <div class="admin-panel__body">
          <ul class="mini-list">
            <li v-for="p in recentPosts" :key="p.id" class="mini">
              <span v-if="p.cover" class="mini__thumb" :style="coverBg(p.cover)" />
              <span v-else class="mini__thumb mini__thumb--ph" />
              <div class="mini__main">
                <RouterLink :to="`/admin/posts/${p.id}/edit`" class="mini__title">{{ p.title }}</RouterLink>
                <div class="mini__meta">
                  <span>{{ p.date || '—' }}</span>
                  <span>·</span>
                  <span>{{ statusText(p.status) }}</span>
                  <span>·</span>
                  <span>{{ p.views }} 浏览</span>
                </div>
              </div>
              <RouterLink :to="`/admin/posts/${p.id}/edit`" class="mini__op">编辑</RouterLink>
            </li>
            <li v-if="!recentPosts.length" class="admin-empty" style="padding: 28px">还没有文章</li>
          </ul>
        </div>
      </div>

      <!-- 待审核评论 -->
      <div class="admin-panel">
        <div class="admin-panel__head">
          <span class="admin-panel__title"><span class="admin-panel__title-ico">⏳</span> 待审核评论</span>
          <RouterLink to="/admin/comments" class="admin-panel__more">去审核 →</RouterLink>
        </div>
        <div class="admin-panel__body">
          <ul class="mini-list">
            <li v-for="c in pendingComments" :key="c.id" class="mini">
              <div class="mini__main">
                <span class="mini__title">{{ c.nickname }}</span>
                <div class="mini__meta">
                  <span class="tag tag--warning" style="padding: 1px 8px">待审</span>
                  <span>{{ c.createdAt }}</span>
                </div>
                <p class="mini__title" style="font-weight: 400; color: var(--color-text); margin-top: 4px; white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden">{{ c.content }}</p>
              </div>
              <RouterLink to="/admin/comments" class="mini__op">审核</RouterLink>
            </li>
            <li v-if="!pendingComments.length" class="admin-empty" style="padding: 28px">暂无待审核评论 🎉</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
