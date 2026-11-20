<script setup lang="ts">
import { computed, nextTick, shallowRef, useTemplateRef } from 'vue'
import type { GalleryAlbum } from '@/types/blog'

const DRAG_THRESHOLD = 6
const DRAG_STEP_RATIO = 0.46

const { albums } = defineProps<{ albums: readonly GalleryAlbum[] }>()
const selectedName = defineModel<string>({ required: true })
const emit = defineEmits<{ open: [name: string] }>()
const viewport = useTemplateRef<HTMLDivElement>('viewport')
const dragPosition = shallowRef<number | null>(null)
let pointer: { id: number; x: number; y: number; position: number; step: number } | undefined
let suppressClick = false

const selectedIndex = computed(() => {
  const index = albums.findIndex((album) => album.name === selectedName.value)
  return Math.max(0, index)
})
const selectedAlbum = computed(() => albums[selectedIndex.value])
const slides = computed(() => albums.map((album, index) => {
  const distance = index - (dragPosition.value ?? selectedIndex.value)
  const magnitude = Math.abs(distance)
  const direction = Math.sign(distance)
  const tilt = Math.min(magnitude, 1)
  return {
    album,
    style: {
      '--album-offset': direction * (0.74 * tilt + 0.26 * Math.max(magnitude - 1, 0)),
      '--album-turn': `${-direction * 63 * tilt}deg`,
      '--album-depth': `${-96 * tilt - 14 * Math.max(magnitude - 1, 0)}px`,
      '--album-layer': Math.round(1000 / (1 + magnitude)),
    },
  }
}))

function selectAlbum(index: number) {
  const album = albums[index]
  if (album) selectedName.value = album.name
}

function useTape(album: GalleryAlbum, event: MouseEvent) {
  if (suppressClick && event.detail > 0) return
  if (album === selectedAlbum.value) {
    emit('open', album.name)
    return
  }
  selectedName.value = album.name
}

async function focusTape(index: number) {
  selectAlbum(index)
  await nextTick()
  viewport.value?.querySelector<HTMLElement>('.album-shelf__tape--selected')?.focus({ preventScroll: true })
}

function beginDrag(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return
  suppressClick = false
  const book = viewport.value?.querySelector<HTMLElement>('.album-shelf__tape')
  if (albums.length < 2 || !book) return
  pointer = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    position: selectedIndex.value,
    step: book.offsetWidth * DRAG_STEP_RATIO,
  }
}

function moveDrag(event: PointerEvent) {
  if (pointer?.id !== event.pointerId) return
  const deltaX = event.clientX - pointer.x
  if (dragPosition.value === null) {
    if (Math.abs(deltaX) < DRAG_THRESHOLD || Math.abs(deltaX) < Math.abs(event.clientY - pointer.y)) return
    viewport.value?.setPointerCapture(event.pointerId)
    suppressClick = true
  }
  dragPosition.value = Math.max(0, Math.min(albums.length - 1, pointer.position - deltaX / pointer.step))
}

function endDrag(event: PointerEvent) {
  if (pointer?.id !== event.pointerId) return
  if (dragPosition.value !== null) selectAlbum(Math.round(dragPosition.value))
  dragPosition.value = null
  pointer = undefined
}
</script>

