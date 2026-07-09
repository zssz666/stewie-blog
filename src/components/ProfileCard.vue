<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Author } from '@/types/blog'
import { getAuthor } from '@/api/author'
import { useTilt } from '@/composables/useTilt'

// 先给占位值，避免模板在接口返回前访问 author.name 报错
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

const { transform, isActive, handleMove, handleLeave } = useTilt(5)
</script>

<template>
  <div
    class="profile-card"
    :class="{ 'is-tilting': isActive }"
    :style="{ transform }"
    @mousemove="handleMove"
    @mouseleave="handleLeave"
  >
    <div class="profile-card__decor" aria-hidden="true" />
    <div class="profile-card__avatar">
      {{ author.name.charAt(0) }}
    </div>
    <h3 class="profile-card__name">{{ author.name }}</h3>
    <p class="profile-card__role">{{ author.role }}</p>
    <p class="profile-card__bio">{{ author.bio }}</p>
    <div class="profile-card__socials">
      <a
        v-for="social in author.socials"
        :key="social.label"
        :href="social.href"
        target="_blank"
        rel="noopener noreferrer"
        class="profile-card__social"
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
</template>

<style scoped>
.profile-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 28px 22px 22px;
  text-align: center;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transform-style: preserve-3d;
  transition:
    transform 0.4s var(--ease),
    box-shadow var(--transition);
}

/* 鼠标移出后平滑回正；移动中关闭过渡以保证跟手 */
.profile-card.is-tilting {
  transition: box-shadow var(--transition);
}

.profile-card:hover {
  box-shadow: var(--shadow-md);
}

.profile-card__decor {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  opacity: 0.08;
}

.profile-card__avatar {
  position: relative;
  width: 68px;
  height: 68px;
  margin: 0 auto 14px;
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: 50%;
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
  border: 3px solid var(--color-surface);
  transition: transform var(--transition);
}

.profile-card:hover .profile-card__avatar {
  transform: scale(1.05);
}

.profile-card__name {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-heading);
  letter-spacing: -0.01em;
}

.profile-card__role {
  margin-top: 4px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 0.04em;
}

.profile-card__bio {
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.profile-card__socials {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.profile-card__social {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: var(--color-text-secondary);
  background: var(--color-bg-soft);
  border-radius: 50%;
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast),
    transform var(--transition-fast);
}

.profile-card__social:hover {
  color: #fff;
  background: var(--color-primary);
  transform: translateY(-2px);
}
</style>
