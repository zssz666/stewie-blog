<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiLogout } from '@/api/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const navOpen = ref(false)
const menuButton = ref<HTMLButtonElement | null>(null)
watch(() => route.path, () => { navOpen.value = false })
function closeMenu() { navOpen.value = false; menuButton.value?.focus() }

/** 写作页（meta.wide）：放开后台容器的 1360px 上限，把宽度还给正文编辑区 */
const isWide = computed(() => route.meta.wide === true)

// 导航项 active 判定
// — 精确匹配或以其为前缀（用于「文章管理」覆盖 edit 等子页）
// — 但排除同级子导航路径（如 /admin/posts/new 不应点亮「文章管理」）
function active(...paths: string[]) {
  return paths.some((p) => route.path === p || (p !== '/admin' && route.path.startsWith(p + '/')))
}

/** 父级导航项专用：精确匹配或以之为前缀，但排除指定的子路由 */
function activeParent(path: string, exclude: string[] = []) {
  if (exclude.some((e) => route.path === path + e)) return false
  return route.path === path || route.path.startsWith(path + '/')
}

async function logout() {
  await apiLogout() // 尽力通知后端（无状态 JWT，失败不影响前端清会话）
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="admin" @keydown.esc="closeMenu">
    <header class="admin__top">
      <button ref="menuButton" type="button" class="admin__menu" :aria-expanded="navOpen" aria-controls="admin-navigation" @click="navOpen = !navOpen">{{ navOpen ? '收起导航' : '菜单' }}</button>
      <RouterLink to="/" class="admin__brand">
        <img class="admin__logo" src="/avatar.png" alt="" width="32" height="32" />
        <span class="admin__brand-text">
          <span class="admin__brand-name">Stewie</span>
          <span class="admin__brand-sub">内容工作台</span>
        </span>
      </RouterLink>
      <div class="admin__top-actions">
        <RouterLink to="/" class="admin__ghost" target="_blank">查看站点 ↗</RouterLink>
        <button class="admin__logout" type="button" @click="logout">退出登录</button>
      </div>
    </header>

    <div class="admin__body" :class="{ 'admin__body--wide': isWide }">
      <aside id="admin-navigation" class="admin__side" :class="{ 'admin__side--open': navOpen }" aria-label="后台导航">
        <nav class="admin__group">
          <span class="admin__group-label">概览</span>
          <RouterLink to="/admin" class="admin__nav" :class="{ 'admin__nav--active': active('/admin') }">
            仪表盘
          </RouterLink>
        </nav>

        <nav class="admin__group">
          <span class="admin__group-label">内容管理</span>
          <RouterLink to="/admin/posts" class="admin__nav" :class="{ 'admin__nav--active': activeParent('/admin/posts', ['/new']) }">
            文章管理
          </RouterLink>
          <RouterLink to="/admin/posts/new" class="admin__nav" :class="{ 'admin__nav--active': active('/admin/posts/new') }">
            写新文章
          </RouterLink>
          <RouterLink to="/admin/comments" class="admin__nav" :class="{ 'admin__nav--active': active('/admin/comments') }">
            评论审核
          </RouterLink>
        </nav>

        <nav class="admin__group">
          <span class="admin__group-label">设置</span>
          <RouterLink to="/admin/author" class="admin__nav" :class="{ 'admin__nav--active': active('/admin/author') }">
            关于页 / 作者
          </RouterLink>
        </nav>
      </aside>

      <main class="admin__main">
        <RouterView :key="route.path" />
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
  max-width: 1360px;
  margin: 0 auto;
  padding: 26px 24px;
  gap: 28px;
}

/* 写作页：不限宽，用满整个视口（侧栏与顶部栏仍在，不丢导航） */
.admin__body--wide {
  max-width: none;
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

<style scoped>
.admin { font-family: var(--font-sans); --radius-lg: 10px; --radius: 8px; --color-text-tertiary: var(--color-text-secondary); --color-primary: var(--color-primary-hover); }
.admin__top { background: var(--color-surface); backdrop-filter: none; }
.admin__brand { font-family: inherit; }
.admin__logo { background: transparent; box-shadow: none; border-radius: 6px; object-fit: cover; }
.admin__body { max-width: 1600px; gap: 28px; padding: 24px 28px 48px; }
.admin__body--wide { max-width: none; }
.admin__side { width: 184px; top: 88px; }
.admin__group-label { letter-spacing: 0; font-weight: 500; font-size: 12px; padding-left: 12px; }
.admin__nav { border-radius: 6px; padding: 11px 12px; }
.admin__nav--active { background: var(--color-border); color: var(--color-heading); }
.admin__nav--active::before { display: none; }
.admin__menu { display: none; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); padding: 7px 10px; border-radius: 6px; }
.admin__main { width: 100%; }
.admin:has(.post-editor--focused) .admin__side { display: none; }
@media (max-width: 1100px) {
  .admin__top { height: 52px; padding: 0 16px; gap: 14px; }
  .admin__menu { display: block; cursor: pointer; }
  .admin__brand { margin-right: auto; }
  .admin__brand-text { flex-direction: row; gap: 7px; align-items: center; }
  .admin__brand-sub { font-size: 12px; }
  .admin__body { display: block; padding: 20px; }
  .admin__side { display: none; position: fixed; top: 52px; left: 0; bottom: 0; width: 248px; padding: 24px 16px; z-index: 30; background: var(--color-surface); border-right: 1px solid var(--color-border); box-shadow: 10px 0 32px #0000000d; overflow-y: auto; }
  .admin__side--open, .admin:has(.post-editor--focused) .admin__side--open { display: flex; flex-direction: column; gap: 24px; }
  .admin__group { flex: none; }
}
@media (max-width: 600px) {
  .admin__body { padding: 16px 16px 32px; }
  .admin__brand-sub { display: none; }
  .admin__top-actions { gap: 10px; }
  .admin__ghost, .admin__logout { font-size: 12px; }
  .admin__logout { padding: 0 8px; }
}
</style>