<template>
  <section class="album-shelf" aria-label="相册架">
    <div class="album-shelf__cabinet">
      <div
        ref="viewport"
        class="album-shelf__viewport"
        :class="{ 'album-shelf__viewport--dragging': dragPosition !== null }"
        @keydown.left.prevent="focusTape(selectedIndex - 1)"
        @keydown.right.prevent="focusTape(selectedIndex + 1)"
        @pointerdown="beginDrag"
        @pointermove="moveDrag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @lostpointercapture.self="endDrag"
      >
        <div class="album-shelf__track">
          <button
            v-for="{ album, style } in slides"
            :key="album.name"
            type="button"
            class="album-shelf__tape"
            :class="{ 'album-shelf__tape--selected': album === selectedAlbum }"
            :style="style"
            :aria-label="album === selectedAlbum ? `打开相册 ${album.name}` : `选中相册 ${album.name}`"
            :aria-pressed="album === selectedAlbum"
            :tabindex="album === selectedAlbum ? 0 : -1"
            @click="useTape(album, $event)"
          >
            <span class="album-shelf__box" aria-hidden="true">
              <span v-for="side in ['left', 'right']" :key="side" class="album-shelf__spine" :class="`album-shelf__spine--${side}`">
                <span>{{ album.name }}</span>
              </span>
              <span class="album-shelf__front">
                <img
                  v-if="album.cover"
                  :src="album.cover.url"
                  :data-gallery-cover="album === selectedAlbum ? '' : undefined"
                  alt=""
                  :loading="album === selectedAlbum ? 'eager' : 'lazy'"
                  decoding="async"
                  draggable="false"
                />
                <span v-else-if="album.locked" class="album-shelf__locked">需密码</span>
                <span class="album-shelf__cover-label">{{ album.name }}</span>
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="selectedAlbum" class="album-shelf__controls">
      <div v-if="albums.length > 1" class="album-shelf__arrows">
        <button type="button" aria-label="上一本相册" :disabled="selectedIndex === 0" @click="selectAlbum(selectedIndex - 1)">←</button>
        <button type="button" aria-label="下一本相册" :disabled="selectedIndex === albums.length - 1" @click="selectAlbum(selectedIndex + 1)">→</button>
      </div>
      <p class="album-shelf__selection" aria-live="polite">
        <strong>{{ selectedAlbum.name }}</strong>
        <span>{{ selectedAlbum.locked ? '需密码' : `${selectedAlbum.photos.length} 张` }}</span>
      </p>
      <button class="album-shelf__open" type="button" @click="emit('open', selectedAlbum.name)">打开相册 <span aria-hidden="true">↗</span></button>
    </div>
  </section>
</template>

<style scoped>
.album-shelf {
  --tape-height: clamp(215px, min(30vw, 42svh), 328px);
  --spine-width: clamp(12px, 1.7vw, 22px);
  --cover-width: calc(var(--tape-height) * 0.72);
  --wood-dark: #372318;
  --wood-shade: #6b4229;
  --wood-light: #d29b60;
  --label-paper: #f2d9a5;
  --pixel-corners: polygon(
    4px 0, calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px), 0 4px, 4px 4px
  );
  max-width: 820px;
  margin-inline: auto;
}

