<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getGalleryAlbums, unlockGalleryAlbum } from '@/api/post'
import AlbumShelf from '@/components/AlbumShelf.vue'
import { useSeo } from '@/composables/useSeo'
import type { GalleryAlbum, GalleryPhoto } from '@/types/blog'

const COLUMNS = 3
const PHOTOS_PER_SHEET = COLUMNS * COLUMNS
const COVER_TRANSITION_MS = 520

const route = useRoute()
const router = useRouter()
const albums = shallowRef<GalleryAlbum[]>([])
const selectedName = shallowRef('')
const unlockedAlbum = shallowRef<GalleryAlbum | null>(null)
const albumPassword = shallowRef('')
const unlockError = shallowRef('')
const unlocking = shallowRef(false)
const hoveredLivePhoto = shallowRef<GalleryPhoto>()
const hoverPlaying = shallowRef(false)
const previewPhoto = shallowRef<GalleryPhoto>()
const previewPlaybackError = shallowRef(false)
const previewDialog = useTemplateRef<HTMLDialogElement>('previewDialog')
const loading = shallowRef(true)
const loadError = shallowRef(false)
let departingCover: { image: HTMLImageElement; bounds: DOMRect } | undefined
let coverAnimation: Animation | undefined
let unlockTimer = 0
const albumName = computed(() => typeof route.params.album === 'string' ? route.params.album : '')
const activeAlbum = computed(() => unlockedAlbum.value?.name === albumName.value
  ? unlockedAlbum.value
  : albums.value.find((album) => album.name === albumName.value))
const visibleAlbums = computed(() => albums.value.filter((album) => album.locked || album.photos.length > 0))
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

function clearAlbumAccess() {
  clearTimeout(unlockTimer)
  stopLiveHover()
  unlockedAlbum.value = null
  previewDialog.value?.close()
  previewPhoto.value = undefined
}

async function unlockAlbum() {
  if (unlocking.value || !activeAlbum.value?.locked) return
  const name = albumName.value
  unlocking.value = true
  unlockError.value = ''
  try {
    const result = await unlockGalleryAlbum(name, albumPassword.value)
    if (name !== albumName.value) return
    unlockedAlbum.value = result.album
    unlockTimer = window.setTimeout(() => {
      clearAlbumAccess()
      unlockError.value = '查看权限已过期，请重新输入密码。'
    }, Math.max(0, result.expiresAt - Date.now()))
  } catch (error) {
    if (name === albumName.value) unlockError.value = error instanceof Error ? error.message : String(error)
  } finally {
    albumPassword.value = ''
    unlocking.value = false
  }
}

function rememberCover(page: Element) {
  coverAnimation?.cancel()
  departingCover = undefined
  const image = page.querySelector<HTMLImageElement>('[data-gallery-cover]')
  if (!image?.naturalWidth) return
  const bounds = image.getBoundingClientRect()
  if (bounds.bottom > 0 && bounds.top < window.innerHeight) departingCover = { image, bounds }
}

function enterAlbum(page: Element) {
  const from = departingCover
  departingCover = undefined
  const target = page.querySelector<HTMLImageElement>('[data-gallery-cover]')
  if (!from || !target || from.image.src !== target.src) return

  from.image.style.visibility = 'hidden'
  target.style.visibility = 'hidden'
  requestAnimationFrame(() => {
    if (!target.isConnected) {
      from.image.style.removeProperty('visibility')
      target.style.removeProperty('visibility')
      return
    }

    const to = target.getBoundingClientRect()
    const movingCover = new Image()
    movingCover.src = from.image.src
    movingCover.alt = ''
    movingCover.setAttribute('aria-hidden', 'true')
    Object.assign(movingCover.style, {
      position: 'fixed', top: '0', left: '0', zIndex: '30',
      maxWidth: 'none', pointerEvents: 'none', objectFit: 'cover',
      borderRadius: getComputedStyle(target).borderRadius,
    })
    document.body.append(movingCover)

    const animation = movingCover.animate([from.bounds, to].map((bounds) => ({
      transform: `translate(${bounds.left}px, ${bounds.top}px)`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
    })), { duration: COVER_TRANSITION_MS, easing: 'cubic-bezier(0.22, 0.7, 0.24, 1)', fill: 'both' })
    coverAnimation = animation
    const finish = () => {
      movingCover.remove()
      from.image.style.removeProperty('visibility')
      target.style.removeProperty('visibility')
      if (coverAnimation === animation) coverAnimation = undefined
    }
    void animation.finished.then(finish, finish)
  })
}

function startLiveHover(photo: GalleryPhoto, event: PointerEvent) {
  if (event.pointerType === 'mouse' && photo.liveVideoUrl && !previewDialog.value?.open) {
    hoveredLivePhoto.value = photo
  }
}

function stopLiveHover() {
  hoveredLivePhoto.value = undefined
  hoverPlaying.value = false
}

