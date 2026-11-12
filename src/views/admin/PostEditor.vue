<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Category, PostInput } from '@/types/blog'
import {
  buildBlock,
  buildImageBlock,
  buildVideoBlock,
  suggestAlt,
  BLOCK_LEVEL,
  BLOCK_HINTS,
  type BlockKind,
} from '@/editor/blocks'
import { useEditorScrollSync } from '@/composables/useEditorScrollSync'
import {
  createPost,
  getAdminPost,
  updatePost,
  uploadCover,
  uploadFile,
  generateExcerpt,
} from '@/api/admin'
import { getCategories } from '@/api/post'
import { resolveAsset } from '@/api/request'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)

const title = ref('')
const slug = ref('')
const excerpt = ref('')
const content = ref('')
const cover = ref('')
const categoryId = ref<number | null>(null)
const tagsInput = ref('')
const status = ref(1)
const publishDate = ref('')

const categories = ref<Category[]>([])
const uploading = ref(false)
const uploadError = ref('')
const saving = ref(false)
const generating = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const contentInput = ref<HTMLTextAreaElement | null>(null)
const showHints = ref(false)

/** 正文媒体上传状态：null 表示空闲；percent 为 0-100，供按钮上直接显示进度 */
const mediaUpload = ref<{ kind: 'image' | 'video'; percent: number } | null>(null)
const mediaError = ref('')

/** 视图模式：并排 / 仅源码 / 仅预览。写作区宽度是长文编辑最实际的瓶颈，给「仅源码」一个全宽模式。 */
type ViewMode = 'both' | 'source' | 'preview'
const VIEW_MODE_KEY = 'stewie:editor:view-mode'
const viewMode = ref<ViewMode>('both')

const today = () => new Date().toISOString().slice(0, 10)

// ── 实时预览：直接渲染 HTML 源码，与文章页 .article-content 同源 ──
// 正文以 HTML 存储/渲染，编辑器即「HTML 源码 + 所见即所得预览」。
// 代码块内容先转义：粘贴含 <script>/<div> 等标签的代码不会被解析成真实 DOM（与文章页一致）。
const previewRef = ref<HTMLElement | null>(null)
const previewPane = ref<HTMLElement | null>(null)
const { renderedContent, syncEnabled, onSourceScroll, onPreviewScroll, followCursor, revealCursor, refreshSync, captureSyncPosition } =
  useEditorScrollSync(content, contentInput, previewPane, previewRef)
const focused = ref(false)
const compact = ref(false)
const toolbarRef = ref<HTMLElement | null>(null)
const toolbarHeight = ref(48)
let toolbarObserver: ResizeObserver | undefined
let compactQuery: MediaQueryList | undefined
const updateCompact = () => { compact.value = compactQuery?.matches ?? false }
onMounted(() => { compactQuery = window.matchMedia('(max-width: 900px)'); updateCompact(); compactQuery.addEventListener('change', updateCompact) })
onBeforeUnmount(() => compactQuery?.removeEventListener('change', updateCompact))
onMounted(() => {
  toolbarObserver = new ResizeObserver(() => { toolbarHeight.value = toolbarRef.value?.offsetHeight ?? 48 })
  if (toolbarRef.value) toolbarObserver.observe(toolbarRef.value)
})
onBeforeUnmount(() => toolbarObserver?.disconnect())
watch(viewMode, async () => { captureSyncPosition(); await nextTick(); refreshSync() })

// ── 工具栏：在光标处插入统一格式的 HTML 结构 ──
/**
 * 把一段 HTML 片段插到光标处。
 * 块级片段前后补换行，保证 HTML 源码结构清晰、可维护；插入后选中 selStart~selEnd，
 * 让用户可以直接改占位文字（如图注）。
 */
