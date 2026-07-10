<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
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
  '/': 'Stewie 的博客',
  '/articles': '全部文章',
  '/about': '关于我',
}

const currentTitle = computed(() => {
  if (route.name === 'post') return uiStore.postTitle || '文章详情'
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

function handleLogout() {
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
        <span class="navbar__logo">S</span>
        <span class="navbar__name">Stewie</span>
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
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="navbar__link"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="navbar__actions">
        <!-- 登录态：管理后台入口 + 头像 + 用户名 + 退出（仅作者本人会话可见） -->
        <template v-if="authStore.isLoggedIn">
          <RouterLink to="/admin" class="navbar__admin-link">管理后台</RouterLink>
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
          :aria-label="themeStore.isDark ? '切换到浅色模式' : '切换到深色模式'"
          @click="themeStore.toggle()"
        >
          <Transition name="icon-swap" mode="out-in">
            <IconSun v-if="themeStore.isDark" key="sun" :size="18" />
            <IconMoon v-else key="moon" :size="18" />
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
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="navbar__drawer-link"
          @click="closeMenu"
        >
          {{ link.label }}
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
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid transparent;
  transition:
    background-color 0.3s var(--ease),
    backdrop-filter 0.3s var(--ease),
    box-shadow 0.3s var(--ease),
    border-color 0.3s var(--ease);
}

/* 首页未滚动：透明 */
.navbar--home:not(.navbar--scrolled) {
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-bottom-color: transparent;
}

/* 首页滚动后：暗色 blur */
.navbar--home.navbar--scrolled {
  background: rgba(10, 15, 28, 0.75);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
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

.navbar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-heading);
  font-family: var(--font-nav);
  font-weight: 700;
  font-size: 19px;
  letter-spacing: 0.01em;
  transition: color var(--transition-fast);
}

.navbar__logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  transition: transform var(--transition-fast);
}

.navbar__brand:hover .navbar__logo {
  transform: rotate(-8deg) scale(1.05);
}

/* 导航链接组：绝对居中，保证文字始终位于导航栏正中 */
.navbar__nav {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  transition:
    opacity 0.25s var(--ease),
    transform 0.25s var(--ease);
}

/* 吸顶标题显示时隐藏中间导航 */
.navbar__nav--hidden {
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -6px);
}

/* 滚动后展示的页面标题：同样绝对居中 */
.navbar__title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 56vw;
  font-family: var(--font-nav);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--color-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 首页透明态：白色标题 */
.navbar--home:not(.navbar--scrolled) .navbar__title {
  color: rgba(255, 255, 255, 0.92);
}

/* 标题进出动画（保持水平居中） */
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

.navbar__link {
  position: relative;
  padding: 8px 16px;
  color: var(--color-text-secondary);
  font-family: var(--font-nav);
  font-weight: 500;
  font-size: 15px;
  letter-spacing: 0.04em;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}

.navbar__link::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 2px;
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.25s var(--ease);
}

.navbar__link:hover {
  color: var(--color-heading);
}

.navbar__link.router-link-exact-active {
  color: var(--color-primary);
}

.navbar__link.router-link-exact-active::after {
  transform: scaleX(1);
}

/* 首页透明状态：白色文字 */
.navbar--home:not(.navbar--scrolled) .navbar__brand,
.navbar--home:not(.navbar--scrolled) .navbar__link {
  color: rgba(255, 255, 255, 0.85);
}

.navbar--home:not(.navbar--scrolled) .navbar__link:hover,
.navbar--home:not(.navbar--scrolled) .navbar__link.router-link-exact-active {
  color: #fff;
}

.navbar--home:not(.navbar--scrolled) .navbar__link::after {
  background: var(--hero-accent);
}

.navbar--home:not(.navbar--scrolled) .navbar__logo {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: none;
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 已登录：头像 + 用户名 + 退出 */
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
  font-family: var(--font-nav);
  font-weight: 700;
  font-size: 14px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
}

.navbar__username {
  font-family: var(--font-nav);
  font-weight: 500;
  font-size: 14px;
  color: var(--color-text);
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar__logout {
  height: 34px;
  padding: 0 12px;
  font-family: var(--font-nav);
  font-weight: 500;
  font-size: 13px;
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

/* 登录态：管理后台入口 */
.navbar__admin-link {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  font-family: var(--font-nav);
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    filter var(--transition-fast);
}

.navbar__admin-link:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}

/* 首页透明态：管理后台按钮保持品牌色，仅微调 */
.navbar--home:not(.navbar--scrolled) .navbar__admin-link {
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: none;
  color: #fff;
}

/* 首页透明态下的登录态元素 */
.navbar--home:not(.navbar--scrolled) .navbar__username {
  color: rgba(255, 255, 255, 0.9);
}

.navbar--home:not(.navbar--scrolled) .navbar__logout {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.navbar--home:not(.navbar--scrolled) .navbar__logout:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .navbar__username {
    display: none;
  }
}

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

/* 首页透明状态：按钮透明 */
.navbar--home:not(.navbar--scrolled) .theme-toggle,
.navbar--home:not(.navbar--scrolled) .navbar__burger {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.navbar--home:not(.navbar--scrolled) .theme-toggle:hover,
.navbar--home:not(.navbar--scrolled) .navbar__burger:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
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
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
}

.navbar__drawer-link {
  padding: 13px 16px;
  color: var(--color-text);
  font-family: var(--font-nav);
  font-weight: 500;
  font-size: 15px;
  letter-spacing: 0.04em;
  border-radius: var(--radius-sm);
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.navbar__drawer-link:hover,
.navbar__drawer-link.router-link-exact-active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
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

@media (max-width: 768px) {
  .navbar__nav {
    display: none;
  }

  .navbar__burger {
    display: grid;
  }
}
</style>
