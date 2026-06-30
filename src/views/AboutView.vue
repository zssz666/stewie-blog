<script setup lang="ts">
import { ref } from 'vue'
import { author } from '@/data/posts'
import { useInView } from '@/composables/useInView'

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
    year: '2023',
    title: '资深前端工程师',
    desc: '主导几个大型 Web 应用的前端架构，推动团队往 Composition API 和 TypeScript 迁移。',
  },
  {
    year: '2020',
    title: '前端开发工程师',
    desc: '从 Vue 2 开始做电商和内容类产品，积累了组件库和性能优化的经验。',
  },
  {
    year: '2018',
    title: '入行',
    desc: '华中科技大学计算机系毕业，开始正式写前端。',
  },
]

const timelineRef = ref<HTMLElement | null>(null)
const { isInView } = useInView(timelineRef, 0.15)
</script>

<template>
  <div class="about">
    <section class="container about__hero">
      <div class="about__avatar-wrap">
        <div class="about__avatar-ring" />
        <div class="about__avatar">
          {{ author.name.charAt(0) }}
        </div>
      </div>
      <div class="about__intro">
        <span class="tag">{{ author.role }}</span>
        <h1 class="about__name">你好，我是 {{ author.name }}</h1>
        <p class="about__bio">{{ author.bio }}</p>
        <div class="about__socials">
          <a
            v-for="social in author.socials"
            :key="social.label"
            :href="social.href"
            target="_blank"
            rel="noopener noreferrer"
            class="about__social"
          >
            {{ social.label }}
          </a>
        </div>
      </div>
    </section>

    <section class="container section about__skills">
      <h2 class="about__heading">技术栈</h2>
      <div class="about__skill-grid">
        <span
          v-for="skill in author.skills"
          :key="skill"
          class="about__skill"
        >
          {{ skill }}
        </span>
      </div>
    </section>

    <section class="container section-lg about__timeline-wrap">
      <h2 class="about__heading">经历</h2>
      <ol
        ref="timelineRef"
        class="about__timeline"
        :class="{ 'is-visible': isInView }"
      >
        <li
          v-for="(item, index) in timeline"
          :key="item.year"
          class="about__timeline-item"
          :style="{ '--delay': `${index * 120}ms` }"
        >
          <div class="about__timeline-dot" />
          <span class="about__timeline-year">{{ item.year }}</span>
          <h3 class="about__timeline-title">{{ item.title }}</h3>
          <p class="about__timeline-desc">{{ item.desc }}</p>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.about__hero {
  display: flex;
  align-items: center;
  gap: 40px;
  padding-top: calc(var(--header-height) + 48px);
  padding-bottom: 48px;
  flex-wrap: wrap;
}

.about__avatar-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.about__avatar-ring {
  position: absolute;
  inset: -8px;
  border: 2px dashed var(--color-primary);
  border-radius: 50%;
  opacity: 0.5;
  transition: opacity 0.3s var(--ease);
}

.about__avatar-wrap:hover .about__avatar-ring {
  animation: ring-spin 8s linear infinite;
  opacity: 0.8;
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
  background: linear-gradient(135deg, var(--color-primary), var(--hero-dark-3));
  color: #fff;
  font-size: 3rem;
  font-weight: 800;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
  animation: breathe 2s ease-in-out infinite;
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
  margin: 14px 0 12px;
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 700;
}

.about__bio {
  color: var(--color-text-secondary);
  font-size: 1rem;
  line-height: 1.8;
  max-width: 520px;
}

.about__socials {
  display: flex;
  gap: 8px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.about__social {
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

.about__social:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.about__heading {
  font-size: clamp(1.3rem, 3vw, 1.6rem);
  font-weight: 700;
  margin-bottom: 24px;
}

.about__skill-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.about__skill {
  padding: 8px 16px;
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
    background-position 0.2s var(--ease),
    color 0.2s var(--ease),
    border-color 0.2s var(--ease);
}

.about__skill:hover {
  background-position: left;
  color: #fff;
  border-color: var(--color-primary);
}

.about__timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-left: 24px;
}

.about__timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 5px;
  bottom: 5px;
  width: 2px;
  background: var(--color-border);
}

.about__timeline-item {
  position: relative;
  opacity: 0;
  transform: translateX(-30px);
  transition:
    opacity 0.4s var(--ease),
    transform 0.4s var(--ease);
}

.about__timeline.is-visible .about__timeline-item {
  opacity: 1;
  transform: translateX(0);
  transition-delay: var(--delay, 0ms);
}

.about__timeline-dot {
  position: absolute;
  left: -24px;
  top: 5px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-bg);
}

.about__timeline-dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  animation: pulse 2.5s ease-out infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  100% { box-shadow: 0 0 0 10px transparent; }
}

.about__timeline-year {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
}

.about__timeline-title {
  margin: 4px 0 6px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-heading);
}

.about__timeline-desc {
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .about__hero {
    flex-direction: column;
    text-align: center;
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
}

@media (prefers-reduced-motion: reduce) {
  .about__avatar {
    animation: none;
  }

  .about__avatar-wrap:hover .about__avatar-ring {
    animation: none;
  }

  .about__timeline-dot::after {
    animation: none;
  }

  .about__timeline-item {
    opacity: 1;
    transform: none;
  }
}
</style>
