<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { apiLogout } from '@/api/auth'
import IconSun from './icons/IconSun.vue'
import IconMoon from './icons/IconMoon.vue'
import IconMenu from './icons/IconMenu.vue'
import IconClose from './icons/IconClose.vue'

const themeStore = useThemeStore()
const uiStore = useUiStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const scrolled = ref(false)
const menuOpen = ref(false)
const showTitle = ref(false) // 滚动后由导航链接切换为展示页面标题
let lastScrollY = 0

const isHome = computed(() => route.path === '/')

// 各页面滚动后展示的标题（文章详情页用 store 中的文章标题）
const pageTitleMap: Record<string, string> = {
  '/': "Stewie's Lab",
  '/articles': '实验登记簿',
  '/about': '关于 Stewie',
  '/search': '搜索实验记录',
}

const currentTitle = computed(() => {
  if (route.name === 'post') return uiStore.postTitle || '实验记录'
  return pageTitleMap[route.path] ?? ''
})

const navClass = computed(() => ({
  'navbar--home': isHome.value,
  'navbar--scrolled': scrolled.value,
}))

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/articles', label: '文章' },
  { to: '/about', label: '关于' },
]

function handleScroll() {
  const currentY = window.scrollY
  scrolled.value = currentY > 50
  // 滚动后由三个导航链接切换为展示页面标题（文章页显示文章标题，其它页显示对应网页标题）
  showTitle.value = scrolled.value && currentTitle.value !== ''
}

function closeMenu() {
  menuOpen.value = false
}

const displayName = computed(() => authStore.user?.nickname || authStore.user?.username || '')
const avatarText = computed(() => (displayName.value || 'U').charAt(0).toUpperCase())

/* ── 搜索入口：跳转到 /search?q= ── */
const searchQuery = ref('')
function goSearch() {
  const q = searchQuery.value.trim()
  router.push(q ? { name: 'search', query: { q } } : { name: 'search' })
}

async function handleLogout() {
  await apiLogout() // 尽力通知后端；无状态 JWT 失败也不影响前端清会话
  authStore.logout()
  closeMenu()
  if (route.name === 'login') return
  router.push('/')
}

// 路由切换时重置（scrollBehavior 已回到顶部），避免残留「标题态」
watch(
  () => route.fullPath,
  () => {
    scrolled.value = false
    showTitle.value = false
    lastScrollY = 0
  },
)

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header class="navbar" :class="navClass">
    <div class="container navbar__inner">
      <RouterLink to="/" class="navbar__brand" @click="closeMenu">
        <img src="/avatar.png" class="navbar__logo" alt="Stewie's Lab" width="32" height="32">
        <span class="navbar__name">Stewie<em class="navbar__name-sub">.LAB</em></span>
      </RouterLink>

      <Transition name="nav-title">
        <span
          v-if="showTitle"
          :key="currentTitle"
          class="navbar__title"
        >
          {{ currentTitle }}
        </span>
      </Transition>

      <nav class="navbar__nav" :class="{ 'navbar__nav--hidden': showTitle }">
        <RouterLink
          v-for="(link, i) in navLinks"
          :key="link.to"
          :to="link.to"
          class="navbar__link"
        >
          <span class="navbar__ch">CH{{ i + 1 }}</span>
          <span class="navbar__link-text">{{ link.label }}</span>
        </RouterLink>
      </nav>

      <div class="navbar__actions">
        <!-- 搜索入口：始终可见（公开搜索） -->
        <form class="navbar__search" role="search" @submit.prevent="goSearch">
          <button type="submit" class="navbar__search-btn" aria-label="搜索实验记录">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <input
            v-model="searchQuery"
            class="navbar__search-input"
            type="search"
            placeholder="搜索实验记录…"
            aria-label="搜索实验记录"
            autocomplete="off"
          />
        </form>

        <!-- 登录态：管理后台入口 + 头像 + 用户名 + 退出（仅作者本人会话可见） -->
        <template v-if="authStore.isLoggedIn">
          <RouterLink to="/admin" class="navbar__admin-link">控制台</RouterLink>
          <div class="navbar__user">
            <span class="navbar__avatar">{{ avatarText }}</span>
            <span class="navbar__username">{{ displayName }}</span>
          </div>
          <button class="navbar__logout" type="button" @click="handleLogout">退出</button>
        </template>
        <!-- 未登录：登录入口已隐藏，公开读者不可见；作者通过 /login 或后续的 /admin 直达地址进入 -->

        <button
          class="theme-toggle"
          type="button"
          :aria-label="themeStore.isDark ? '切换到底稿模式（浅色）' : '切换到晒图模式（深色）'"
          :title="themeStore.isDark ? '晒图中 · 点击回到底稿' : '底稿 · 点击晒成蓝图'"
          @click="themeStore.toggle()"
        >
          <Transition name="icon-swap" mode="out-in">
            <IconSun v-if="themeStore.isDark" key="sun" :size="17" />
            <IconMoon v-else key="moon" :size="17" />
          </Transition>
        </button>

        <button
          class="navbar__burger"
          type="button"
          aria-label="切换菜单"
          @click="menuOpen = !menuOpen"
        >
          <IconMenu v-if="!menuOpen" :size="22" />
          <IconClose v-else :size="22" />
        </button>
      </div>
    </div>

    <Transition name="drawer">
      <nav v-if="menuOpen" class="navbar__drawer">
        <RouterLink
          v-for="(link, i) in navLinks"
          :key="link.to"
          :to="link.to"
          class="navbar__drawer-link"
          @click="closeMenu"
        >
          <span class="navbar__ch">CH{{ i + 1 }}</span>
          <span class="navbar__link-text">{{ link.label }}</span>
        </RouterLink>
      </nav>
    </Transition>

    <Transition name="fade">
      <div v-if="menuOpen" class="navbar__backdrop" @click="closeMenu" />
    </Transition>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: var(--header-height);
  background: color-mix(in srgb, var(--color-bg) 85%, transparent);
  backdrop-filter: var(--nav-blur);
  -webkit-backdrop-filter: var(--nav-blur);
  border-bottom: 1px solid transparent;
  transition:
    background-color 0.3s var(--ease),
    backdrop-filter 0.3s var(--ease),
    box-shadow 0.3s var(--ease),
    border-color 0.3s var(--ease);
}

