<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

function logout() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="admin">
    <header class="admin__top">
      <RouterLink to="/" class="admin__brand">
        <span class="admin__logo">S</span>
        <span>Stewie · 管理后台</span>
      </RouterLink>
      <div class="admin__top-actions">
        <RouterLink to="/" class="admin__ghost" target="_blank">查看站点 ↗</RouterLink>
        <button class="admin__logout" type="button" @click="logout">退出登录</button>
      </div>
    </header>

    <div class="admin__body">
      <aside class="admin__side">
        <RouterLink to="/admin" class="admin__nav" exact-active-class="admin__nav--active">
          <span class="admin__nav-ico">📄</span> 文章管理
        </RouterLink>
        <RouterLink to="/admin/comments" class="admin__nav" active-class="admin__nav--active">
          <span class="admin__nav-ico">💬</span> 评论审核
        </RouterLink>
        <RouterLink to="/admin/posts/new" class="admin__nav admin__nav--new">
          <span class="admin__nav-ico">✍️</span> 写新文章
        </RouterLink>
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
  background: var(--color-bg-soft, #0b1020);
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
  background: color-mix(in srgb, var(--color-bg) 88%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.admin__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-nav);
  font-weight: 700;
  font-size: 16px;
  color: var(--color-heading);
}

.admin__logo {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #fff;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
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
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
}
.admin__logout:hover {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}

.admin__body {
  display: flex;
  align-items: flex-start;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  gap: 24px;
}

.admin__side {
  position: sticky;
  top: 84px;
  flex-shrink: 0;
  width: 180px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.admin__nav {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: 10px;
  transition: background 0.2s, color 0.2s;
}
.admin__nav:hover {
  background: var(--color-surface);
  color: var(--color-heading);
}
.admin__nav--active {
  background: var(--color-primary-soft, rgba(37, 99, 235, 0.12));
  color: var(--color-primary);
  font-weight: 600;
}
.admin__nav--new {
  margin-top: 8px;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
}
.admin__nav--new:hover {
  color: #fff;
  opacity: 0.92;
}
.admin__nav-ico {
  font-size: 15px;
}

.admin__main {
  flex: 1;
  min-width: 0;
}

@media (max-width: 720px) {
  .admin__body {
    flex-direction: column;
    padding: 16px;
  }
  .admin__side {
    position: static;
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
