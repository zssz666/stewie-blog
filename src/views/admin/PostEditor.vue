<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Category, PostInput } from '@/types/blog'
import { createPost, getAdminPost, updatePost, uploadCover } from '@/api/admin'
import { getCategories } from '@/api/post'

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

const today = () => new Date().toISOString().slice(0, 10)

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
    router.push('/admin')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="editor">
    <header class="editor__head">
      <h1 class="editor__title">{{ isEdit ? '编辑文章' : '写新文章' }}</h1>
      <button class="editor__save" :disabled="saving" @click="save">
        {{ saving ? '保存中…' : isEdit ? '保存修改' : '发布文章' }}
      </button>
    </header>

    <p v-if="error" class="editor__error">{{ error }}</p>

    <div class="editor__grid">
      <div class="editor__main">
        <label class="field">
          <span class="field__label">标题 *</span>
          <input v-model="title" class="field__input" placeholder="文章标题" />
        </label>

        <label class="field">
          <span class="field__label">URL 路径（slug）</span>
          <input v-model="slug" class="field__input" placeholder="留空则自动生成，如 post-ab12cd" />
        </label>

        <label class="field">
          <span class="field__label">摘要</span>
          <textarea v-model="excerpt" class="field__input field__textarea" rows="2"
            placeholder="一句话摘要，显示在列表卡片上" />
        </label>

        <label class="field">
          <span class="field__label">正文 *（支持 HTML）</span>
          <textarea v-model="content" class="field__input field__textarea field__content"
            placeholder="<p>正文内容…</p>" />
        </label>
      </div>

      <aside class="editor__side">
        <div class="panel">
          <h3 class="panel__title">封面图</h3>
          <div v-if="cover" class="cover-preview">
            <img :src="cover" alt="封面预览" />
            <button class="cover-preview__del" @click="removeCover">移除</button>
          </div>
          <button class="cover-pick" :disabled="uploading" @click="pickFile">
            {{ uploading ? '上传中…' : '上传封面图' }}
          </button>
          <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
          <p v-if="uploadError" class="panel__hint panel__hint--err">{{ uploadError }}</p>
          <p class="panel__hint">建议横向图片，≤5MB，自动生成访问地址。</p>
        </div>

        <div class="panel">
          <h3 class="panel__title">发布设置</h3>
          <label class="field">
            <span class="field__label">分类</span>
            <select v-model.number="categoryId" class="field__input">
              <option :value="null">未分类</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>

          <label class="field">
            <span class="field__label">标签（逗号分隔）</span>
            <input v-model="tagsInput" class="field__input" placeholder="Vue, TypeScript" />
          </label>

          <label class="field">
            <span class="field__label">发布日期</span>
            <input v-model="publishDate" type="date" class="field__input" />
          </label>

          <div class="field">
            <span class="field__label">状态</span>
            <div class="seg">
              <button :class="{ on: status === 1 }" @click="status = 1">已发布</button>
              <button :class="{ on: status === 0 }" @click="status = 0">草稿</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.editor {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
}
.editor__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.editor__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-heading);
  font-family: var(--font-serif);
}
.editor__save {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: 10px;
  cursor: pointer;
}
.editor__save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.editor__error {
  margin-bottom: 14px;
  padding: 10px 12px;
  font-size: 13px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
}
.editor__grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
}
.editor__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.field__input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 9px;
}
.field__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft, rgba(37, 99, 235, 0.15));
}
.field__textarea {
  resize: vertical;
  line-height: 1.6;
}
.field__content {
  min-height: 280px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
}
.editor__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel {
  padding: 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.panel__title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-heading);
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
.cover-pick {
  width: 100%;
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-surface);
  border: 1px dashed var(--color-primary);
  border-radius: 9px;
  cursor: pointer;
}
.cover-pick:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.panel__hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  line-height: 1.5;
}
.panel__hint--err {
  color: #ef4444;
}
.seg {
  display: flex;
  gap: 8px;
}
.seg button {
  flex: 1;
  padding: 9px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
}
.seg button.on {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
@media (max-width: 860px) {
  .editor__grid {
    grid-template-columns: 1fr;
  }
}
</style>
