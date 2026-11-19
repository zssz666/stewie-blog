<script setup lang="ts">
import { computed, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getGalleryAlbums } from '@/api/post'
import AlbumShelf from '@/components/AlbumShelf.vue'
import { useSeo } from '@/composables/useSeo'
import type { GalleryAlbum, GalleryPhoto } from '@/types/blog'

const COLUMNS = 3
const PHOTOS_PER_SHEET = COLUMNS * COLUMNS

const route = useRoute()
const router = useRouter()
const albums = shallowRef<GalleryAlbum[]>([])
const selectedName = shallowRef('')
const previewPhoto = shallowRef<GalleryPhoto>()
const previewDialog = useTemplateRef<HTMLDialogElement>('previewDialog')
const loading = shallowRef(true)
const loadError = shallowRef(false)
const albumName = computed(() => typeof route.params.album === 'string' ? route.params.album : '')
const activeAlbum = computed(() => albums.value.find((album) => album.name === albumName.value))
const visibleAlbums = computed(() => albums.value.filter((album) => album.photos.length > 0))
const photos = computed(() => activeAlbum.value?.photos ?? [])
const sheets = computed(() => {
  const result = []
  for (let start = 0; start < photos.value.length; start += PHOTOS_PER_SHEET) {
    const entries = photos.value.slice(start, start + PHOTOS_PER_SHEET)
    result.push({
      entries,
      columns: Math.min(COLUMNS, entries.length),
      rows: Math.ceil(entries.length / COLUMNS),
    })
  }
  return result
})

useSeo({
  title: () => albumName.value || '照片墙',
  description: 'Stewie 的摄影相册。',
  path: () => route.path,
})

