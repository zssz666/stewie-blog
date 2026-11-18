<script setup lang="ts">
import { ref } from 'vue'

const width = ref(92)
const mode = ref<'media' | 'container'>('container')
</script>

<template>
  <section id="container-query-demo" class="query-demo" aria-label="断点试玩">
    <p class="query-demo__title">拖窄容器，看看卡片会不会换布局。</p>
    <fieldset class="query-demo__switch">
      <legend>使用哪种断点</legend>
      <label><input v-model="mode" type="radio" name="query-mode" value="media" /> 媒体查询</label>
      <label><input v-model="mode" type="radio" name="query-mode" value="container" /> 容器查询</label>
    </fieldset>
    <label class="query-demo__width">
      <span>容器宽度 <output>{{ width }}%</output></span>
      <input v-model.number="width" type="range" min="20" max="100" aria-label="容器宽度" />
    </label>
    <div class="query-demo__stage">
      <div class="query-demo__container" :class="'query-demo__container--' + mode" :style="{ '--demo-width': width + '%' }">
        <div class="query-demo__card">
          <div class="query-demo__sample" aria-hidden="true">CSS</div>
          <div><strong>同一张卡片</strong><span>布局会随断点换成横排或竖排。</span></div>
        </div>
      </div>
    </div>
    <p class="query-demo__hint">
      {{ mode === 'container' ? '容器查询看容器本身的宽度。' : '媒体查询看浏览器窗口的宽度，拖动这个滑杆只会改变容器。' }}
    </p>
  </section>
</template>

<style scoped>
.query-demo {
  scroll-margin-top: calc(var(--header-height) + 24px);
  margin-block: 22px 28px;
  padding: clamp(16px, 4vw, 26px);
  border: 1px solid var(--color-border);
  border-inline-start: 3px solid var(--color-primary);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.query-demo .query-demo__title { margin: 0 0 16px; color: var(--color-heading); font-weight: 700; }
.query-demo__switch { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 0 0 12px; padding: 0; border: 0; }
.query-demo__switch legend { color: var(--color-text-secondary); font-size: 13px; }
.query-demo__switch label { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; cursor: pointer; }
.query-demo input { accent-color: var(--color-primary); }
.query-demo__width, .query-demo__width input { display: block; width: 100%; }
.query-demo__width { color: var(--color-text-secondary); font-size: 13px; }
.query-demo__width output { margin-inline-start: 6px; font-family: var(--font-mono); }
.query-demo__width input { min-height: 32px; }
.query-demo__stage { padding: 10px; background: var(--color-bg-soft); }
.query-demo__container { width: max(140px, var(--demo-width)); max-width: 100%; container-type: inline-size; }
.query-demo__card {
  display: grid;
  grid-template-columns: minmax(38px, 1fr) minmax(0, 2fr);
  gap: 10px;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-heading);
}
.query-demo__sample {
  display: grid;
  place-items: center;
  min-height: 40px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font: 700 13px var(--font-mono);
}
.query-demo__card span { display: block; color: var(--color-text-secondary); font-size: 13px; }
.query-demo .query-demo__hint { margin: 10px 0 0; color: var(--color-text-secondary); font-size: 13px; }
@container (max-width: 210px) {
  .query-demo__container--container .query-demo__card { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 640px) {
  .query-demo__container--media .query-demo__card { grid-template-columns: minmax(0, 1fr); }
}
</style>
