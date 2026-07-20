<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { Author } from '@/types/blog'
import { getAuthor, invalidateAuthorCache } from '@/api/author'
import { updateAuthor, type AuthorUpdateInput } from '@/api/admin'

const form = reactive<AuthorUpdateInput>({
  name: '',
  role: '',
  bio: '',
  avatar: '',
  skills: [],
  socials: [],
})

const skillsText = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const saved = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const a: Author = await getAuthor()
    form.name = a.name
    form.role = a.role
    form.bio = a.bio
    form.avatar = a.avatar || ''
    form.skills = [...(a.skills || [])]
    form.socials = (a.socials || []).map((s) => ({ label: s.label, href: s.href }))
    skillsText.value = (a.skills || []).join('、')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载作者信息失败'
  } finally {
    loading.value = false
  }
}

function addSocial() {
  form.socials = [...(form.socials || []), { label: '', href: '' }]
}

function removeSocial(index: number) {
  form.socials = (form.socials || []).filter((_, i) => i !== index)
}

async function save() {
  saving.value = true
  error.value = ''
  saved.value = false
  try {
    const payload: AuthorUpdateInput = {
      name: form.name?.trim() || undefined,
      role: form.role?.trim() || undefined,
      bio: form.bio?.trim() || undefined,
      avatar: form.avatar?.trim() || undefined,
      skills: skillsText.value
        .split(/[、,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
      socials: (form.socials || [])
        .map((s) => ({ label: s.label.trim(), href: s.href.trim() }))
        .filter((s) => s.label && s.href),
    }
    await updateAuthor(payload)
    invalidateAuthorCache()
    saved.value = true
    // 清除「已保存」提示
    window.setTimeout(() => (saved.value = false), 3000)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section>
    <div class="admin-pagehead">
      <div>
        <h1 class="admin-pagehead__title">关于页 / 作者信息</h1>
        <p class="admin-pagehead__sub">编辑「关于我」页面展示的内容，保存后立即生效</p>
      </div>
    </div>

    <div v-if="loading" class="admin-loading">加载中…</div>

    <div v-else>
      <div v-if="error" class="admin-alert admin-alert--error">⚠️ {{ error }}</div>
      <div v-if="saved" class="admin-alert admin-alert--success">✓ 已保存，关于页已更新</div>

      <div class="admin-panel">
        <div class="admin-panel__body" style="padding: 18px 20px">
          <div class="field">
            <label class="field__label">昵称 / 姓名</label>
            <input v-model="form.name" class="field__control" type="text" placeholder="如 Stewie" />
          </div>

          <div class="field" style="margin-top: 16px">
            <label class="field__label">身份 / 头衔</label>
            <input v-model="form.role" class="field__control" type="text" placeholder="如 前端开发工程师" />
          </div>

          <div class="field" style="margin-top: 16px">
            <label class="field__label">头像 URL</label>
            <input v-model="form.avatar" class="field__control" type="text" placeholder="https://... 留空则用昵称首字母" />
            <div v-if="form.avatar" class="author__avatar-preview">
              <img :src="form.avatar" alt="头像预览" />
            </div>
          </div>

          <div class="field" style="margin-top: 16px">
            <label class="field__label">简介</label>
            <textarea v-model="form.bio" class="field__control" rows="4" placeholder="一句话介绍自己…" />
          </div>

          <div class="field" style="margin-top: 16px">
            <label class="field__label">技能标签</label>
            <input
              v-model="skillsText"
              class="field__control"
              type="text"
              placeholder="用「、」或「,」分隔，如 Vue 3、TypeScript、Spring Boot"
            />
            <p class="field__hint">当前：{{ skillsText || '（空）' }}</p>
          </div>

          <div class="field" style="margin-top: 16px">
            <div class="field__row">
              <label class="field__label">社交链接</label>
              <button type="button" class="btn btn--subtle btn--sm" @click="addSocial">+ 新增</button>
            </div>
            <p v-if="!form.socials || !form.socials.length" class="field__hint">暂无社交链接</p>
            <div v-for="(s, i) in form.socials" :key="i" class="social-row">
              <input v-model="s.label" class="field__control" type="text" placeholder="名称，如 GitHub" />
              <input v-model="s.href" class="field__control" type="text" placeholder="https://…" />
              <button type="button" class="btn btn--link is-danger" style="padding: 5px 11px" @click="removeSocial(i)" aria-label="删除">✕</button>
            </div>
          </div>
        </div>
      </div>

      <div class="author__actions">
        <button class="btn btn--primary btn--lg" type="button" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : '保存修改' }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.author__avatar-preview {
  margin-top: 8px;
}
.author__avatar-preview img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-border);
}
.social-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.social-row .field__control {
  flex: 1;
}
.author__actions {
  margin-top: 18px;
}
</style>
