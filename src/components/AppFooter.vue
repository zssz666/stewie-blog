<script setup lang="ts">
import { ref } from 'vue'
import { author } from '@/data/posts'

const year = ref(new Date().getFullYear())

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer class="footer">
    <div class="container footer__inner">
      <div class="footer__left">
        <p class="footer__brand">Stewie</p>
        <p class="footer__desc">{{ author.bio }}</p>
      </div>

      <div class="footer__right">
        <div class="footer__socials">
          <a
            v-for="social in author.socials"
            :key="social.label"
            :href="social.href"
            target="_blank"
            rel="noopener noreferrer"
            class="footer__social"
          >
            {{ social.label }}
          </a>
        </div>
        <button class="footer__top" type="button" @click="scrollTop">
          返回顶部 ↑
        </button>
      </div>
    </div>
    <div class="container footer__bottom">
      <span>© {{ year }} Stewie.blog · 用 Vue 3 + Vite 构建</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: var(--section-gap);
  padding-top: 48px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-soft);
}

.footer__inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 40px;
  flex-wrap: wrap;
  padding-bottom: 32px;
}

.footer__brand {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-heading);
}

.footer__desc {
  margin-top: 10px;
  max-width: 400px;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.footer__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
}

.footer__socials {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.footer__social {
  position: relative;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.footer__social::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 14px;
  right: 14px;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.2s var(--ease);
}

.footer__social:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.footer__social:hover::after {
  transform: scaleX(1);
}

.footer__top {
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: var(--radius-sm);
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.footer__top:hover {
  background: var(--color-primary);
  color: #fff;
}

.footer__bottom {
  padding-top: 20px;
  padding-bottom: 28px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 12px;
  text-align: center;
}

@media (max-width: 640px) {
  .footer__inner {
    flex-direction: column;
  }

  .footer__right {
    align-items: flex-start;
  }

  .footer__socials,
  .footer__top {
    justify-content: flex-start;
    align-self: flex-start;
  }
}
</style>
