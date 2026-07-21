// 文章正文增强：把 <pre> 包成 macOS 风格代码块（带红绿灯与复制按钮）。
// 文章页 PostView 与后台编辑器预览共用，保证「写」与「展示」完全一致。
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