function openPhoto(photo: GalleryPhoto) {
  stopLiveHover()
  previewPlaybackError.value = false
  previewPhoto.value = photo
  previewDialog.value?.showModal()
}

function measurePhoto(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  image.parentElement?.style.setProperty('--photo-wall-image-ratio', String(image.naturalWidth / image.naturalHeight))
}

watch(albumName, (name) => {
  clearAlbumAccess()
  albumPassword.value = ''
  unlockError.value = ''
  if (name) selectedName.value = name
}, { immediate: true })
onMounted(load)
onBeforeUnmount(() => {
  clearAlbumAccess()
  coverAnimation?.cancel()
})
</script>

<template>
  <section class="container photo-wall">
    <Transition name="album" @before-leave="rememberCover" @enter="enterAlbum">
      <div :key="albumName" class="photo-wall__album">
        <RouterLink v-if="albumName" to="/photos" class="photo-wall__back">← 返回相册架</RouterLink>
        <header class="photo-wall__header" :class="{ 'photo-wall__header--album': activeAlbum?.cover }">
          <img
            v-if="activeAlbum?.cover"
            class="photo-wall__album-cover"
            :src="activeAlbum.cover.url"
            alt=""
            data-gallery-cover
          />
          <div>
            <h1>{{ albumName || '照片墙' }}</h1>
            <p v-if="photos.length" class="photo-wall__album-count">{{ photos.length }} 张照片</p>
          </div>
        </header>

        <p v-if="loading" class="photo-wall__state" role="status">正在加载照片…</p>
        <div v-else-if="loadError" class="photo-wall__state" role="alert">
          <p>照片暂时加载失败。</p>
          <button class="photo-wall__retry" type="button" @click="load">重试</button>
        </div>
        <AlbumShelf v-else-if="!albumName && visibleAlbums.length" v-model="selectedName" :albums="visibleAlbums" @open="openAlbum" />
        <p v-else-if="!albumName" class="photo-wall__state">照片墙还没有相册。</p>
        <p v-else-if="!activeAlbum" class="photo-wall__state">没有找到这个相册。</p>
        <form v-else-if="activeAlbum.locked" class="photo-wall__password" @submit.prevent="unlockAlbum">
          <label>
            查看密码
            <input
              v-model="albumPassword"
              type="password"
              autocomplete="current-password"
              maxlength="72"
              :disabled="unlocking"
              required
            />
          </label>
          <button class="btn btn--primary" type="submit" :disabled="unlocking">
            {{ unlocking ? '正在验证…' : '解锁相册' }}
          </button>
          <p v-if="unlockError" class="photo-wall__password-error" role="alert">{{ unlockError }}</p>
        </form>
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
              :aria-label="`${photo.liveVideoUrl ? '观看实况' : '查看大图'}：${photo.name}`"
              aria-haspopup="dialog"
              @pointerenter="startLiveHover(photo, $event)"
              @pointerleave="stopLiveHover"
              @click="openPhoto(photo)"
            >
              <img class="photo-wall__image" :src="photo.url" alt="" loading="lazy" decoding="async" @load="measurePhoto" />
              <video
                v-if="photo.liveVideoUrl && hoveredLivePhoto === photo"
                class="photo-wall__live-video"
                :class="{ 'photo-wall__live-video--playing': hoverPlaying }"
                :src="photo.liveVideoUrl"
                autoplay
                muted
                playsinline
                aria-hidden="true"
                @playing="hoverPlaying = true"
                @ended="stopLiveHover"
                @error="stopLiveHover"
              />
              <span v-if="photo.liveVideoUrl" class="photo-wall__live-mark" aria-hidden="true">LIVE</span>
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
      @close="previewPhoto = undefined"
    >
      <video
        v-if="previewPhoto?.liveVideoUrl && !previewPlaybackError"
        :src="previewPhoto.liveVideoUrl"
        :poster="previewPhoto.url"
        :aria-label="`实况：${previewPhoto.name}`"
        autoplay
        muted
        playsinline
        controls
        @error="previewPlaybackError = true"
      />
      <img v-else-if="previewPhoto" :src="previewPhoto.url" :alt="previewPhoto.name" />
      <p v-if="previewPhoto && previewPlaybackError" class="photo-wall__preview-error" role="status">
        无法播放实况视频。
      </p>
      <button type="button" class="photo-wall__preview-close" aria-label="关闭照片" @click="previewDialog?.close()">
        <span aria-hidden="true">×</span>
      </button>
    </dialog>
  </section>
</template>

<style scoped>
@property --photo-wall-reveal {
  syntax: '<number>';
  inherits: false;
  initial-value: 0;
}

.photo-wall {
  --photo-resize: 360ms cubic-bezier(0.24, 0.72, 0.24, 1);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  max-width: 1080px;
  min-height: 60vh;
  padding-top: calc(var(--header-height) + clamp(32px, 6vw, 72px));
  padding-bottom: clamp(56px, 8vw, 112px);
}

