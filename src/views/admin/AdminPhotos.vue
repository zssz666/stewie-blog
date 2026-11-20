<script setup lang="ts">
import { computed, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import {
  createGalleryAlbum,
  deleteGalleryPhoto,
  getAdminGalleryAlbums,
  removeGalleryLiveVideo,
  removeGalleryPassword,
  setGalleryCover,
  setGalleryLiveVideo,
  setGalleryPassword,
  uploadFile,
} from '@/api/admin'
import type { GalleryAlbum } from '@/types/blog'

const MAX_MEDIA_BYTES = 10 * 1024 * 1024
const CONCURRENT_PHOTO_UPLOADS = 3

const albums = shallowRef<GalleryAlbum[]>([])
const selectedName = shallowRef('')
const newAlbumName = shallowRef('')
const albumPassword = shallowRef('')
const photoInput = useTemplateRef<HTMLInputElement>('photoInput')
const liveVideoInput = useTemplateRef<HTMLInputElement>('liveVideoInput')
let liveVideoTarget: { album: string; name: string } | undefined
const loading = shallowRef(true)
const busy = shallowRef(false)
const uploadPercent = shallowRef<number | null>(null)
const error = shallowRef('')
const notice = shallowRef('')
const selectedAlbum = computed(() => albums.value.find((album) => album.name === selectedName.value))

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : String(cause)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    albums.value = await getAdminGalleryAlbums()
    if (!selectedAlbum.value) selectedName.value = albums.value[0]?.name ?? ''
  } catch (cause) {
    error.value = errorMessage(cause)
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
    error.value = errorMessage(cause)
  } finally {
    busy.value = false
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

async function upload() {
  const input = photoInput.value
  const album = selectedAlbum.value
  if (!input?.files?.length || !album || busy.value || loading.value) return

  const files = Array.from(input.files)
  const uploadable = files.filter((file) => file.size <= MAX_MEDIA_BYTES)
  const failures = files
    .filter((file) => file.size > MAX_MEDIA_BYTES)
    .map((file) => `${file.name} 超过 10 MB。`)
  const albumName = album.name
  let combinedProgress = 0

  async function uploadOne(file: File) {
    let previousPercent = 0
    try {
      await uploadFile(file, {
        album: albumName,
        onProgress: (percent) => {
          combinedProgress += percent - previousPercent
          previousPercent = percent
          uploadPercent.value = Math.round(combinedProgress / uploadable.length)
        },
      })
      return null
    } catch (cause) {
      return `${file.name}：${errorMessage(cause)}`
    }
  }

  busy.value = true
  error.value = ''
  notice.value = ''
  uploadPercent.value = 0
  try {
    for (let start = 0; start < uploadable.length; start += CONCURRENT_PHOTO_UPLOADS) {
      const group = uploadable.slice(start, start + CONCURRENT_PHOTO_UPLOADS)
      const results = await Promise.all(group.map(uploadOne))
      failures.push(...results.filter((message) => message !== null))
    }
    input.value = ''
    const uploaded = files.length - failures.length
    if (uploaded > 0) {
      await load()
      notice.value = `已上传 ${uploaded} 张照片。`
    }
    if (failures.length) {
      error.value = [error.value, `${failures.length} 张照片未上传`, ...failures].filter(Boolean).join('\n')
    }
  } finally {
    busy.value = false
    uploadPercent.value = null
  }
}

function chooseCover(name: string) {
  const album = selectedAlbum.value
  if (album) void save(() => setGalleryCover(album.name, name), '相册封面已更新。')
}

function chooseLiveVideo(name: string) {
  const album = selectedAlbum.value
  if (!album || loading.value || busy.value) return
  liveVideoTarget = { album: album.name, name }
  liveVideoInput.value?.click()
}

function uploadLiveVideo() {
  const input = liveVideoInput.value
  const file = input?.files?.[0]
  const target = liveVideoTarget
  liveVideoTarget = undefined
  if (!input || !file || !target) return
  input.value = ''
  if (file.size > MAX_MEDIA_BYTES) {
    notice.value = ''
    error.value = '实况视频不能超过 10 MB。'
    return
  }
  void save(() => setGalleryLiveVideo(target.album, target.name, file), '实况视频已保存。')
}

function removeLiveVideo(name: string) {
  const album = selectedAlbum.value
  if (!album || loading.value || busy.value) return
  if (!window.confirm('确定移除实况视频？封面照片会保留。')) return
  void save(() => removeGalleryLiveVideo(album.name, name), '实况视频已移除。')
}

function setPassword() {
  const album = selectedAlbum.value
  if (!album || !albumPassword.value) return
  void save(async () => {
    await setGalleryPassword(album.name, albumPassword.value)
    albumPassword.value = ''
  }, '相册查看密码已保存。')
}

function removePassword() {
  const album = selectedAlbum.value
  if (!album?.locked || !window.confirm(`移除「${album.name}」的密码后，所有访客都能查看照片。确定移除吗？`)) return
  void save(() => removeGalleryPassword(album.name), '相册已恢复公开查看。')
}

function remove(name: string) {
  const album = selectedAlbum.value
  if (!album || busy.value || loading.value) return
  if (!window.confirm(`确定从相册「${album.name}」和存储桶删除「${name}」？`)) return
  void save(() => deleteGalleryPhoto(album.name, name), '照片已删除。')
}

watch(selectedName, () => { albumPassword.value = '' })
onMounted(load)
</script>

<template>
  <section class="admin-photos">
    <div class="admin-pagehead">
      <div>
        <h1 class="admin-pagehead__title">照片管理</h1>
        <p class="admin-pagehead__sub">每个相册对应 <code>my-imgs/</code> 下的一个目录。</p>
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
          <span>选择照片（可多选，每张最多 10 MB）</span>
          <input
            ref="photoInput"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            :disabled="loading || busy"
            multiple
            required
          />
        </label>
        <button class="btn btn--primary" type="submit" :disabled="loading || busy">
          {{ uploadPercent === null ? '上传照片' : `上传中 ${uploadPercent}%` }}
        </button>
      </form>
      <form
        v-if="selectedAlbum && selectedAlbum.name !== '未归档'"
        class="admin-panel__body admin-photos__form"
        @submit.prevent="setPassword"
      >
        <label class="admin-photos__field">
          <span>「{{ selectedAlbum.name }}」查看密码 · {{ selectedAlbum.locked ? '已加锁' : '公开' }}</span>
          <input
            v-model="albumPassword"
            type="password"
            autocomplete="new-password"
            placeholder="至少 8 个字符"
            minlength="8"
            maxlength="72"
            :disabled="loading || busy"
            required
          />
        </label>
        <button class="btn btn--primary" type="submit" :disabled="loading || busy">
          {{ selectedAlbum.locked ? '更改密码' : '设置密码' }}
        </button>
        <button
          v-if="selectedAlbum.locked"
          class="btn btn--link"
          type="button"
          :disabled="loading || busy"
          @click="removePassword"
        >移除密码</button>
      </form>
    </div>

    <input ref="liveVideoInput" type="file" accept="video/mp4,video/quicktime,.mp4,.mov" hidden @change="uploadLiveVideo" />
    <p v-if="notice" class="admin-photos__notice" role="status">{{ notice }}</p>
    <div v-if="error" class="admin-alert admin-alert--error" role="alert">
      <span class="admin-photos__error-text">{{ error }}</span>
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
            class="btn btn--link"
            type="button"
            title="选择 10 MB 以内的 MP4 或 MOV"
            :disabled="busy"
            @click="chooseLiveVideo(photo.name)"
          >{{ photo.liveVideoUrl ? '替换实况' : '添加实况' }}</button>
          <button
            v-if="photo.liveVideoUrl"
            class="btn btn--link"
            type="button"
            :disabled="busy"
            @click="removeLiveVideo(photo.name)"
          >移除实况</button>
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

.admin-photos__field :is(input[type='text'], input[type='password'], select) {
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

.admin-photos__error-text {
  white-space: pre-line;
  overflow-wrap: anywhere;
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
  flex-wrap: wrap;
  gap: 4px 12px;
  padding: 0 12px 6px;
}

.admin-photos__delete {
  flex: none;
  color: var(--color-danger, #b91c1c);
}
</style>