async function load() {
  loading.value = true
  loadError.value = false
  try {
    albums.value = await getGalleryAlbums()
  } catch (error) {
    console.error('加载照片墙失败:', error)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function openAlbum(name: string) {
  void router.push({ name: 'photos', params: { album: name } })
}

function openPhoto(photo: GalleryPhoto) {
  previewPhoto.value = photo
  previewDialog.value?.showModal()
}

watch(albumName, (name) => {
  previewDialog.value?.close()
  if (name) selectedName.value = name
}, { immediate: true })
onMounted(load)
</script>

<template>
  <section class="container photo-wall">
    <Transition name="album" mode="out-in">
      <div :key="albumName" class="photo-wall__album">
        <RouterLink v-if="albumName" to="/photos" class="photo-wall__back">← 返回相册架</RouterLink>
        <header class="photo-wall__header">
          <h1>{{ albumName || '照片墙' }}</h1>
        </header>

        <p v-if="loading" class="photo-wall__state" role="status">正在加载照片…</p>
        <div v-else-if="loadError" class="photo-wall__state" role="alert">
          <p>照片暂时加载失败。</p>
          <button class="photo-wall__retry" type="button" @click="load">重试</button>
        </div>
        <AlbumShelf v-else-if="!albumName && visibleAlbums.length" v-model="selectedName" :albums="visibleAlbums" @open="openAlbum" />
        <p v-else-if="!albumName" class="photo-wall__state">照片墙还没有相册。</p>
        <p v-else-if="!activeAlbum" class="photo-wall__state">没有找到这个相册。</p>
        <p v-else-if="!photos.length" class="photo-wall__state">这个相册还没有照片。</p>
        <div v-else class="photo-wall__sheets">
          <div
            v-for="sheet in sheets"
            :key="sheet.entries[0]?.name"
            class="photo-wall__sheet"
            :class="{
              'photo-wall__sheet--elastic': sheet.columns > 1,
              'photo-wall__sheet--single-row': sheet.rows === 1,
            }"
            :style="{ '--rows': sheet.rows, '--columns': sheet.columns }"
          >
            <button
              v-for="photo in sheet.entries"
              :key="photo.name"
              type="button"
              class="photo-wall__tile"
              :aria-label="`查看大图：${photo.name}`"
              aria-haspopup="dialog"
              @click="openPhoto(photo)"
            >
              <img class="photo-wall__image" :src="photo.url" alt="" loading="lazy" decoding="async" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
    <dialog
      ref="previewDialog"
      class="photo-wall__preview"
      aria-label="照片预览"
      @click.self="previewDialog?.close()"
    >
      <img v-if="previewPhoto" :src="previewPhoto.url" :alt="previewPhoto.name" />
      <button type="button" class="photo-wall__preview-close" aria-label="关闭照片" @click="previewDialog?.close()">
        <span aria-hidden="true">×</span>
      </button>
    </dialog>
  </section>
</template>

<style scoped>
.photo-wall {
  max-width: 1080px;
  min-height: 60vh;
  padding-top: calc(var(--header-height) + clamp(32px, 6vw, 72px));
  padding-bottom: clamp(56px, 8vw, 112px);
}

.photo-wall__header {
  margin-bottom: 24px;
}

.photo-wall__header h1 {
  font: 700 clamp(2.3rem, 6vw, 4.25rem)/1.12 var(--font-display);
  color: var(--color-heading);
}

.photo-wall__state {
  color: var(--color-text-secondary);
}

.photo-wall__back {
  display: inline-block;
  margin-bottom: 16px;
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.photo-wall__state {
  padding-block: 28px;
  border-top: 1px solid var(--color-border);
}

.photo-wall__retry {
  margin-top: 12px;
  min-height: 44px;
  color: var(--color-primary);
  text-decoration: underline;
}

.photo-wall__sheets {
  display: grid;
  gap: clamp(16px, 3vw, 30px);
  container-type: inline-size;
}

.album-enter-active,
.album-leave-active {
  transition: opacity 200ms ease-out;
}

.album-enter-from,
.album-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .album-leave-active:has(.album-shelf) {
    transition-delay: 140ms;
  }

  .album-enter-active:has(.photo-wall__sheets) {
    transition-duration: 480ms;
  }

  .album-enter-active .photo-wall__sheets {
    animation: unfold-photos 480ms var(--ease) both;
  }
}

@keyframes unfold-photos {
  from { clip-path: inset(0 12% 76% 12%); }
  to { clip-path: inset(0); }
}

.photo-wall__sheet {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(4px, 0.7vw, 8px);
}

.photo-wall__tile {
  position: relative;
  display: block;
  overflow: hidden;
  aspect-ratio: 5 / 3;
  padding: 0;
  border-radius: var(--radius-sm);
  background: var(--color-bg-soft);
}

.photo-wall__tile:only-child {
  grid-column: 1 / -1;
}

.photo-wall__tile:focus-visible {
  z-index: 1;
  outline-offset: 2px;
}

.photo-wall__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:global(html:has(.photo-wall__preview[open])) {
  overflow: hidden;
}

.photo-wall__preview[open] {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template: minmax(0, 1fr) / minmax(0, 1fr);
  place-items: center;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  padding: clamp(68px, 8dvh, 88px) clamp(16px, 5vw, 96px);
  overflow: hidden;
  border: 0;
  background: transparent;
}

.photo-wall__preview::backdrop {
  background: #0e1419;
}

.photo-wall__preview img {
  max-height: 100%;
  border-radius: var(--radius-sm);
  object-fit: contain;
}

.photo-wall__preview-close {
  position: absolute;
  inset: clamp(12px, 2.5vmin, 24px) clamp(12px, 2.5vmin, 24px) auto auto;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: var(--radius-sm);
  background: rgb(255 255 255 / 8%);
  color: #fff;
  font-size: 26px;
  line-height: 1;
}

.photo-wall__preview-close:hover {
  background: rgb(255 255 255 / 18%);
}

.photo-wall__tile:focus-visible .photo-wall__image {
  object-fit: contain;
}

@media (hover: hover) {
  .photo-wall__tile:hover .photo-wall__image {
    object-fit: contain;
  }
}

@media (min-width: 48rem) {
  .photo-wall__sheet {
    grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  }
}

@media (min-width: 48rem) and (hover: hover) and (pointer: fine) {
  .photo-wall__sheet--elastic {
    --expanded-tile-height: 22cqi;
    aspect-ratio: calc(var(--columns) * 5) / calc(var(--rows) * 3);
    grid-template-columns: repeat(var(--columns), auto);
    grid-template-rows: repeat(var(--rows), auto);
  }

  .photo-wall__sheet--elastic.photo-wall__sheet--single-row {
    --expanded-tile-height: 40cqi;
    aspect-ratio: auto;
    grid-template-rows: minmax(calc(100cqi * 3 / var(--columns) / 5), auto);
  }

  /* 选中的照片撑大所在行列，其他照片留在同一页。 */
  .photo-wall__sheet--elastic .photo-wall__tile {
    inline-size: 0;
    block-size: 0;
    min-inline-size: 100%;
    min-block-size: 100%;
    aspect-ratio: auto;
  }

  .photo-wall__sheet--elastic .photo-wall__tile:hover,
  .photo-wall__sheet--elastic:not(:has(.photo-wall__tile:hover)) .photo-wall__tile:focus-visible {
    inline-size: 37cqi;
    block-size: var(--expanded-tile-height);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .photo-wall__sheet--elastic .photo-wall__tile {
    transition: inline-size 280ms var(--ease), block-size 280ms var(--ease);
  }
}
</style>