.photo-wall__album {
  grid-area: 1 / 1;
  align-self: start;
  min-width: 0;
}

.photo-wall__header {
  margin-bottom: 24px;
}

.photo-wall__header--album {
  display: grid;
  grid-template-columns: clamp(112px, 25vw, 246px) minmax(0, 1fr);
  align-items: end;
  gap: clamp(16px, 4vw, 44px);
  margin-bottom: clamp(24px, 4vw, 44px);
}

.photo-wall__album-cover {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-sm);
  object-fit: cover;
  box-shadow: var(--shadow-lg);
}

.photo-wall__header h1 {
  font: 700 clamp(2.3rem, 6vw, 4.25rem)/1.12 var(--font-display);
  color: var(--color-heading);
  overflow-wrap: anywhere;
}

.photo-wall__album-count,
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

.photo-wall__password {
  display: grid;
  justify-items: start;
  gap: 14px;
  padding-block: 22px;
  border-top: 1px solid var(--color-border);
}

.photo-wall__password label {
  display: grid;
  gap: 6px;
  width: min(100%, 320px);
}

.photo-wall__password input {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}

.photo-wall__password-error {
  color: var(--color-danger, #b91c1c);
}

.photo-wall__sheets {
  display: grid;
  gap: clamp(16px, 3vw, 30px);
  container-type: inline-size;
}

.album-enter-active {
  transition: opacity 420ms ease-out;
}

.album-leave-active {
  transition: opacity 320ms ease-out;
  z-index: 1;
  pointer-events: none;
}

.album-enter-from,
.album-leave-to {
  opacity: 0;
}

.album-enter-active .photo-wall__sheets {
  animation: reveal-sheets 380ms var(--ease) 80ms both;
}

@keyframes reveal-sheets {
  from { opacity: 0; transform: translateY(16px); }
}

.photo-wall__sheet {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(4px, 0.7vw, 8px);
}

.photo-wall__tile {
  position: relative;
  display: block;
  container-type: size;
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

.photo-wall__image,
.photo-wall__live-video {
  --photo-wall-reveal: 0;
  --height-fitted-width: calc(100cqh * var(--photo-wall-image-ratio));
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(
    max(100cqw, var(--height-fitted-width)) * (1 - var(--photo-wall-reveal)) +
    min(100cqw, var(--height-fitted-width)) * var(--photo-wall-reveal)
  );
  max-width: none;
  height: auto;
  transform: translate(-50%, -50%);
}

.photo-wall__live-video {
  aspect-ratio: var(--photo-wall-image-ratio);
  object-fit: cover;
  pointer-events: none;
  opacity: 0;
  transition: opacity 140ms ease-out, --photo-wall-reveal var(--photo-resize);
}

.photo-wall__live-video--playing {
  opacity: 1;
}

.photo-wall__live-mark {
  position: absolute;
  right: 7px;
  bottom: 7px;
  padding: 3px 5px;
  border-radius: var(--radius-sm);
  background: rgb(14 20 25 / 80%);
  color: #fff;
  font: 700 0.625rem/1.1 var(--font-mono);
  letter-spacing: 0.06em;
  pointer-events: none;
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

.photo-wall__preview :is(img, video) {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--radius-sm);
  object-fit: contain;
}

.photo-wall__preview-error {
  position: absolute;
  bottom: 20px;
  color: #fff;
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

.photo-wall__tile:focus-visible :is(.photo-wall__image, .photo-wall__live-video) {
  --photo-wall-reveal: 1;
}

@media (hover: hover) {
  .photo-wall__tile:hover :is(.photo-wall__image, .photo-wall__live-video) {
    --photo-wall-reveal: 1;
  }
}

@media (min-width: 48rem) {
  .photo-wall__sheet {
    grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  }
}

@media (min-width: 48rem) and (hover: hover) and (pointer: fine) {
  .photo-wall__sheet--elastic {
    --rest-tile-height: 0px;
    --expanded-tile-height: 22cqi;
    aspect-ratio: calc(var(--columns) * 5) / calc(var(--rows) * 3);
    grid-template-columns: repeat(var(--columns), auto);
    grid-template-rows: repeat(var(--rows), auto);
  }

  .photo-wall__sheet--elastic.photo-wall__sheet--single-row {
    --rest-tile-height: calc(100cqi * 3 / var(--columns) / 5);
    --expanded-tile-height: 40cqi;
    aspect-ratio: auto;
    grid-template-rows: minmax(var(--rest-tile-height), auto);
  }

  /* 选中的照片撑大所在行列，其他照片留在同一页。 */
  .photo-wall__sheet--elastic .photo-wall__tile {
    inline-size: 0;
    block-size: var(--rest-tile-height);
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

.photo-wall__image {
  transition: --photo-wall-reveal var(--photo-resize);
}

.photo-wall__sheet--elastic .photo-wall__tile {
  transition: inline-size var(--photo-resize), block-size var(--photo-resize);
}
</style>
