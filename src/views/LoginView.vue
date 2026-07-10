<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

onMounted(() => {
  document.title = '登录 · Stewie 的博客'
})

async function onSubmit() {
  error.value = ''
  if (!username.value.trim() || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  try {
    await authStore.login(username.value.trim(), password.value)
    const redirect = (route.query.redirect as string) || '/admin'
    router.replace(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <header class="login-card__head">
        <span class="login-card__logo">S</span>
        <h1 class="login-card__title">欢迎回来</h1>
        <p class="login-card__sub">登录以管理你的博客内容</p>
      </header>

      <form class="login-form" @submit.prevent="onSubmit">
        <label class="login-field">
          <span class="login-field__label">用户名</span>
          <input
            v-model="username"
            class="login-input"
            type="text"
            autocomplete="username"
            placeholder="请输入用户名"
          />
        </label>

        <label class="login-field">
          <span class="login-field__label">密码</span>
          <input
            v-model="password"
            class="login-input"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
          />
        </label>

        <Transition name="login-error">
          <p v-if="error" class="login-error">{{ error }}</p>
        </Transition>

        <button class="btn btn-primary login-submit btn-ripple" type="submit" :disabled="loading">
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>

      <p class="login-hint">演示账号：admin / admin123</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: calc(100vh - var(--footer-height, 320px));
  display: grid;
  place-items: center;
  padding: calc(var(--header-height) + 48px) 20px 64px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 36px 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.login-card__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 28px;
}

.login-card__logo {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  color: #fff;
  font-family: var(--font-nav);
  font-weight: 800;
  font-size: 20px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
  margin-bottom: 16px;
}

.login-card__title {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 700;
  color: var(--color-heading);
  letter-spacing: 0.01em;
}

.login-card__sub {
  margin-top: 6px;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.login-field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}

.login-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  font-size: 15px;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.login-input::placeholder {
  color: var(--color-text-tertiary);
}

.login-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.login-error {
  margin: -4px 0 0;
  padding: 10px 12px;
  font-size: 13px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-md);
}

.login-error-enter-active,
.login-error-leave-active {
  transition:
    opacity 0.2s var(--ease),
    transform 0.2s var(--ease);
}

.login-error-enter-from,
.login-error-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.login-submit {
  height: 46px;
  margin-top: 4px;
  font-size: 15px;
  font-weight: 600;
}

.login-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-hint {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-tertiary);
}
</style>