/* 首页未滚动：透明（纸面/晒图面直接透出） */
.navbar--home:not(.navbar--scrolled) {
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-bottom-color: transparent;
}

/* 首页滚动后：毛玻璃 */
.navbar--home.navbar--scrolled {
  background: color-mix(in srgb, var(--color-bg) 82%, transparent);
  backdrop-filter: var(--nav-blur);
  -webkit-backdrop-filter: var(--nav-blur);
  border-bottom-color: var(--color-border);
  box-shadow: var(--shadow-sm);
}

/* 非首页滚动后 */
.navbar--scrolled:not(.navbar--home) {
  box-shadow: var(--shadow-sm);
  border-bottom-color: var(--color-border);
}

.navbar__inner {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* ── 品牌：制图图框 S + 等宽铭牌 ── */
.navbar__brand {
  display: flex;
  align-items: center;
  gap: 11px;
  color: var(--color-heading);
  transition: color var(--transition-fast);
}

.navbar__logo {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  line-height: 1;
  color: var(--color-heading);
  background: var(--color-surface);
  border: 1.5px solid var(--color-heading);
  border-radius: var(--radius-sm);
  /* 双线图框：外实线 + 内虚线，制图图纸味 */
  outline: 1px dashed color-mix(in srgb, var(--color-heading) 35%, transparent);
  outline-offset: -5px;
  transition:
    transform var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.navbar__brand:hover .navbar__logo {
  transform: rotate(-4deg);
  color: var(--color-primary);
  border-color: var(--color-primary);
  outline-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
}

.navbar__name {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 15.5px;
  letter-spacing: 0.02em;
  color: var(--color-heading);
}

.navbar__name-sub {
  font-style: normal;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--color-primary);
  margin-left: 2px;
  vertical-align: super;
}

/* ── 通道选择器（导航）：CH 编号 + LED 点 ── */
.navbar__nav {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  transition:
    opacity 0.25s var(--ease),
    transform 0.25s var(--ease);
}

.navbar__nav--hidden {
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -6px);
}

.navbar__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 13.5px;
  letter-spacing: 0.04em;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

/* 通道编号小标 */
.navbar__ch {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--color-text-tertiary);
  transition: color var(--transition-fast);
}

/* LED 指示灯：active 通道点亮 */
.navbar__link::after {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-border-strong);
  transition:
    background-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.navbar__link:hover {
  color: var(--color-heading);
}

.navbar__link:hover .navbar__ch {
  color: var(--color-text-secondary);
}

.navbar__link.router-link-exact-active {
  color: var(--color-primary);
  border-color: var(--color-border);
  background: var(--color-surface);
}

.navbar__link.router-link-exact-active .navbar__ch {
  color: var(--color-primary);
}

.navbar__link.router-link-exact-active::after {
  background: var(--color-primary);
  box-shadow: 0 0 8px var(--color-primary);
}

