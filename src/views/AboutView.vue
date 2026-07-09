<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Author } from '@/types/blog'
import { getAuthor } from '@/api/author'
import { useSeo } from '@/composables/useSeo'

useSeo({
  title: '关于我',
  description: 'Stewie，前端工程师。本科毕业做全栈，记录 Vue 3、TypeScript、Vite 生态的实战经验与踩坑心得。',
  path: '/about',
})

// 占位值，接口返回前模板不会报错
const author = ref<Author>({ name: 'Stewie', role: '', bio: '', socials: [], skills: [] })

onMounted(async () => {
  try {
    author.value = await getAuthor()
  } catch (e) {
    console.error('获取作者信息失败:', e)
  }
})

interface TimelineItem {
  year: string
  title: string
  desc: string
}

const timeline: TimelineItem[] = [
  {
    year: '2026',
    title: '持续写博客',
    desc: '维护个人博客，记录 Vue 生态开发中遇到的实际问题和解法。',
  },
  {
    year: '2025',
    title: '前端开发工程师',
    desc: '从 Vue 2 开始做管理后台，积累了组件库和性能优化的经验。',
  },
  {
    year: '2023',
    title: '入行',
    desc: '在学校学习大前端，正式入行。',
  },
]

const socialIcons: Record<string, string> = {
  GitHub: 'M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.09.682-.217.682-.482 0-.237-.009-.866-.014-1.699-2.782.602-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.071 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.349-1.086.635-1.337-2.22-.253-4.555-1.111-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12 22 6.477 17.523 2 12 2z',
  Twitter: 'M22 5.8a8.5 8.5 0 0 1-2.36.646 4.131 4.131 0 0 0 1.805-2.27 8.246 8.246 0 0 1-2.61.998A4.11 4.11 0 0 0 15.85 3a4.11 4.11 0 0 0-4.107 4.11c0 .323.036.637.106.937A11.674 11.674 0 0 1 3.39 4.283a4.11 4.11 0 0 0 1.273 5.488 4.087 4.087 0 0 1-1.862-.515v.052a4.11 4.11 0 0 0 3.294 4.029 4.124 4.124 0 0 1-1.855.07 4.113 4.113 0 0 0 3.838 2.855A8.25 8.25 0 0 1 2 18.407a11.616 11.616 0 0 0 6.29 1.843c7.547 0 11.674-6.252 11.674-11.674 0-.178-.004-.355-.012-.531A8.343 8.343 0 0 0 22 5.8z',
  Email: 'M2 4h20v16H2V4zm10 9L4 7v10h16V7l-8 6z',
}
</script>

<template>
  <div class="about">
    <!-- ── Hero 区 ── -->
    <section class="container about__hero" v-reveal>
      <div class="about__avatar-wrap">
        <div class="about__avatar-ring" />
        <div class="about__avatar">
          {{ author.name.charAt(0) }}
        </div>
      </div>
      <div class="about__intro">
        <h1 class="about__name">你好，我是 {{ author.name }}</h1>
        <p class="about__role">{{ author.role }}</p>
        <p class="about__bio">{{ author.bio }}</p>
        <div class="about__socials">
          <a
            v-for="social in author.socials"
            :key="social.label"
            :href="social.href"
            target="_blank"
            rel="noopener noreferrer"
            class="about__social"
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
            <span>{{ social.label }}</span>
          </a>
        </div>
      </div>
    </section>

    <!-- ── 技术栈 ── -->
    <section class="container section about__skills">
      <div class="about__section-head" v-reveal>
        <h2 class="about__heading">技术栈</h2>
      </div>
      <div class="about__skill-grid">
        <span
          v-for="(skill, index) in author.skills"
          :key="skill"
          class="about__skill"
          v-reveal.zoom="index * 60"
        >
          {{ skill }}
        </span>
      </div>
    </section>

    <!-- ── 经历时间线 ── -->
    <section class="container section-lg about__timeline-wrap">
      <div class="about__section-head" v-reveal>
        <h2 class="about__heading">经历</h2>
      </div>
      <ol class="about__timeline">
        <li
          v-for="(item, index) in timeline"
          :key="item.year"
          class="about__timeline-item"
          v-reveal.left="index * 120"
        >
          <div class="about__timeline-dot" />
          <div class="about__timeline-content">
            <span class="about__timeline-year">{{ item.year }}</span>
            <h3 class="about__timeline-title">{{ item.title }}</h3>
            <p class="about__timeline-desc">{{ item.desc }}</p>
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.about__hero {
  display: flex;
  align-items: center;
  gap: 48px;
  padding-top: calc(var(--header-height) + 64px);
  padding-bottom: 56px;
  flex-wrap: wrap;
}

.about__avatar-wrap {
  position: relative;
  width: 128px;
  height: 128px;
  flex-shrink: 0;
}

.about__avatar-ring {
  position: absolute;
  inset: -10px;
  border: 2px dashed var(--color-primary);
  border-radius: 50%;
  opacity: 0.4;
  transition: opacity 0.3s var(--ease);
}

