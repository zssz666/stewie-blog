<script setup lang="ts">
import { computed, onMounted, shallowRef, useTemplateRef } from 'vue'
import { createGalleryAlbum, deleteGalleryPhoto, setGalleryCover, uploadFile } from '@/api/admin'
import { getGalleryAlbums } from '@/api/post'
import type { GalleryAlbum } from '@/types/blog'

const albums = shallowRef<GalleryAlbum[]>([])
const selectedName = shallowRef('')
const newAlbumName = shallowRef('')
const photoInput = useTemplateRef<HTMLInputElement>('photoInput')
const loading = shallowRef(true)
const busy = shallowRef(false)
const uploadPercent = shallowRef<number | null>(null)
const error = shallowRef('')
const notice = shallowRef('')
const selectedAlbum = computed(() => albums.value.find((album) => album.name === selectedName.value))

function showError(cause: unknown) {
  error.value = cause instanceof Error ? cause.message : String(cause)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    albums.value = await getGalleryAlbums()
    if (!selectedAlbum.value) selectedName.value = albums.value[0]?.name ?? ''
  } catch (cause) {
    showError(cause)
  } finally {
    loading.value = false
  }
}

async function save(mutate: () => Promise<void>, message: string) {
  if (busy.value || loading.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await mutate()
    notice.value = message
    await load()
  } catch (cause) {
    showError(cause)
  } finally {
    busy.value = false
    uploadPercent.value = null
  }
}

function createAlbum() {
  const album = newAlbumName.value
  if (!album) return
  void save(async () => {
    await createGalleryAlbum(album)
    selectedName.value = album
    newAlbumName.value = ''
  }, `相册「${album}」已创建。`)
}

function upload() {
  const input = photoInput.value
  const file = input?.files?.[0]
  const album = selectedAlbum.value
  if (!input || !file || !album) return
  void save(async () => {
    uploadPercent.value = 0
    await uploadFile(file, {
      album: album.name,
      onProgress: (percent) => { uploadPercent.value = percent },
    })
    input.value = ''
  }, '照片已上传。')
}

function chooseCover(name: string) {
  const album = selectedAlbum.value
  if (album) void save(() => setGalleryCover(album.name, name), '相册封面已更新。')
}

function remove(name: string) {
  const album = selectedAlbum.value
  if (!album || busy.value || loading.value) return
  if (!window.confirm(`确定从相册「${album.name}」和存储桶删除「${name}」？`)) return
  void save(() => deleteGalleryPhoto(album.name, name), '照片已删除。')
}

onMounted(load)
</script>

<template>
  <section class="admin-photos">
    <div class="admin-pagehead">
      <div>
        <h1 class="admin-pagehead__title">照片管理</h1>
        <p class="admin-pagehead__sub">每个相册对应 <code>my-imgs/</code> 下的一个目录，照片会公开展示。</p>
      </div>
      <RouterLink to="/photos" class="admin-panel__more" target="_blank" rel="noopener">查看照片墙 ↗</RouterLink>
    </div>

    <div class="admin-panel">
      <form class="admin-panel__body admin-photos__form" @submit.prevent="createAlbum">
        <label class="admin-photos__field">
          <span>相册名称</span>
          <input v-model.trim="newAlbumName" type="text" placeholder="例如 2026-11 或成都夜景" :disabled="loading || busy" required />
        </label>
        <button class="btn btn--primary" type="submit" :disabled="loading || busy">新建相册</button>
      </form>
      <form v-if="albums.length" class="admin-panel__body admin-photos__form" @submit.prevent="upload">
        <label class="admin-photos__field">
          <span>上传到相册</span>
          <select v-model="selectedName" :disabled="loading || busy">
            <option v-for="album in albums" :key="album.name" :value="album.name">{{ album.name }}</option>
          </select>
        </label>
        <label class="admin-photos__field">
          <span>选择照片</span>
          <input
            ref="photoInput"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            :disabled="loading || busy"
            required
          />
        </label>
        <button class="btn btn--primary" type="submit" :disabled="loading || busy">
          {{ uploadPercent === null ? '上传照片' : `上传中 ${uploadPercent}%` }}
        </button>
      </form>
    </div>

    <p v-if="notice" class="admin-photos__notice" role="status">{{ notice }}</p>
    <div v-if="error" class="admin-alert admin-alert--error" role="alert">
      {{ error }}
      <button class="btn btn--link" type="button" :disabled="loading || busy" @click="load">重新加载</button>
    </div>
    <p v-if="loading" class="admin-loading" role="status">正在加载照片…</p>
    <ul v-else-if="selectedAlbum?.photos.length" class="admin-photos__grid">
      <li v-for="photo in selectedAlbum.photos" :key="photo.name" class="admin-panel admin-photos__item">
        <a :href="photo.url" target="_blank" rel="noopener" :aria-label="`查看原图：${photo.name}`">
          <img class="admin-photos__image" :src="photo.url" :alt="photo.name" loading="lazy" decoding="async" />
        </a>
        <div class="admin-photos__meta">
          <span :title="photo.name">{{ photo.name }}</span>
          <strong v-if="photo.name === selectedAlbum.cover?.name">当前封面</strong>
        </div>
        <div class="admin-photos__actions">
          <button class="btn btn--link" type="button" :disabled="busy" @click="chooseCover(photo.name)">设为封面</button>
          <button
            class="btn btn--link admin-photos__delete"
            type="button"
            :aria-label="`删除：${photo.name}`"
            :disabled="busy"
            @click="remove(photo.name)"
          >删除</button>
        </div>
      </li>
    </ul>
    <p v-else-if="!error" class="admin-loading">{{ selectedAlbum ? '这个相册还没有照片。' : '先创建一个相册。' }}</p>
  </section>
</template>

<style scoped>
.admin-photos__form {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 12px 20px;
  padding-block: 18px;
}

.admin-photos__form + .admin-photos__form {
  border-top: 1px solid var(--color-border);
}

.admin-photos__field {
  display: grid;
  min-width: 0;
  gap: 6px;
  font-size: 14px;
}

.admin-photos__field :is(input, select) {
  max-width: 100%;
  font: inherit;
}

.admin-photos__field :is(input[type='text'], select) {
  min-height: 40px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}

.admin-photos__notice,
.admin-photos .admin-alert {
  margin-top: 16px;
}

.admin-photos__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));
  gap: 16px;
  margin-top: 20px;
  padding: 0;
  list-style: none;
}

.admin-photos__image {
  display: block;
  width: 100%;
  aspect-ratio: 5 / 3;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  object-fit: cover;
}

.admin-photos__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  font-size: 13px;
}

.admin-photos__meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-photos__meta strong {
  flex: none;
  color: var(--color-primary);
}

.admin-photos__actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 0 12px 6px;
}

.admin-photos__delete {
  flex: none;
  color: var(--color-danger, #b91c1c);
}
</style>