/* ── 吸顶标题 ── */
.navbar__title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 56vw;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--color-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-title-enter-active,
.nav-title-leave-active {
  transition:
    opacity 0.3s var(--ease),
    transform 0.3s var(--ease);
}

.nav-title-enter-from,
.nav-title-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

/* ── 右侧操作区 ── */
.navbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 搜索框：仪器输入位 */
.navbar__search {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px 4px 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: border-color 0.2s var(--ease), box-shadow 0.2s var(--ease);
}

.navbar__search:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.navbar__search-btn {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  flex-shrink: 0;
}

.navbar__search-btn:hover {
  color: var(--color-primary);
}

.navbar__search-input {
  width: 128px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 12.5px;
  padding: 4px 6px 4px 2px;
  transition: width 0.25s var(--ease);
}

.navbar__search-input::placeholder {
  color: var(--color-text-tertiary);
}

.navbar__search-input:focus {
  width: 168px;
}

/* 首页透明态（未滚动）：隐藏搜索框，待导航栏滚动变化后再出现 */
.navbar--home:not(.navbar--scrolled) .navbar__search {
  display: none;
}

/* ── 已登录：头像 + 用户名 + 退出 ── */
.navbar__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
}

.navbar__avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  color: #fff;
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 13px;
  background: var(--color-primary);
}

.navbar__username {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 13px;
  color: var(--color-text);
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar__logout {
  height: 34px;
  padding: 0 12px;
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 12.5px;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.navbar__logout:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

/* 登录态：管理后台入口（主开关按钮） */
.navbar__admin-link {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: #fff;
  background: var(--color-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-primary);
  transition:
    transform var(--transition-fast),
    background-color var(--transition-fast);
}

.navbar__admin-link:hover {
  transform: translateY(-1px);
  background: var(--color-primary-hover);
}

/* ── 主题切换 / 汉堡：仪器按键 ── */
.theme-toggle,
.navbar__burger {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background-color 0.5s var(--ease);
}

.theme-toggle:hover,
.navbar__burger:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.icon-swap-enter-active,
.icon-swap-leave-active {
  transition:
    opacity 0.15s var(--ease),
    transform 0.3s var(--ease);
}

.icon-swap-enter-from {
  opacity: 0;
  transform: rotate(-180deg);
}

.icon-swap-leave-to {
  opacity: 0;
  transform: rotate(180deg);
}

.navbar__burger {
  display: none;
}

/* ── 移动端抽屉 ── */
.navbar__drawer {
  position: absolute;
  top: calc(var(--header-height) - 8px);
  right: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
}

.navbar__drawer-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.04em;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.navbar__drawer-link .navbar__ch {
  font-size: 10.5px;
}

.navbar__drawer-link::after {
  content: '';
  width: 5px;
  height: 5px;
  margin-left: auto;
  border-radius: 50%;
  background: var(--color-border-strong);
}

.navbar__drawer-link:hover,
.navbar__drawer-link.router-link-exact-active {
  background: var(--color-primary-softer);
  color: var(--color-primary);
  border-color: var(--color-border);
}

.navbar__drawer-link.router-link-exact-active::after {
  background: var(--color-primary);
  box-shadow: 0 0 8px var(--color-primary);
}

.navbar__backdrop {
  position: fixed;
  inset: var(--header-height) 0 0 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: -1;
}

.drawer-enter-active,
.drawer-leave-active {
  transition:
    opacity 0.2s var(--ease),
    transform 0.2s var(--ease);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s var(--ease);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.navbar__link:focus-visible,
.theme-toggle:focus-visible,
.navbar__burger:focus-visible,
.navbar__logout:focus-visible,
.navbar__admin-link:focus-visible,
.navbar__search-btn:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}

@media (max-width: 768px) {
  .navbar__username {
    display: none;
  }

  /* 移动端：搜索框只显示图标按钮，点击进入 /search 页输入 */
  .navbar__search {
    padding: 6px;
    border-radius: var(--radius-sm);
  }
  .navbar__search-input {
    display: none;
  }
}

@media (max-width: 768px) {
  .navbar__nav {
    display: none;
  }

  .navbar__burger {
    display: grid;
  }
}

@media (prefers-reduced-motion: reduce) {
  .navbar__brand:hover .navbar__logo,
  .navbar__admin-link:hover {
    transform: none;
  }

  .icon-swap-enter-from,
  .icon-swap-leave-to,
  .nav-title-enter-from,
  .nav-title-leave-to {
    transform: none;
  }

  .icon-swap-enter-active,
  .icon-swap-leave-active,
  .nav-title-enter-active,
  .nav-title-leave-active {
    transition: opacity 0.15s var(--ease);
  }
}
</style>