function insertSnippet(text: string, selStart: number, selEnd: number, blockLevel: boolean) {
  const ta = contentInput.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const before = content.value.slice(0, start)
  const after = content.value.slice(end)

  let insertText = text
  let addedLead = false
  if (blockLevel) {
    if (before && !before.endsWith('\n')) {
      insertText = '\n' + insertText
      addedLead = true
    }
    if (after && !after.startsWith('\n')) {
      insertText = insertText + '\n'
    }
  }
  const base = before.length + (addedLead ? 1 : 0)
  content.value = before + insertText + after
  nextTick(() => {
    ta.focus({ preventScroll: true })
    ta.setSelectionRange(base + selStart, base + selEnd)
    revealCursor()
  })
}

function insertFormat(kind: BlockKind) {
  const ta = contentInput.value
  if (!ta) return
  const selected = content.value.slice(ta.selectionStart, ta.selectionEnd)
  const { text, selStart, selEnd } = buildBlock(kind, selected)
  insertSnippet(text, selStart, selEnd, BLOCK_LEVEL.includes(kind))
}

// ── 正文媒体：选文件 → 上传到 COS → 自动插入标签 ──
function pickImage() {
  if (mediaUpload.value) return
  mediaError.value = ''
  imageInput.value?.click()
}

function pickVideo() {
  if (mediaUpload.value) return
  mediaError.value = ''
  videoInput.value?.click()
}

async function onMediaPicked(e: Event, kind: 'image' | 'video') {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  mediaError.value = ''
  mediaUpload.value = { kind, percent: 0 }
  try {
    const res = await uploadFile(file, {
      type: kind,
      onProgress: (percent) => {
        if (mediaUpload.value) mediaUpload.value.percent = percent
      },
    })
    if (kind === 'video') {
      const { text, selStart, selEnd } = buildVideoBlock(res.url)
      insertSnippet(text, selStart, selEnd, true)
    } else {
      // alt 用文件名去掉扩展名兜底，总比留空强（SEO 与无障碍都吃这个）
      const { text, selStart, selEnd } = buildImageBlock(res.url, suggestAlt(file.name))
      insertSnippet(text, selStart, selEnd, true)
    }
  } catch (err) {
    mediaError.value = err instanceof Error ? err.message : '上传失败'
  } finally {
    mediaUpload.value = null
    target.value = '' // 清空以便同一文件可再次选择
  }
}

// 格式提示：结构说明 → 渲染效果（数据来自 blocks.ts，单一事实来源）
const blockHints = BLOCK_HINTS

// 视图模式：记住上次选择；首次进入时窄屏默认只留源码（并排会挤成两条窄柱）
onMounted(() => {
  let saved: string | null = null
  try { saved = localStorage.getItem(VIEW_MODE_KEY) } catch { /* Storage may be disabled. */ }
  if (saved === 'both' || saved === 'source' || saved === 'preview') {
    viewMode.value = saved
  } else if (window.innerWidth < 1100) {
    viewMode.value = 'source'
  }
})
watch(viewMode, (v) => { try { localStorage.setItem(VIEW_MODE_KEY, v) } catch { /* Keep the active mode in memory. */ } })

onMounted(async () => {
  try {
    categories.value = await getCategories()
  } catch {
    categories.value = []
  }
  if (isEdit.value) {
    try {
      const p = await getAdminPost(Number(props.id))
      title.value = p.title
      slug.value = p.slug
      excerpt.value = p.excerpt || ''
      content.value = p.content
      cover.value = p.cover || ''
      // 后端 PostVO 不带 categoryId，这里用分类名反查
      const cat = categories.value.find((c) => c.name === p.category)
      categoryId.value = cat ? cat.id : null
      tagsInput.value = (p.tags || []).join(', ')
      status.value = p.status ?? 1
      publishDate.value = p.date || today()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载文章失败'
    }
  } else {
    publishDate.value = today()
  }
})