.album-shelf__cabinet {
  padding: clamp(12px, 2.4vw, 24px);
  clip-path: var(--pixel-corners);
  border: 4px solid var(--wood-dark);
  background:
    linear-gradient(90deg, #a66b42 24px, transparent 24px 56px, #e2ab6b 56px 76px, transparent 76px)
      11px 5px / 132px 4px repeat-x,
    linear-gradient(90deg, #e3aa6d 16px, transparent 16px 51px, #a96b40 51px 84px, transparent 84px)
      left 21px bottom 7px / 128px 4px repeat-x,
    repeating-linear-gradient(0deg, #a46a42 0 4px, #bb8050 4px 12px, #c38b59 12px 16px);
  box-shadow: inset 0 4px var(--wood-light), inset -4px -6px var(--wood-shade);
}

.album-shelf__viewport {
  overflow: hidden;
  perspective: 1000px;
  touch-action: pan-y pinch-zoom;
  user-select: none;
  border: 4px solid var(--wood-dark);
  border-bottom-color: #824e2f;
  background:
    repeating-linear-gradient(0deg, #583623 0 3px, #68432b 3px 33px, #6e482e 33px 37px);
  box-shadow: inset 0 8px #4c2d20, inset 6px 0 #503021, inset -6px 0 #563423;
}

.album-shelf__track {
  position: relative;
  height: calc(var(--tape-height) + 34px);
  transform-style: preserve-3d;
}

.album-shelf__tape {
  --tape-stock: #51735d;
  position: absolute;
  bottom: 9px;
  left: 50%;
  z-index: var(--album-layer);
  width: var(--cover-width);
  height: var(--tape-height);
  transform-style: preserve-3d;
  transform: translate3d(calc(-50% + var(--album-offset) * var(--cover-width)), 0, var(--album-depth))
    rotateY(var(--album-turn));
}

.album-shelf__tape:nth-child(3n + 2) {
  --tape-stock: #80534f;
}

.album-shelf__tape:nth-child(3n) {
  --tape-stock: #4b657e;
}

.album-shelf__viewport--dragging,
.album-shelf__viewport--dragging .album-shelf__tape {
  cursor: grabbing;
}

.album-shelf__box {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}

.album-shelf__spine,
.album-shelf__front {
  position: absolute;
  inset-block: 0;
  display: flex;
  backface-visibility: hidden;
  clip-path: var(--pixel-corners);
  border: 4px solid var(--wood-dark);
  background-color: var(--tape-stock);
  overflow: hidden;
}

.album-shelf__spine {
  left: 50%;
  width: var(--spine-width);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  border-width: 2px;
  background-image:
    linear-gradient(90deg, #ffffff2b 0 3px, transparent 3px calc(100% - 3px), #21151050 calc(100% - 3px)),
    linear-gradient(0deg, #e4ba7f 0 8px, transparent 8px);
}

.album-shelf__spine--left {
  transform: translateX(-50%) rotateY(-90deg) translateZ(calc(var(--cover-width) / 2));
}

.album-shelf__spine--right {
  transform: translateX(-50%) rotateY(90deg) translateZ(calc(var(--cover-width) / 2));
}

.album-shelf__spine span {
  max-height: 100%;
  overflow: hidden;
  writing-mode: vertical-rl;
  color: #fff3d8;
  font: 700 11px/1 var(--font-mono);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-shelf__front {
  inset-inline: 0;
  flex-direction: column;
  gap: 6px;
  padding: 7px;
  background: var(--label-paper);
  box-shadow: inset 0 0 0 3px #cf671f;
  transform: translateZ(calc(var(--spine-width) / 2));
}

.album-shelf__front img {
  min-height: 0;
  flex: 1;
  border: 3px solid var(--wood-shade);
  width: 100%;
  object-fit: cover;
}

.album-shelf__cover-label {
  padding: 3px 4px;
  text-align: left;
  color: var(--wood-dark);
  font: 700 clamp(14px, 2vw, 18px)/1.25 var(--font-mono);
  overflow-wrap: anywhere;
}

.album-shelf__locked {
  display: grid;
  flex: 1;
  place-items: center;
  background: var(--tape-stock);
  color: #fff3d8;
  font: 700 14px var(--font-mono);
}

.album-shelf__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 20px;
  padding: 14px 4px 0;
}

.album-shelf__arrows {
  display: flex;
  gap: 4px;
}

.album-shelf__arrows button,
.album-shelf__open {
  min-height: 44px;
  padding-inline: 12px;
  clip-path: var(--pixel-corners);
  border: 3px solid var(--wood-dark);
  background: var(--label-paper);
  box-shadow: inset 0 -3px #b28955;
  color: var(--wood-dark);
  font: 700 14px var(--font-mono);
}

.album-shelf__arrows button:not(:disabled):active,
.album-shelf__open:active {
  transform: translateY(2px);
}

.album-shelf__arrows button:focus-visible,
.album-shelf__open:focus-visible {
  box-shadow: inset 0 0 0 3px #824e2f;
}

.album-shelf__arrows button:disabled {
  opacity: 0.38;
}

.album-shelf__selection {
  display: flex;
  flex: 1;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px 12px;
  min-width: min(100%, 140px);
  overflow-wrap: anywhere;
}

.album-shelf__selection strong {
  color: var(--color-heading);
}

.album-shelf__selection span {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.album-shelf__open {
  background: #f5ac63;
  box-shadow: inset 0 -3px #bf6328;
}

.album-shelf__tape {
  transition: transform 380ms cubic-bezier(0.22, 0.7, 0.24, 1), opacity 240ms ease;
}

.album-shelf__viewport--dragging .album-shelf__tape {
  transition: none;
}

.album-leave-to .album-shelf__tape:not(.album-shelf__tape--selected) {
  opacity: 0;
  transform: translate3d(calc(-50% + var(--album-offset) * var(--cover-width) * 1.85), 0, var(--album-depth))
    rotateY(var(--album-turn));
}
</style>
