<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Author } from '@/types/blog'
import { getAuthor } from '@/api/author'

const year = ref(new Date().getFullYear())

// 占位值，接口返回前模板不会报错
const author = ref<Author>({ name: 'Stewie', role: '', bio: '', socials: [], skills: [] })

onMounted(async () => {
  try {
    author.value = await getAuthor()
  } catch (e) {
    console.error('获取作者信息失败:', e)
  }
})

const socialIcons: Record<string, string> = {
  GitHub: 'M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.09.682-.217.682-.482 0-.237-.009-.866-.014-1.699-2.782.602-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.071 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.349-1.086.635-1.337-2.22-.253-4.555-1.111-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12 22 6.477 17.523 2 12 2z',
  Twitter: 'M22 5.8a8.5 8.5 0 0 1-2.36.646 4.131 4.131 0 0 0 1.805-2.27 8.246 8.246 0 0 1-2.61.998A4.11 4.11 0 0 0 15.85 3a4.11 4.11 0 0 0-4.107 4.11c0 .323.036.637.106.937A11.674 11.674 0 0 1 3.39 4.283a4.11 4.11 0 0 0 1.273 5.488 4.087 4.087 0 0 1-1.862-.515v.052a4.11 4.11 0 0 0 3.294 4.029 4.124 4.124 0 0 1-1.855.07 4.113 4.113 0 0 0 3.838 2.855A8.25 8.25 0 0 1 2 18.407a11.616 11.616 0 0 0 6.29 1.843c7.547 0 11.674-6.252 11.674-11.674 0-.178-.004-.355-.012-.531A8.343 8.343 0 0 0 22 5.8z',
  Email: 'M2 4h20v16H2V4zm10 9L4 7v10h16V7l-8 6z',
}
</script>

<template>
  <footer class="footer">
    <!-- 顶部海浪过渡 -->
    <section class="footer-waves waves-area" aria-hidden="true">
      <svg class="waves-svg" preserveAspectRatio="none" shape-rendering="auto" viewBox="0 24 150 28" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="gentle-wave-footer" d="M -160 44 c 30 0 58 -18 88 -18 s 58 18 88 18 s 58 -18 88 -18 s 58 18 88 18 v 44 h -352 Z" />
        </defs>
        <g class="parallax">
          <g transform="translate(48, 0)">
            <use href="#gentle-wave-footer" opacity="0.5">
              <animateTransform attributeName="transform" attributeType="XML" type="translate" from="-90 0" to="85 0" dur="7s" begin="-2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.55 0.5 0.45 0.5" />
            </use>
          </g>
          <g transform="translate(48, 3)">
            <use href="#gentle-wave-footer" opacity="0.6">
              <animateTransform attributeName="transform" attributeType="XML" type="translate" from="-90 0" to="85 0" dur="10s" begin="-3s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.55 0.5 0.45 0.5" />
            </use>
          </g>
          <g transform="translate(48, 5)">
            <use href="#gentle-wave-footer" opacity="0.7">
              <animateTransform attributeName="transform" attributeType="XML" type="translate" from="-90 0" to="85 0" dur="13s" begin="-4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.55 0.5 0.45 0.5" />
            </use>
          </g>
          <g transform="translate(48, 7)">
            <use href="#gentle-wave-footer">
              <animateTransform attributeName="transform" attributeType="XML" type="translate" from="-90 0" to="85 0" dur="20s" begin="-5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.55 0.5 0.45 0.5" />
            </use>
          </g>
        </g>
      </svg>
    </section>

    <div class="container footer__inner">
      <div class="footer__left">
        <div class="footer__brand-row">
          <span class="footer__logo">S</span>
          <p class="footer__brand">Stewie</p>
        </div>
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
            :aria-label="social.label"
            :title="social.label"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path :d="socialIcons[social.label] || ''" />
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div class="container footer__bottom">
      <span>© {{ year }} Stewie</span>
      <a
        class="footer__beian"
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="noopener noreferrer"
      >渝ICP备2026015418号</a>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: var(--section-gap);
  padding-top: 0;
  background: var(--color-bg-soft);
  position: relative;
}

/* ── 顶部海浪（复刻参考站 gentle-wave） ── */
.footer-waves {
  position: relative;
  height: 90px;
  overflow: hidden;
  line-height: 0;
}

/* 让波浪铺满容器高度（覆盖全局 .waves-svg 的 60px 限制） */
.footer-waves .waves-svg {
  height: 100%;
}

/* 填充色用页脚底色，营造"页脚色吞噬正文"的优雅过渡（与 hero 一致） */
.footer-waves .parallax use {
  fill: var(--color-bg-soft);
}

.footer::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 2px;
  background: linear-gradient(to right, transparent, var(--color-primary), transparent);
  border-radius: 1px;
}

.footer__inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 40px;
  flex-wrap: wrap;
  padding-top: 48px;
  padding-bottom: 36px;
}

.footer__brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.footer__logo {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.footer__brand {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-heading);
  letter-spacing: -0.02em;
}

.footer__desc {
  max-width: 420px;
  color: var(--color-text-secondary);
  font-size: 13.5px;
  line-height: 1.75;
}

.footer__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 18px;
}

.footer__socials {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.footer__social {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background-color var(--transition-fast),
    transform var(--transition-fast);
}

.footer__social:hover {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary);
}

.footer__top {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: var(--radius-sm);
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast);
}

.footer__top:hover {
  background: var(--color-primary);
  color: #fff;
  transform: translateY(-1px);
}

.footer__bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 22px;
  padding-bottom: 30px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 12.5px;
  text-align: center;
  letter-spacing: 0.02em;
}

.footer__beian {
  color: var(--color-text-secondary);
  font-size: 12.5px;
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer__beian:hover {
  color: var(--color-primary);
}

@media (max-width: 640px) {
  .footer-waves {
    display: none;
  }

  .footer__inner {
    flex-direction: column;
  }

  .footer__right {
    align-items: flex-start;
  }

  .footer__socials,
  .footer__top {    justify-content: flex-start;
    align-self: flex-start;
  }
}
</style>