.about__avatar-wrap:hover .about__avatar-ring {
  animation: ring-spin 8s linear infinite;
  opacity: 0.7;
}

@keyframes ring-spin {
  to { transform: rotate(360deg); }
}

.about__avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: #fff;
  font-size: 3.2rem;
  font-weight: 800;
  box-shadow: 0 8px 28px rgba(37, 99, 235, 0.35);
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.about__intro {
  flex: 1;
  min-width: 280px;
}

.about__name {
  margin: 0 0 6px;
  font-size: clamp(1.8rem, 4.5vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.about__role {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 0.02em;
}

.about__bio {
  color: var(--color-text-secondary);
  font-size: 1.02rem;
  line-height: 1.85;
  max-width: 540px;
}

.about__socials {
  display: flex;
  gap: 10px;
  margin-top: 26px;
  flex-wrap: wrap;
}

.about__social {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background-color 0.3s var(--ease),
    transform 0.3s var(--ease-spring),
    box-shadow 0.3s var(--ease);
}

/* 社交链接交错入场 */
.about__social {
  animation: social-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}
.about__socials .about__social:nth-child(1) { animation-delay: 0.15s; }
.about__socials .about__social:nth-child(2) { animation-delay: 0.25s; }
.about__socials .about__social:nth-child(3) { animation-delay: 0.35s; }

@keyframes social-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.about__social:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  transform: translateY(-3px) scale(1.04);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.12);
}

/* ── 章节标题 ── */
.about__section-head {
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.about__heading {
  font-size: clamp(1.4rem, 3.2vw, 1.8rem);
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* ── 技能 ── */
.about__skill-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.about__skill {
  position: relative;
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-heading);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-image: linear-gradient(
    to right,
    var(--color-primary) 50%,
    var(--color-surface) 50%
  );
  background-size: 200% 100%;
  background-position: right;
  transition:
    background-position 0.3s var(--ease),
    color 0.3s var(--ease),
    border-color 0.3s var(--ease),
    transform 0.3s var(--ease-spring),
    box-shadow 0.3s var(--ease);
}

.about__skill::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  background: radial-gradient(circle at center, rgba(37, 99, 235, 0.15), transparent 70%);
  opacity: 0;
  z-index: -1;
  transition: opacity 0.4s var(--ease);
  filter: blur(8px);
}

.about__skill:hover::before {
  opacity: 1;
}

.about__skill:hover {
  background-position: left;
  color: #fff;
  border-color: var(--color-primary);
  transform: translateY(-3px);
  box-shadow:
    var(--shadow-primary),
    0 8px 24px rgba(37, 99, 235, 0.15);
}

/* ── 时间线 ── */
.about__timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 36px;
  padding-left: 32px;
}

.about__timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--color-primary), var(--color-border) 65%, transparent);
  transform-origin: top;
  animation: line-draw 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: 0.3s;
}

@keyframes line-draw {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}

.about__timeline-item {
  position: relative;
}

.about__timeline-dot {
  position: absolute;
  left: -32px;
  top: 6px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 3px solid var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-bg);
  /* 弹跳入场 */
  animation: dot-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

/* 每个时间线项依次弹入 */
.about__timeline-item:nth-child(1) .about__timeline-dot { animation-delay: 0.4s; }
.about__timeline-item:nth-child(2) .about__timeline-dot { animation-delay: 0.6s; }
.about__timeline-item:nth-child(3) .about__timeline-dot { animation-delay: 0.8s; }

@keyframes dot-pop {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.about__timeline-dot::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: var(--color-primary);
  opacity: 0;
  animation: pulse 2.5s ease-out infinite;
}

@keyframes pulse {
  0% { opacity: 0.4; box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
  100% { opacity: 0; box-shadow: 0 0 0 12px transparent; }
}

.about__timeline-content {
  padding: 4px 0;
}

.about__timeline-year {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.04em;
  padding: 2px 10px;
  background: var(--color-primary-soft);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
}

.about__timeline-title {
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-heading);
  letter-spacing: -0.01em;
}

.about__timeline-desc {
  color: var(--color-text-secondary);
  font-size: 14.5px;
  line-height: 1.75;
  max-width: 540px;
}

@media (max-width: 640px) {
  .about__hero {
    flex-direction: column;
    text-align: center;
    gap: 24px;
  }

  .about__avatar-wrap {
    margin: 0 auto;
  }

  .about__bio {
    margin: 0 auto;
  }

  .about__socials {
    justify-content: center;
  }

  .about__intro {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .about__avatar {
    animation: none;
  }

  .about__avatar-wrap:hover .about__avatar-ring {
    animation: none;
  }

  .about__timeline-dot::after,
  .about__timeline-dot {
    animation: none;
  }

  .about__timeline::before {
    animation: none;
    transform: scaleY(1);
  }

  .about__skill:hover {
    transform: none;
  }

  .about__social {
    animation: none;
  }
  .about__social:hover {
    transform: none;
  }
}
</style>
