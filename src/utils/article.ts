// 文章正文增强：把 <pre> 包成 macOS 风格代码块（带红绿灯与复制按钮）。
// 文章页 PostView 与后台编辑器预览共用，保证「写」与「展示」完全一致。

/**
 * 代码块内容转义：把 <pre><code> 内部未转义的标签字符转为实体。
 *
 * 背景：正文以 HTML 存储，编辑器插入的代码块是 <pre><code> 原生结构。
 * 若直接往里粘贴含 <script> / <div> 等标签的代码且未转义，
 * v-html 渲染时会被浏览器解析成真实 DOM 元素（script 不显示、
 * div 变空白盒子），导致代码“消失”。
 *
 * 在原始字符串层面处理（不经 DOMParser）：裸 `<` / `>` 全部转义，
 * `&` 仅转义后面不构成实体的（避免把已转义的 &lt; 双重转义成 &amp;lt;）。
 * 已正确转义的历史文章不受影响。
 */
export function escapeCodeBlockContent(html: string): string {
  return html.replace(
    /(<pre[^>]*>\s*<code[^>]*>)([\s\S]*?)(<\/code>\s*<\/pre>)/g,
    (_m, open: string, body: string, close: string) =>
      open +
      body
        .replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;') +
      close,
  )
}

export function enhanceCodeBlocks(root: HTMLElement): void {
  const pres = root.querySelectorAll('pre')
  pres.forEach((pre) => {
    if (pre.querySelector('.code-dots')) return

    const wrapper = document.createElement('div')
    wrapper.className = 'code-block'
    pre.parentNode!.insertBefore(wrapper, pre)
    wrapper.appendChild(pre)

    const header = document.createElement('div')
    header.className = 'code-block__header'
    const dots = document.createElement('div')
    dots.className = 'code-dots'
    dots.innerHTML =
      '<span class="code-dot code-dot--red"></span>' +
      '<span class="code-dot code-dot--yellow"></span>' +
      '<span class="code-dot code-dot--green"></span>'
    const copyBtn = document.createElement('button')
    copyBtn.className = 'code-copy'
    copyBtn.textContent = '复制'
    copyBtn.addEventListener('click', () => {
      const code = pre.querySelector('code')
      const text = code ? code.textContent : pre.textContent
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = '✓ 已复制'
          copyBtn.classList.add('code-copy--copied')
          setTimeout(() => {
            copyBtn.textContent = '复制'
            copyBtn.classList.remove('code-copy--copied')
          }, 1500)
        })
      }
    })
    header.appendChild(dots)
    header.appendChild(copyBtn)
    wrapper.insertBefore(header, pre)
  })
}
