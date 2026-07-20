<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiLogout } from '@/api/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// 导航项 active 判定：精确匹配或以其为前缀（用于「文章管理」覆盖 new/edit 子页）
function active(...paths: string[]) {
  return paths.some((p) => route.path === p || route.path.startsWith(p + '/'))
}

async function logout() {
  await apiLogout() // 尽力通知后端（无状态 JWT，失败不影响前端清会话）
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="admin">
    <header class="admin__top">
      <RouterLink to="/" class="admin__brand">
        <span class="admin__logo">S</span>
        <span class="admin__brand-text">
          <span class="admin__brand-name">Stewie</span>
          <span class="admin__brand-sub">管理后台</span>
        </span>
      </RouterLink>
      <div class="admin__top-actions">
        <RouterLink to="/" class="admin__ghost" target="_blank">查看站点 ↗</RouterLink>
        <button class="admin__logout" type="button" @click="logout">退出登录</button>
      </div>
    </header>

    <div class="admin__body">
      <aside class="admin__side">
        <nav class="admin__group">
          <span class="admin__group-label">概览</span>
          <RouterLink to="/admin" class="admin__nav" :class="{ 'admin__nav--active': active('/admin') }">
            <span class="admin__nav-ico">📊</span> 仪表盘
          </RouterLink>
        </nav>

        <nav class="admin__group">
          <span class="admin__group-label">内容管理</span>
          <RouterLink to="/admin/posts" class="admin__nav" :class="{ 'admin__nav--active': active('/admin/posts') }">
            <span class="admin__nav-ico">📄</span> 文章管理
          </RouterLink>
          <RouterLink to="/admin/posts/new" class="admin__nav" :class="{ 'admin__nav--active': active('/admin/posts/new') }">
            <span class="admin__nav-ico">✍️</span> 写新文章
          </RouterLink>
          <RouterLink to="/admin/comments" class="admin__nav" :class="{ 'admin__nav--active': active('/admin/comments') }">
            <span class="admin__nav-ico">💬</span> 评论审核
          </RouterLink>
        </nav>

        <nav class="admin__group">
          <span class="admin__group-label">设置</span>
          <RouterLink to="/admin/author" class="admin__nav" :class="{ 'admin__nav--active': active('/admin/author') }">
            <span class="admin__nav-ico">👤</span> 关于页 / 作者
          </RouterLink>
        </nav>
      </aside>

      <main class="admin__main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin {
  min-height: 100vh;
  background: var(--color-bg-soft, #f4f6f8);
  color: var(--color-text);
}

.admin__top {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.admin__brand {
  display: flex;
  align-items: center;
  gap: 11px;
  font-family: var(--font-nav);
}
.admin__logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  color: #fff;
  font-weight: 800;
  font-size: 16px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  box-shadow: var(--shadow-primary);
}
.admin__brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.admin__brand-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-heading);
}
.admin__brand-sub {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  letter-spacing: 0.04em;
}

.admin__top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.admin__ghost {
  font-size: 14px;
  color: var(--color-text-secondary);
}
.admin__ghost:hover {
  color: var(--color-primary);
}
.admin__logout {
  height: 34px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.admin__logout:hover {
  color: var(--color-error);
  border-color: color-mix(in srgb, var(--color-error) 40%, transparent);
}

.admin__body {
  display: flex;
  align-items: flex-start;
  max-width: 1240px;
  margin: 0 auto;
  padding: 26px 24px;
  gap: 28px;
}

.admin__side {
  position: sticky;
  top: 86px;
  flex-shrink: 0;
  width: 210px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.admin__group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.admin__group-label {
  padding: 0 14px;
  margin-bottom: 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}
.admin__nav {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: 10px;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.admin__nav:hover {
  background: var(--color-surface);
  color: var(--color-heading);
}
.admin__nav--active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}
.admin__nav--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 0 3px 3px 0;
  background: var(--color-primary);
}
.admin__nav-ico {
  font-size: 15px;
  line-height: 1;
}

.admin__main {
  flex: 1;
  min-width: 0;
}

@media (max-width: 720px) {
  .admin__body {
    flex-direction: column;
    padding: 16px;
    gap: 18px;
  }
  .admin__side {
    position: static;
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px 18px;
  }
  .admin__group {
    flex: 1;
    min-width: 140px;
  }
}
</style>
