<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import type { Category, PostInput } from '@/types/blog'
import { createPost, getAdminPost, updatePost, uploadCover } from '@/api/admin'
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
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const contentInput = ref<HTMLTextAreaElement | null>(null)
const showHints = ref(false)

const today = () => new Date().toISOString().slice(0, 10)

// ── Markdown 实时预览 ──
function renderMd(src: string): string {
  return marked.parse(src, { gfm: true, breaks: true }) as string
}
const renderedContent = computed(() => {
  if (!content.value.trim()) return ''
  return renderMd(content.value)
})

// ── 工具栏：在光标处插入 Markdown 语法 ──
type FmtType = 'bold' | 'italic' | 'h3' | 'code' | 'inlinecode' | 'link' | 'image' | 'list' | 'quote'
function insertFormat(type: FmtType) {
  const ta = contentInput.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = content.value.slice(start, end)
  const cfg: Record<FmtType, { before: string; after: string; placeholder: string }> = {
    bold: { before: '**', after: '**', placeholder: '加粗文字' },
    italic: { before: '*', after: '*', placeholder: '斜体文字' },
    h3: { before: '\n### ', after: '', placeholder: '小标题' },
    code: { before: '\n```\n', after: '\n```\n', placeholder: '在此粘贴代码' },
    inlinecode: { before: '`', after: '`', placeholder: '行内代码' },
    link: { before: '[', after: '](https://)', placeholder: '链接文字' },
    image: { before: '![', after: '](https://)', placeholder: '图片描述' },
    list: { before: '\n- ', after: '', placeholder: '列表项' },
    quote: { before: '\n> ', after: '', placeholder: '引用内容' },
  }
  const { before, after, placeholder } = cfg[type]
  const text = selected || placeholder
  const insertText = before + text + after
  content.value = content.value.slice(0, start) + insertText + content.value.slice(end)
  nextTick(() => {
    ta.focus()
    const pos = start + before.length + text.length
    ta.setSelectionRange(pos, pos)
  })
}

// 格式提示：语法 → 说明 → 渲染效果
const hints: { syntax: string; desc: string; sample: string }[] = [
  { syntax: '### 标题', desc: '三级标题（小标题）', sample: '### 这是小标题' },
  { syntax: '**加粗** / *斜体*', desc: '强调文字', sample: '**重要** 与 *轻读*' },
  { syntax: '`行内代码`', desc: '行内等宽代码', sample: '使用 `npm run dev`' },
  { syntax: '``` 代码块 ```', desc: '多行代码块', sample: '```\nconst a = 1\n```' },
  { syntax: '[文字](url)', desc: '超链接', sample: '[Stewie](https://stewie.fun)' },
  { syntax: '![alt](url)', desc: '图片', sample: '![封面](https://x/y.png)' },
  { syntax: '- 列表项', desc: '无序列表', sample: '- 第一项\n- 第二项' },
  { syntax: '> 引用', desc: '块引用', sample: '> 一句话总结' },
]

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
              <label class="field__label">摘要</label>
              <textarea v-model="excerpt" class="field__control" rows="2"
                placeholder="一句话摘要，显示在列表卡片上" />
            </div>
            <div class="field" style="margin-top: 14px">
              <label class="field__label">
                正文 *（Markdown）
                <button type="button" class="md-hint-toggle" @click="showHints = !showHints">
                  {{ showHints ? '收起格式提示' : '格式提示' }}
                </button>
              </label>

              <!-- Markdown 工具栏 -->
              <div class="md-toolbar">
                <button type="button" class="md-tool" title="加粗" @click="insertFormat('bold')"><b>B</b></button>
                <button type="button" class="md-tool" title="斜体" @click="insertFormat('italic')"><i>I</i></button>
                <span class="md-tool__sep" />
                <button type="button" class="md-tool" title="H3 小标题" @click="insertFormat('h3')">H3</button>
                <button type="button" class="md-tool" title="代码块" @click="insertFormat('code')">&lt;/&gt;</button>
                <button type="button" class="md-tool" title="行内代码" @click="insertFormat('inlinecode')">&lt;&gt;</button>
                <span class="md-tool__sep" />
                <button type="button" class="md-tool" title="链接" @click="insertFormat('link')">🔗</button>
                <button type="button" class="md-tool" title="图片" @click="insertFormat('image')">🖼️</button>
                <span class="md-tool__sep" />
                <button type="button" class="md-tool" title="列表" @click="insertFormat('list')">☰</button>
                <button type="button" class="md-tool" title="引用" @click="insertFormat('quote')">❝</button>
              </div>

              <!-- 分栏：编辑 + 实时预览 -->
              <div class="md-split">
                <textarea
                  ref="contentInput"
                  v-model="content"
                  class="md-input"
                  placeholder="在此用 Markdown 撰写正文…\n\n### 小标题\n**加粗**、*斜体*、`代码`\n```\n代码块\n```"
                  spellcheck="false"
                />
                <div class="md-preview">
                  <div v-if="renderedContent" class="md-preview__body" v-html="renderedContent" />
                  <div v-else class="md-preview__empty">实时预览将显示在这里…</div>
                </div>
              </div>

              <!-- 格式提示面板 -->
              <div v-if="showHints" class="md-hints">
                <p class="md-hints__tip">常用 Markdown 语法与渲染效果：</p>
                <div v-for="h in hints" :key="h.syntax" class="md-hint">
                  <code class="md-hint__syntax">{{ h.syntax }}</code>
                  <span class="md-hint__desc">{{ h.desc }}</span>
                  <span class="md-hint__render" v-html="renderMd(h.sample)" />
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
.md-preview__body {
  font-size: 14px;
  line-height: 1.75;
  color: var(--color-text);
}
.md-preview__body :deep(h1),
.md-preview__body :deep(h2),
.md-preview__body :deep(h3) {
  margin: 14px 0 8px;
  font-family: var(--font-serif);
  color: var(--color-heading);
  line-height: 1.3;
}
.md-preview__body :deep(h1) { font-size: 22px; }
.md-preview__body :deep(h2) { font-size: 19px; }
.md-preview__body :deep(h3) { font-size: 16px; }
.md-preview__body :deep(p) { margin: 8px 0; }
.md-preview__body :deep(a) { color: var(--color-primary); }
.md-preview__body :deep(ul),
.md-preview__body :deep(ol) { padding-left: 22px; margin: 8px 0; }
.md-preview__body :deep(li) { margin: 3px 0; }
.md-preview__body :deep(blockquote) {
  margin: 10px 0;
  padding: 6px 14px;
  border-left: 3px solid var(--color-primary);
  color: var(--color-text-secondary);
  background: var(--color-bg-soft);
  border-radius: 0 var(--radius) var(--radius) 0;
}
.md-preview__body :deep(code) {
  font-family: var(--font-mono);
  font-size: 12.5px;
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--color-bg-soft);
  color: var(--color-code, #d63384);
}
.md-preview__body :deep(pre) {
  margin: 10px 0;
  padding: 14px 16px;
  border-radius: var(--radius);
  background: var(--color-bg-inverse, #1e293b);
  overflow-x: auto;
}
.md-preview__body :deep(pre code) {
  padding: 0;
  background: transparent;
  color: #e2e8f0;
  font-size: 12.5px;
}
.md-preview__body :deep(img) {
  max-width: 100%;
  border-radius: var(--radius);
  margin: 8px 0;
}

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
  font-size: 13px;
  color: var(--color-text);
  margin-top: -2px;
}
.md-hint__render :deep(code) {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--color-bg);
  color: var(--color-code, #d63384);
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
