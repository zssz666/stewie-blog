// 文章正文排版的唯一事实来源（Single Source of Truth）。
// 编辑器工具栏、实时预览、格式提示面板均从这里取规则，
// 保证「写」与「编辑」两种场景下插入的结构完全一致，
// 且与文章页 .article-content 的渲染规则对齐。

export type BlockKind =
  | 'h2'
  | 'h3'
  | 'bold'
  | 'italic'
  | 'inlineCode'
  | 'codeBlock'
  | 'list'
  | 'quote'
  | 'link'
  | 'hr'

export interface Insertion {
  text: string
  selStart: number
  selEnd: number
}

const make = (openTag: string, closeTag: string, inner: string): Insertion => ({
  text: openTag + inner + closeTag,
  selStart: openTag.length,
  selEnd: openTag.length + inner.length,
})

/** 根据所选文本生成对应 HTML 片段；空选区时使用占位文字，便于直接覆盖输入。 */
export function buildBlock(kind: BlockKind, selected: string): Insertion {
  switch (kind) {
    case 'h2':
      return make('<h2>', '</h2>', selected || '主标题')
    case 'h3':
      return make('<h3>', '</h3>', selected || '子标题')
    case 'bold':
      return make('<strong>', '</strong>', selected || '加粗文字')
    case 'italic':
      return make('<em>', '</em>', selected || '斜体文字')
    case 'inlineCode':
      return make('<code>', '</code>', selected || '代码')
    case 'quote':
      return make('<blockquote>', '</blockquote>', selected || '一句话总结')
    case 'codeBlock': {
      const inner = selected || '// 在此粘贴代码'
      const open = '<pre><code class="language-js">\n'
      const close = '\n</code></pre>'
      return { text: open + inner + close, selStart: open.length, selEnd: open.length + inner.length }
    }
    case 'list': {
      const inner = selected || '列表项说明'
      const open = '<ul>\n  <li><strong>'
      const kw = '要点'
      const close = `</strong>${inner}</li>\n</ul>`
      return { text: open + kw + close, selStart: open.length, selEnd: open.length + kw.length }
    }
    case 'link': {
      const inner = selected || '链接文字'
      const text = `<a href="https://">${inner}</a>`
      const selStart = text.indexOf('"') + 1
      const selEnd = selStart + 'https://'.length
      return { text, selStart, selEnd }
    }
    case 'hr': {
      const text = '<hr />'
      return { text, selStart: text.length, selEnd: text.length }
    }
  }
}

/* ── 媒体块：由「已上传得到的 URL」构造，不再是手填空壳 ── */

/** 从文件名推导一个可用的 alt 文案（SEO / 无障碍都需要，留空比乱填更糟） */
export function suggestAlt(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim()
}

/**
 * 图片块：`<figure>` 包 `<img>` + `<figcaption>`。
 * <p>用 figure/figcaption 而非裸 img，是为了让图注成为结构化内容（爬虫可读、样式可控）。
 * 光标落在图注占位文字上，插入后可直接改。</p>
 */
export function buildImageBlock(url: string, alt = ''): Insertion {
  const caption = '在此填写图注'
  const text =
    '<figure>\n' +
    `  <img src="${url}" alt="${alt}" loading="lazy" />\n` +
    `  <figcaption>${caption}</figcaption>\n` +
    '</figure>'
  const selStart = text.indexOf(caption)
  return { text, selStart, selEnd: selStart + caption.length }
}

/**
 * 视频块：原生 `<video>`（controls + preload=metadata + playsinline）。
 * <p>preload=metadata 只拉首帧与时长，不会因为一个视频把整页拖慢；playsinline 保证 iOS 不强制全屏。</p>
 */
export function buildVideoBlock(url: string): Insertion {
  const text = `<video src="${url}" controls preload="metadata" playsinline></video>`
  return { text, selStart: text.length, selEnd: text.length }
}

/** 块级元素：插入时前后补换行，保证 HTML 源码结构清晰、可维护。 */
export const BLOCK_LEVEL: BlockKind[] = ['h2', 'h3', 'list', 'quote', 'codeBlock', 'hr']

/** 格式提示面板数据：sample 为 HTML 源码，预览与文章页同源渲染。 */
export interface BlockHint {
  label: string
  sample: string
}

export const BLOCK_HINTS: BlockHint[] = [
  { label: '主标题（H2：目录顶层 + 左侧渐变竖条）', sample: '<h2>遇到的问题</h2>' },
  { label: '子标题（H3：目录二级）', sample: '<h3>排查第一步</h3>' },
  { label: '加粗 / 斜体', sample: '<strong>重要结论</strong> 与 <em>轻读强调</em>' },
  { label: '行内代码', sample: '使用 <code>npm run dev</code> 启动项目' },
  {
    label: '代码块（标注语言，渲染出 macOS 风格窗口）',
    sample: '<pre><code class="language-ts">\nconst a = 1\nconsole.log(a)\n</code></pre>',
  },
  {
    label: '列表（要点加粗）',
    sample:
      '<ul>\n  <li><strong>ping 域名</strong>先走 DNS，测的是 CDN 节点</li>\n  <li><strong>ping IP</strong>直连源站，测的是真实服务器</li>\n</ul>',
  },
  { label: '引用（金句）', sample: '<blockquote>排查的本质，是把变量一个个钉死。</blockquote>' },
  { label: '链接', sample: '<a href="https://stewie.fun">我的博客</a>' },
  {
    label: '图片（工具栏 🖼️ 选文件即上传插入，自动带图注）',
    sample:
      '<figure>\n  <img src="https://example.com/images/demo.jpg" alt="示意图" />\n  <figcaption>图 1：报错现场截图</figcaption>\n</figure>',
  },
  {
    label: '视频（工具栏 🎬 选文件即上传插入，最大 100MB）',
    sample:
      '<figure>\n  <video src="https://example.com/videos/demo.mp4" controls preload="metadata" playsinline></video>\n  <figcaption>视频：功能演示</figcaption>\n</figure>',
  },
  { label: '分割线', sample: '<hr />' },
]
