<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { MovieCover } from '@/types/blog'
import { getAuthor, invalidateAuthorCache } from '@/api/author'
import { updateAuthor, uploadCover, type AuthorUpdateInput } from '@/api/admin'
import { resolveAsset } from '@/api/request'

type MovieDraft = MovieCover & { previewFailed?: boolean; uploadError?: string }

const form = reactive<AuthorUpdateInput>({
  name: '',
  role: '',
  bio: '',
  avatar: '',
  skills: [],
  socials: [],
})

const skillsText = ref('')
const movies = ref<MovieDraft[]>([])
const uploading = ref<number | null>(null)
const loading = ref(false)
const loaded = ref(false)
const saving = ref(false)
const error = ref('')
const saved = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const a = await getAuthor(true)
    if (!Array.isArray(a?.movies)) throw new Error('未读取到影视收藏，请确认后台已更新后重试')
    form.name = a.name
    form.role = a.role
    form.bio = a.bio
    form.avatar = a.avatar || ''
    form.skills = [...(a.skills || [])]
    form.socials = (a.socials || []).map((s) => ({ label: s.label, href: s.href }))
    skillsText.value = (a.skills || []).join('、')
    movies.value = a.movies.map(({ title, img }) => ({ title, img }))
    loaded.value = true
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

async function uploadMovieCover(event: Event, movie: MovieDraft, index: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = index
  movie.uploadError = ''
  try {
    const { url } = await uploadCover(file)
    movie.previewFailed = false
    movie.img = url
  } catch (e) {
    movie.uploadError = e instanceof Error ? e.message : '封面上传失败'
  } finally {
    uploading.value = null
    input.value = ''
  }
}

async function save() {
  saving.value = true
  error.value = ''
  saved.value = false
  try {
    const movieCovers = movies.value.map(({ title, img }) => ({ title: title.trim(), img: img.trim() }))
    const incomplete = movieCovers.findIndex(({ title, img }) => !title || !img)
    if (incomplete !== -1) throw new Error(`请填写第 ${incomplete + 1} 条影视收藏的标题和封面`)
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
      movies: movieCovers,
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
  <section class="author-settings">
    <div class="admin-pagehead">
      <div>
        <h1 class="admin-pagehead__title">关于页 / 作者信息</h1>
        <p class="admin-pagehead__sub">编辑「关于我」页面展示的内容，保存后立即生效</p>
      </div>
    </div>

    <div v-if="loading" class="admin-loading">加载中…</div>

    <div v-else>
      <div v-if="error && !loaded" class="admin-alert admin-alert--error" role="alert">{{ error }}</div>

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

      <fieldset class="admin-panel author__movies" :disabled="!loaded || saving || uploading !== null">
        <legend class="field__label">影视收藏</legend>
        <div class="admin-panel__body author__movies-body">
          <p v-if="!movies.length" class="field__hint">暂无收藏</p>
          <div v-for="(movie, index) in movies" :key="index" class="author__movie">
            <div class="author__movie-preview">
              <img
                v-if="!movie.previewFailed && /^(https?:\/\/|\/uploads\/)/i.test(movie.img)"
                :key="movie.img"
                :src="resolveAsset(movie.img)"
                alt="封面预览"
                @error="movie.previewFailed = true"
              />
              <span v-else>{{ movie.previewFailed ? '加载失败' : '无预览' }}</span>
            </div>
            <div class="author__movie-fields">
              <input v-model="movie.title" class="field__control" type="text" placeholder="影视标题" :aria-label="`第 ${index + 1} 条影视标题`" />
              <input
                v-model.lazy.trim="movie.img"
                class="field__control"
                type="text"
                placeholder="粘贴封面图片链接"
                :aria-label="`第 ${index + 1} 条封面图片链接`"
                @change="movie.previewFailed = false"
              />
              <div class="author__movie-actions">
                <label class="btn btn--subtle btn--sm author__movie-upload">
                  <input class="sr-only" type="file" accept=".jpg,.jpeg,.png,.gif,.webp" @change="uploadMovieCover($event, movie, index)" />
                  {{ uploading === index ? '上传中…' : '上传封面' }}
                </label>
                <button type="button" class="btn btn--link is-danger" @click="movies.splice(index, 1)">删除</button>
              </div>
              <p v-if="movie.uploadError" class="field__hint" role="alert">{{ movie.uploadError }}</p>
            </div>
          </div>
          <button type="button" class="btn btn--subtle btn--sm" @click="movies.push({ title: '', img: '' })">+ 新增收藏</button>
        </div>
      </fieldset>

      <div class="author__actions">
        <div v-if="error && loaded" class="admin-alert admin-alert--error" role="alert">{{ error }}</div>
        <div v-if="saved" class="admin-alert admin-alert--success" role="status">✓ 已保存，关于页已更新</div>
        <button class="btn btn--primary btn--lg" type="button" :disabled="!loaded || saving || uploading !== null" @click="save">
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
  min-width: 0;
  flex: 1;
}
.author__actions {
  margin-top: 18px;
}
.author__movies {
  min-inline-size: 0;
  margin: 18px 0 0;
  padding: 0;
}
.author__movies legend {
  margin-left: 12px;
  padding: 0 8px;
}
.author__movies-body {
  display: grid;
  justify-items: start;
  gap: 14px;
  padding: 14px 20px 18px;
}
.author__movie {
  width: 100%;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 12px;
}
.author__movie-preview {
  display: grid;
  place-items: center;
  width: 64px;
  height: 96px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 12px;
}
.author__movie-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.author__movie-fields {
  display: grid;
  min-width: 0;
  gap: 8px;
}
.author__movie-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.author__movie-upload:focus-within {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.author-settings { max-width: 920px; }
@media (max-width: 600px) {
  .social-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; }
  .social-row input:first-child { grid-column: 1; }
  .social-row input:nth-child(2) { grid-column: 1; grid-row: 2; }
  .social-row button { grid-column: 2; grid-row: 1 / 3; }
}
</style>