function pickFile() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    uploadError.value = '请选择图片文件'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = '图片不能超过 5MB'
    return
  }
  uploadError.value = ''
  uploading.value = true
  try {
    const res = await uploadCover(file)
    cover.value = res.url
  } catch (err) {
    uploadError.value = err instanceof Error ? err.message : '上传失败'
  } finally {
    uploading.value = false
    target.value = ''
  }
}

function removeCover() {
  cover.value = ''
}

// ── AI 生成摘要 ──
async function aiGenerateExcerpt() {
  if (!content.value.trim()) {
    error.value = '请先填写正文，再生成摘要'
    return
  }
  generating.value = true
  error.value = ''
  try {
    const res = await generateExcerpt(title.value.trim(), content.value)
    excerpt.value = res.excerpt
  } catch (e) {
    error.value = e instanceof Error ? e.message : '摘要生成失败'
  } finally {
    generating.value = false
  }
}

async function save() {
  error.value = ''
  if (!title.value.trim()) {
    error.value = '请填写标题'
    return
  }
  if (!content.value.trim()) {
    error.value = '请填写正文'
    return
  }
  const input: PostInput = {
    title: title.value.trim(),
    slug: slug.value.trim(),
    excerpt: excerpt.value.trim(),
    content: content.value.trim(),
    cover: cover.value || undefined,
    categoryId: categoryId.value,
    tags: tagsInput.value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    status: status.value,
    publishDate: publishDate.value || undefined,
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updatePost(Number(props.id), input)
    } else {
      await createPost(input)
    }
    router.push('/admin/posts')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="post-editor" :class="{ 'post-editor--focused': focused }" :style="{ '--editor-toolbar-height': `${toolbarHeight}px` }">
    <div class="admin-pagehead editor-pagehead">
      <div>
        <h1 class="admin-pagehead__title">{{ isEdit ? '编辑文章' : '写新文章' }}</h1>
        <p class="admin-pagehead__sub">{{ isEdit ? '修改已有文章内容' : '创建并发布一篇新文章' }}</p>
      </div>
      <div class="admin-pagehead__actions">
        <button type="button" class="btn btn--subtle btn--md" :aria-pressed="focused" @click="focused = !focused">{{ focused ? '退出专注' : '专注写作' }}</button>
        <button class="btn btn--primary btn--md" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : status === 0 ? '保存草稿' : isEdit ? '保存修改' : '发布文章' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="admin-alert admin-alert--error" role="alert">{{ error }}</div>

    <div class="editor-grid">
      <div class="editor-main">
        <div class="admin-panel">
          <div class="admin-panel__body" style="padding: 16px 20px">
            <div class="field">
              <label class="field__label">标题 *</label>
              <input v-model="title" class="field__control" placeholder="文章标题" />
            </div>
            <div class="field" style="margin-top: 14px">
              <label class="field__label">URL 路径（slug）</label>
              <input v-model="slug" class="field__control" placeholder="留空则自动生成，如 post-ab12cd" />
            </div>
            <div class="field" style="margin-top: 14px">
              <label class="field__label">
                摘要
                <button type="button" class="md-hint-toggle" :disabled="generating" @click="aiGenerateExcerpt">
                  {{ generating ? '生成中…' : 'AI 生成' }}
                </button>
              </label>
              <textarea v-model="excerpt" class="field__control" rows="2"
                placeholder="一句话摘要，显示在列表卡片上" />
            </div>
            <div class="field" style="margin-top: 14px">
              <label class="field__label">
                正文 *（HTML，与文章页渲染一致）
                <button type="button" class="md-hint-toggle" @click="showHints = !showHints">
                  {{ showHints ? '收起格式说明' : '格式说明' }}
                </button>
              </label>

              <!-- 工具栏：插入统一格式的 HTML 结构 -->
              <div ref="toolbarRef" class="md-toolbar" role="group" aria-label="正文插入工具">
                <button type="button" class="md-tool" title="加粗" @click="insertFormat('bold')"><b>B</b></button>
                <button type="button" class="md-tool" title="斜体" @click="insertFormat('italic')"><i>I</i></button>
                <span class="md-tool__sep" />
                <button type="button" class="md-tool" title="H2 主标题" @click="insertFormat('h2')">H2</button>
                <button type="button" class="md-tool" title="H3 子标题" @click="insertFormat('h3')">H3</button>
                <span class="md-tool__sep" />
                <button type="button" class="md-tool" title="代码块" @click="insertFormat('codeBlock')">&lt;/&gt;</button>
                <button type="button" class="md-tool" title="行内代码" @click="insertFormat('inlineCode')">&lt;&gt;</button>
                <span class="md-tool__sep" />
                <button type="button" class="md-tool" title="链接" @click="insertFormat('link')">链接</button>
                <button
                  type="button"
                  class="md-tool"
                  :title="mediaUpload?.kind === 'image' ? '图片上传中…' : '插入图片（选文件即上传，≤5MB）'"
                  :disabled="!!mediaUpload"
                  @click="pickImage"
                >
                  {{ mediaUpload?.kind === 'image' ? `${mediaUpload.percent}%` : '图片' }}
                </button>
                <button
                  type="button"
                  class="md-tool"
                  :title="mediaUpload?.kind === 'video' ? '视频上传中…' : '插入视频（选文件即上传，≤100MB）'"
                  :disabled="!!mediaUpload"
                  @click="pickVideo"
                >
                  {{ mediaUpload?.kind === 'video' ? `${mediaUpload.percent}%` : '视频' }}
                </button>
                <span class="md-tool__sep" />
                <button type="button" class="md-tool" title="列表（要点加粗）" @click="insertFormat('list')">☰</button>
                <button type="button" class="md-tool" title="引用" @click="insertFormat('quote')">引用</button>
                <button type="button" class="md-tool" title="分割线" @click="insertFormat('hr')">—</button>

                <span class="md-tool__spacer" />
                <button type="button" class="md-sync" :aria-pressed="syncEnabled" @click="syncEnabled = !syncEnabled">{{ syncEnabled ? '同步滚动：开' : '同步滚动：关' }}</button>
                <!-- 视图模式：长文写作时切「源码」可拿回全部宽度 -->
                <div class="md-view" role="group" aria-label="编辑区视图模式">
                  <button type="button" :class="{ 'is-active': viewMode === 'both' }" @click="viewMode = 'both'">并排</button>
                  <button type="button" :class="{ 'is-active': viewMode === 'source' }" @click="viewMode = 'source'">源码</button>
                  <button type="button" :class="{ 'is-active': viewMode === 'preview' }" @click="viewMode = 'preview'">预览</button>
                </div>
              </div>

              <!-- 分栏：编辑 + 实时预览（视图模式可切换，「源码」模式占满全宽） -->
              <div class="md-split" :class="`md-split--${viewMode}`">
                <textarea
                  ref="contentInput"
                  v-model="content"
                  class="md-input"
                  :inert="viewMode === 'preview'"
                  placeholder="在此用 HTML 撰写正文…&#10;&#10;<h2>主标题</h2>&#10;<p>段落文字</p>&#10;<ul><li><strong>要点</strong>说明</li></ul>&#10;&#10;图片/视频点工具栏 🖼️ 🎬 选文件即上传并插入"
                  aria-label="文章 HTML 源码"
                  @scroll="onSourceScroll"
                  @click="followCursor"
                  @keyup="followCursor"
                  spellcheck="false"
                />
                <div ref="previewPane" class="md-preview" :inert="viewMode === 'source' || (viewMode === 'both' && compact)" role="region" aria-label="文章实时预览" tabindex="0" @scroll="onPreviewScroll">
                  <div v-if="renderedContent" ref="previewRef" class="article-content md-preview__body" v-html="renderedContent" />
                  <div v-else class="md-preview__empty">实时预览将显示在这里…</div>
                </div>
              </div>

              <!-- 正文媒体上传：两个隐藏 file input，由工具栏按钮触发 -->
              <input ref="imageInput" type="file" accept="image/*" hidden @change="onMediaPicked($event, 'image')" />
              <input ref="videoInput" type="file" accept="video/*" hidden @change="onMediaPicked($event, 'video')" />

              <p v-if="mediaError" class="field__hint field__hint--err">⚠️ {{ mediaError }}</p>

              <!-- 格式说明面板 -->
              <div v-if="showHints" class="md-hints">
                <p class="md-hints__tip">正文为 HTML（与文章页渲染完全一致），常用结构与预览效果：</p>
                <div v-for="h in blockHints" :key="h.label" class="md-hint">
                  <code class="md-hint__syntax">{{ h.sample }}</code>
                  <span class="md-hint__desc">{{ h.label }}</span>
                  <div class="md-hint__render article-content" v-html="h.sample" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="editor-side">
        <div class="admin-panel">
          <div class="admin-panel__head"><span class="admin-panel__title">封面图</span></div>
          <div class="admin-panel__body">
            <div v-if="cover" class="cover-preview">
              <img :src="resolveAsset(cover)" alt="封面预览" />
              <button class="cover-preview__del" @click="removeCover">移除</button>
            </div>
            <button class="btn btn--subtle btn--md" style="width: 100%" :disabled="uploading" @click="pickFile">
              {{ uploading ? '上传中…' : '上传封面图' }}
            </button>
            <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
            <p v-if="uploadError" class="field__hint field__hint--err">{{ uploadError }}</p>
            <p class="field__hint">建议横向图片，≤5MB，自动生成访问地址。</p>
          </div>
        </div>

        <div class="admin-panel">
          <div class="admin-panel__head"><span class="admin-panel__title">发布设置</span></div>
          <div class="admin-panel__body">
            <div class="field">
              <label class="field__label">分类</label>
              <select v-model.number="categoryId" class="field__control">
                <option :value="null">未分类</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="field" style="margin-top: 14px">
              <label class="field__label">标签（逗号分隔）</label>
              <input v-model="tagsInput" class="field__control" placeholder="Vue, TypeScript" />
            </div>
            <div class="field" style="margin-top: 14px">
              <label class="field__label">发布日期</label>
              <input v-model="publishDate" type="date" class="field__control" />
            </div>
            <div class="field" style="margin-top: 14px">
              <span class="field__label">状态</span>
              <div class="seg">
                <button :class="{ 'is-active': status === 1 }" @click="status = 1">已发布</button>
                <button :class="{ 'is-active': status === 0 }" @click="status = 0">草稿</button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
/* ── HTML 编辑器 ── */
.md-hint-toggle {
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
}
.md-toolbar {
  position: sticky;
  top: 128px;
  z-index: 12;
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* 窄屏换行而不是溢出 */
  gap: 4px;
  padding: 8px 10px;
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-bottom: none;
  border-radius: var(--radius) var(--radius) 0 0;
}
.md-tool {
  min-width: 32px;
  height: 30px;
  padding: 0 8px;
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 7px;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.md-tool:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.md-tool:disabled {
  opacity: 0.6;
  cursor: progress;
}
.md-tool__sep {
  width: 1px;
  height: 18px;
  background: var(--color-border);
  margin: 0 3px;
}
.md-tool__spacer {
  flex: 1;
  min-width: 8px;
}
/* 视图模式切换（并排 / 源码 / 预览） */
.md-view {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}
.md-view button {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.md-view button:hover {
  color: var(--color-primary);
}
.md-view button.is-active {
  color: var(--color-primary);
  font-weight: 600;
  background: var(--color-primary-soft);
}
.md-split {
  position: relative;
  scroll-margin-top: calc(128px + var(--editor-toolbar-height, 48px));
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: clamp(360px, 66vh, 900px);
  min-height: 0;
  border: 1px solid var(--color-border);
  border-radius: 0 0 var(--radius) var(--radius);
  overflow: hidden;
}
/* 仅源码 / 仅预览：单列占满，把宽度还给正在写的那一侧 */
.md-split--source,
.md-split--preview {
  grid-template-columns: 1fr;
}
.md-split--source .md-preview,
.md-split--preview .md-input {
  visibility: hidden;
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.md-split--source .md-input {
  border-right: none;
}
.md-input {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 16px;
  border: none;
  outline: none;
  resize: none;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}
.md-preview {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow-wrap: anywhere;
  padding: 16px 18px;
  overflow-y: auto;
  background: var(--color-surface);
}
.md-preview__empty {
  color: var(--color-text-tertiary);
  font-size: 13px;
}
/* 预览区直接复用全局 .article-content 样式，保证与文章页渲染一致（单一事实来源） */

/* ── 格式提示面板 ── */
.md-hints {
  margin-top: 12px;
  padding: 14px 16px;
  background: var(--color-bg-soft);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
}
.md-hints__tip {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.md-hint {
  display: grid;
  grid-template-columns: 180px 1fr;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--color-border);
}
.md-hint:first-of-type { border-top: none; }
.md-hint__syntax {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-code, #d63384);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 5px 8px;
  white-space: pre-wrap;
  word-break: break-all;
}
.md-hint__desc {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.md-hint__render {
  grid-column: 2;
  margin-top: -2px;
  font-size: 13px;
  line-height: 1.7;
}

.cover-preview {
  position: relative;
  margin-bottom: 10px;
}
.cover-preview img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}
.cover-preview__del {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* 窄屏：并排模式退化为只显示源码（预览仍可用「预览」按钮单独查看） */
@media (max-width: 900px) {
  .md-split--both {
    grid-template-columns: 1fr;
  }
  .md-split--both .md-preview {
    visibility: hidden;
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .md-split--both .md-input {
    border-right: none;
  }
  .md-view button {
    padding: 4px 8px;
  }
}
</style>

<style scoped>
.editor-pagehead { position: sticky; top: 60px; z-index: 15; background: var(--color-bg-soft); padding: 12px 0; align-items: center; min-height: 68px; }
.md-input, .md-preview { overscroll-behavior: contain; scrollbar-gutter: stable; scroll-behavior: auto; }
.md-sync { border: 0; background: transparent; padding: 6px; color: var(--color-text-secondary); font-size: 12px; cursor: pointer; }
.md-sync[aria-pressed="true"] { color: var(--color-primary); }
.post-editor--focused .editor-side { display: none; }
.post-editor--focused .editor-grid { grid-template-columns: minmax(0, 1fr); }
.post-editor--focused .editor-main > .admin-panel > .admin-panel__body > .field:not(:last-child) { display: none; }
.post-editor--focused .md-split { height: calc(100dvh - 270px); min-height: 320px; }
@media (max-width: 1100px) { .editor-grid { grid-template-columns: minmax(0, 1fr); } .editor-side { display: grid; grid-template-columns: 1fr 1fr; } }
@media (max-width: 1100px) { .editor-pagehead { top: 52px; min-height: 76px; } }
@media (max-width: 600px) {
  .editor-pagehead { top: 52px; min-height: 76px; gap: 8px; }
  .editor-pagehead .admin-pagehead__sub { display: none; }
  .editor-pagehead .admin-pagehead__title { font-size: 20px; }
  .editor-pagehead .btn { padding: 0 10px; font-size: 12px; }
  .md-toolbar { top: 128px; gap: 3px; padding: 6px; }
  .md-tool { min-width: 30px; padding: 0 5px; }
  .md-tool__sep { margin: 0 1px; }
  .md-split { height: 58dvh; min-height: 300px; }
  .editor-side { grid-template-columns: 1fr; }
  .md-hint { grid-template-columns: 1fr; }
  .md-hint__render { grid-column: 1; }
}
</style>
