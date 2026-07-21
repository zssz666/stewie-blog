<script setup lang="ts">
import { onMounted, ref, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Category, PostInput } from '@/types/blog'
import { buildBlock, BLOCK_LEVEL, BLOCK_HINTS, type BlockKind } from '@/editor/blocks'
import { enhanceCodeBlocks } from '@/utils/article'
import { createPost, getAdminPost, updatePost, uploadCover, generateExcerpt } from '@/api/admin'
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
const contentInput = ref<HTMLTextAreaElement | null>(null)
const showHints = ref(false)

const today = () => new Date().toISOString().slice(0, 10)

// ── 实时预览：直接渲染 HTML 源码，与文章页 .article-content 同源 ──
// 正文以 HTML 存储/渲染，编辑器即「HTML 源码 + 所见即所得预览」。
const renderedContent = computed(() => content.value)

const previewRef = ref<HTMLElement | null>(null)
// 内容变化后重新增强代码块（macOS 窗口装饰 + 复制按钮），与文章页一致
watch(
  renderedContent,
  () => {
    nextTick(() => {
      if (previewRef.value) enhanceCodeBlocks(previewRef.value)
    })
  },
  { flush: 'post' },
)

// ── 工具栏：在光标处插入统一格式的 HTML 结构 ──
function insertFormat(kind: BlockKind) {
  const ta = contentInput.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = content.value.slice(start, end)
  const { text, selStart, selEnd } = buildBlock(kind, selected)

  // 块级元素前后补换行，保证 HTML 源码结构清晰、可维护
  const before = content.value.slice(0, start)
  const after = content.value.slice(end)
  let insertText = text
  let addedLead = false
  if (BLOCK_LEVEL.includes(kind)) {
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
    ta.focus()
    ta.setSelectionRange(base + selStart, base + selEnd)
  })
}

// 格式提示：结构说明 → 渲染效果（数据来自 blocks.ts，单一事实来源）
const blockHints = BLOCK_HINTS

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
  <section>
    <div class="admin-pagehead">
      <div>
        <h1 class="admin-pagehead__title">{{ isEdit ? '编辑文章' : '写新文章' }}</h1>
        <p class="admin-pagehead__sub">{{ isEdit ? '修改已有文章内容' : '创建并发布一篇新文章' }}</p>
      </div>
      <div class="admin-pagehead__actions">
        <button class="btn btn--primary btn--md" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : isEdit ? '保存修改' : '发布文章' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="admin-alert admin-alert--error">⚠️ {{ error }}</div>

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
                  {{ generating ? '生成中…' : '✨ AI 生成' }}
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
              <div class="md-toolbar">
                <button type="button" class="md-tool" title="加粗" @click="insertFormat('bold')"><b>B</b></button>
                <button type="button" class="md-tool" title="斜体" @click="insertFormat('italic')"><i>I</i></button>
                <span class="md-tool__sep" />
                <button type="button" class="md-tool" title="H2 主标题" @click="insertFormat('h2')">H2</button>
                <button type="button" class="md-tool" title="H3 子标题" @click="insertFormat('h3')">H3</button>
                <span class="md-tool__sep" />
                <button type="button" class="md-tool" title="代码块" @click="insertFormat('codeBlock')">&lt;/&gt;</button>
                <button type="button" class="md-tool" title="行内代码" @click="insertFormat('inlineCode')">&lt;&gt;</button>
                <span class="md-tool__sep" />
                <button type="button" class="md-tool" title="链接" @click="insertFormat('link')">🔗</button>
                <button type="button" class="md-tool" title="图片" @click="insertFormat('image')">🖼️</button>
                <span class="md-tool__sep" />
                <button type="button" class="md-tool" title="列表（要点加粗）" @click="insertFormat('list')">☰</button>
                <button type="button" class="md-tool" title="引用" @click="insertFormat('quote')">❝</button>
                <button type="button" class="md-tool" title="分割线" @click="insertFormat('hr')">➖</button>
              </div>

              <!-- 分栏：编辑 + 实时预览 -->
              <div class="md-split">
                <textarea
                  ref="contentInput"
                  v-model="content"
                  class="md-input"
                  placeholder="在此用 HTML 撰写正文…&#10;&#10;<h2>主标题</h2>&#10;<p>段落文字</p>&#10;<ul><li><strong>要点</strong>说明</li></ul>"
                  spellcheck="false"
                />
                <div class="md-preview">
                  <div v-if="renderedContent" ref="previewRef" class="article-content md-preview__body" v-html="renderedContent" />
                  <div v-else class="md-preview__empty">实时预览将显示在这里…</div>
                </div>
              </div>

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
/* ── Markdown 编辑器 ── */
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
  display: flex;
  align-items: center;
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
.md-tool__sep {
  width: 1px;
  height: 18px;
  background: var(--color-border);
  margin: 0 3px;
}
.md-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 340px;
  border: 1px solid var(--color-border);
  border-radius: 0 0 var(--radius) var(--radius);
  overflow: hidden;
}
.md-input {
  width: 100%;
  min-height: 340px;
  padding: 16px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}
.md-preview {
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
</style>
