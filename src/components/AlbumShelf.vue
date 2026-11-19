<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import type { GalleryAlbum } from '@/types/blog'

const { albums } = defineProps<{ albums: readonly GalleryAlbum[] }>()
const selectedName = defineModel<string>({ required: true })
const emit = defineEmits<{ open: [name: string] }>()
const viewport = useTemplateRef<HTMLDivElement>('viewport')

const selectedIndex = computed(() => {
  const index = albums.findIndex((album) => album.name === selectedName.value)
  return Math.max(0, index)
})
const selectedAlbum = computed(() => albums[selectedIndex.value])

function selectAlbum(index: number) {
  const album = albums[index]
  if (album) selectedName.value = album.name
}

function useTape(album: GalleryAlbum) {
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

function centerTape(event?: TransitionEvent) {
  if (event && event.propertyName !== 'flex-basis') return
  const strip = viewport.value
  const tape = strip?.querySelector<HTMLElement>('.album-shelf__tape--selected')
  if (strip && tape) {
    strip.scrollLeft = tape.offsetLeft - (strip.clientWidth - tape.offsetWidth) / 2
  }
}

watch([selectedAlbum, viewport], () => centerTape(), { flush: 'post' })
</script>

<template>
  <section class="album-shelf" aria-label="相册架">
    <div class="album-shelf__cabinet">
      <div
        ref="viewport"
        class="album-shelf__viewport"
        @keydown.left.prevent="focusTape(selectedIndex - 1)"
        @keydown.right.prevent="focusTape(selectedIndex + 1)"
      >
        <div class="album-shelf__track">
          <button
            v-for="album in albums"
            :key="album.name"
            type="button"
            class="album-shelf__tape"
            :class="{ 'album-shelf__tape--selected': album === selectedAlbum }"
            :aria-label="album === selectedAlbum ? `打开相册 ${album.name}` : `选中相册 ${album.name}`"
            :aria-pressed="album === selectedAlbum"
            @click="useTape(album)"
            @transitionend.self="centerTape"
          >
            <span class="album-shelf__box" aria-hidden="true">
              <span class="album-shelf__spine">
                <img v-if="album.cover" :src="album.cover.url" alt="" loading="lazy" decoding="async" />
                <span>{{ album.name }}</span>
              </span>
              <span class="album-shelf__front">
                <img v-if="album.cover" :src="album.cover.url" alt="" loading="lazy" decoding="async" />
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
        <span>{{ selectedAlbum.photos.length }} 张</span>
      </p>
      <button class="album-shelf__open" type="button" @click="emit('open', selectedAlbum.name)">打开相册 <span aria-hidden="true">↗</span></button>
    </div>
  </section>
</template>

<style scoped>
.album-shelf {
  --tape-height: clamp(215px, min(30vw, 42svh), 328px);
  --spine-width: clamp(36px, 5.5vw, 57px);
  --cover-width: calc(var(--tape-height) * 0.68);
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
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--wood-light) var(--wood-dark);
  border: 4px solid var(--wood-dark);
  border-bottom-color: #824e2f;
  background:
    repeating-linear-gradient(0deg, #583623 0 3px, #68432b 3px 33px, #6e482e 33px 37px);
  box-shadow: inset 0 8px #4c2d20, inset 6px 0 #503021, inset -6px 0 #563423;
}

.album-shelf__track {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  width: max-content;
  min-width: 100%;
  padding: 30px 16px 5px;
}

.album-shelf__tape {
  --tape-stock: #51735d;
  --spine-height: 0.9;
  position: relative;
  flex: 0 0 var(--spine-width);
  height: var(--tape-height);
  perspective: 900px;
}

.album-shelf__tape:nth-child(3n + 2) {
  --tape-stock: #80534f;
  --spine-height: 0.84;
}

.album-shelf__tape:nth-child(3n) {
  --tape-stock: #4b657e;
  --spine-height: 0.96;
}

.album-shelf__tape--selected {
  z-index: 1;
  flex-basis: var(--cover-width);
}

.album-shelf__box {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: var(--spine-width);
  height: calc(100% * var(--spine-height));
  transform-style: preserve-3d;
  transform: translate3d(-50%, 0, calc(var(--cover-width) / -2));
}

.album-shelf__tape:not(.album-shelf__tape--selected):is(:hover, :focus-visible) .album-shelf__box {
  transform: translate3d(-50%, -6px, calc(var(--cover-width) / -2));
}

.album-shelf__tape--selected .album-shelf__box {
  height: 100%;
  transform: translate3d(-50%, -8px, 6px) rotateY(-90deg);
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
  inset-inline: 0;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 12px 5px 20px;
  background-image:
    linear-gradient(90deg, #ffffff2b 0 4px, transparent 4px calc(100% - 5px), #21151050 calc(100% - 5px)),
    linear-gradient(0deg, #e4ba7f 0 8px, transparent 8px);
  transform: translateZ(calc(var(--cover-width) / 2));
}

.album-shelf__spine img {
  width: 100%;
  aspect-ratio: 1;
  flex: none;
  border: 2px solid var(--label-paper);
  object-fit: cover;
  image-rendering: pixelated;
}

.album-shelf__spine span {
  max-height: 100%;
  overflow: hidden;
  writing-mode: vertical-rl;
  color: #fff3d8;
  font: 700 clamp(12px, 1.6vw, 16px)/1.1 var(--font-mono);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-shelf__front {
  left: 50%;
  width: var(--cover-width);
  flex-direction: column;
  gap: 6px;
  padding: 7px;
  background: var(--label-paper);
  box-shadow: inset 0 0 0 3px #cf671f;
  transform: translateX(-50%) rotateY(90deg) translateZ(calc(var(--spine-width) / 2));
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

.album-shelf__tape--selected .album-shelf__front {
  animation: show-cover 240ms ease-out;
}

@keyframes show-cover {
  from { opacity: 0.35; }
}

@media (prefers-reduced-motion: no-preference) {
  .album-shelf__tape {
    transition: flex-basis 460ms var(--ease);
  }

  .album-shelf__box {
    transition: transform 460ms var(--ease), height 460ms var(--ease);
  }

  .album-leave-active .album-shelf__tape--selected .album-shelf__box {
    transition-duration: 310ms;
  }

  .album-leave-to .album-shelf__tape--selected .album-shelf__box {
    transform: translate3d(-50%, -16px, 6px) rotateY(-155deg);
  }
}
</style>
