import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { enhanceCodeBlocks, escapeCodeBlockContent } from '@/utils/article'

/** Add preview-only anchors. Never insert tracking attributes into the saved HTML.
 * Consume entire pre/comment tokens so code examples cannot become false anchors. */
function anchoredHtml(source: string) {
  return source.replace(
    /<!--[\s\S]*?-->|<pre\b[^>]*>[\s\S]*?<\/pre\s*>|<(?:h[1-6]|p|div|section|article|blockquote|ul|ol|li|figure|table|hr|img|video)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi,
    (token, offset: number) => token.startsWith('<!--') ? token : token.replace(/^(<[^\s>]+)/, `$1 data-source-offset="${offset}"`),
  )
}

type Anchor = { source: number; preview: number; offset: number }
export function useEditorScrollSync(content: Ref<string>, input: Ref<HTMLTextAreaElement | null>, preview: Ref<HTMLElement | null>, body: Ref<HTMLElement | null>) {
  const enabled = ref(true)
  const renderedContent = computed(() => escapeCodeBlockContent(anchoredHtml(content.value)))
  let anchors: Anchor[] = []
  let observer: ResizeObserver | undefined
  let frame = 0
  let driver: 'source' | 'preview' = 'source'
  let logicalOffset = 0
  let preservedOffset: number | null = null
  let measuredWidth = ''
  const pending = new WeakMap<HTMLElement, number>()

  // Measure the actual wrapped textarea text. Line-count ratios fail on long paragraphs.
  function sourcePositions(offsets: number[]): number[] {
    const ta = input.value
    if (!ta?.clientWidth) return []
    const mirror = document.createElement('div')
    const style = getComputedStyle(ta)
    Object.assign(mirror.style, {
      position: 'fixed', top: '0', left: '-100000px', visibility: 'hidden',
      width: `${ta.clientWidth}px`, boxSizing: 'border-box', whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word', tabSize: style.tabSize,
      font: style.font, letterSpacing: style.letterSpacing, padding: style.padding,
    })
    let start = 0
    const markers = offsets.map(offset => {
      mirror.append(document.createTextNode(content.value.slice(start, offset)))
      const marker = document.createElement('span')
      marker.textContent = '\u200b'
      mirror.append(marker)
      start = offset
      return marker
    })
    mirror.append(document.createTextNode(content.value.slice(start)))
    document.body.append(mirror)
    const top = mirror.getBoundingClientRect().top
    const positions = markers.map(marker => marker.getBoundingClientRect().top - top)
    mirror.remove()
    return positions
  }

  function measure() {
    const ta = input.value, pane = preview.value
    if (!ta?.clientWidth || !pane?.clientWidth || !body.value) return
    const nodes = [...body.value.querySelectorAll<HTMLElement>('[data-source-offset]')]
    const positions = sourcePositions(nodes.map(el => Number(el.dataset.sourceOffset)))
    const top = pane.getBoundingClientRect().top
    const maxSource = ta.scrollHeight - ta.clientHeight
    const maxPreview = pane.scrollHeight - pane.clientHeight
    measuredWidth = `${ta.clientWidth}:${pane.clientWidth}`
    anchors = [{ source: 0, preview: 0, offset: 0 }]
    nodes.forEach((node, i) => {
      const target = node.tagName === 'PRE' ? node.closest('.code-block') || node : node
      const y = target.getBoundingClientRect().top - top + pane.scrollTop - 16
      const x = Math.max(0, (positions[i] ?? 0) - 16)
      const previous = anchors[anchors.length - 1]!
      // Nested wrappers and collapsed margins may share or reverse positions.
      const offset = Number(node.dataset.sourceOffset)
      if (offset > previous.offset && x > previous.source && y > previous.preview && x < maxSource && y < maxPreview) anchors.push({ source: x, preview: y, offset })
    })
    anchors.push({ source: Math.max(0, maxSource), preview: Math.max(0, maxPreview), offset: content.value.length })
  }

  function move(target: HTMLElement, top: number) {
    const next = Math.max(0, Math.min(target.scrollHeight - target.clientHeight, top))
    if (Math.abs(target.scrollTop - next) < 1) return
    pending.set(target, next)
    target.scrollTop = next
  }
  function sync(from: 'source' | 'preview') {
    if (!enabled.value) return
    const ta = input.value, pane = preview.value
    if (!ta || !pane || !anchors.length) return
    const source = from === 'source' ? ta : pane
    const target = from === 'source' ? pane : ta
    const key = from === 'source' ? 'source' : 'preview'
    const other = from === 'source' ? 'preview' : 'source'
    const y = source.scrollTop
    let i = 0
    while (i < anchors.length - 2 && anchors[i + 1]![key] <= y) i++
    const a = anchors[i]!, b = anchors[i + 1]!
    if (!b) return
    const ratio = Math.max(0, Math.min(1, (y - a[key]) / (b[key] - a[key] || 1)))
    logicalOffset = a.offset + (b.offset - a.offset) * ratio
    move(target, a[other] + (b[other] - a[other]) * ratio)
  }
  function onScroll(from: 'source' | 'preview') {
    const element = from === 'source' ? input.value : preview.value
    if (!element) return
    const expected = pending.get(element)
    pending.delete(element)
    if (expected !== undefined && Math.abs(expected - element.scrollTop) < 2) return
    driver = from
    sync(from)
  }
  function refresh() {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      const width = `${input.value?.clientWidth}:${preview.value?.clientWidth}`
      const restore = preservedOffset ?? (measuredWidth && width !== measuredWidth ? logicalOffset : null)
      preservedOffset = null
      measure()
      if (restore !== null && enabled.value && anchors.length && input.value && preview.value) {
        let i = 0
        while (i < anchors.length - 2 && anchors[i + 1]!.offset <= restore) i++
        const a = anchors[i]!, b = anchors[i + 1]!
        const ratio = Math.max(0, Math.min(1, (restore - a.offset) / (b.offset - a.offset || 1)))
        move(input.value, a.source + (b.source - a.source) * ratio)
        move(preview.value, a.preview + (b.preview - a.preview) * ratio)
        logicalOffset = restore
      } else sync(driver)
      if (driver === 'source') followVisibleCursor()
    })
  }
  function captureSyncPosition() { sync(driver); preservedOffset = logicalOffset }
  function followCursor() {
    if (!enabled.value || !input.value || !preview.value) return
    driver = 'source'
    const caret = input.value.selectionStart
    const nodes = [...(body.value?.querySelectorAll<HTMLElement>('[data-source-offset]') || [])]
    const node = nodes.reverse().find(el => Number(el.dataset.sourceOffset) <= caret)
    if (!node) return
    const pane = preview.value
    const rect = node.getBoundingClientRect(), bounds = pane.getBoundingClientRect()
    // A tall paragraph/code block can start above the pane and still be visible.
    // Do not snap back to its opening tag on every keypress inside that block.
    if (rect.bottom < bounds.top + 24 || rect.top > bounds.bottom - 24) move(pane, pane.scrollTop + rect.top - bounds.top - 24)
  }
  function revealCursor() {
    const ta = input.value
    if (!ta) return
    const y = sourcePositions([ta.selectionStart])[0]
    if (y !== undefined && (y < ta.scrollTop + 16 || y > ta.scrollTop + ta.clientHeight - 40)) {
      move(ta, y - ta.clientHeight * .3)
    }
    sync('source')
    followCursor()
  }
  function followVisibleCursor() {
    const ta = input.value
    if (!enabled.value || !ta || document.activeElement !== ta) return
    const y = sourcePositions([ta.selectionStart])[0]
    if (y !== undefined && y >= ta.scrollTop && y < ta.scrollTop + ta.clientHeight - 24) followCursor()
  }
  watch(renderedContent, async () => {
    if (document.activeElement === input.value) driver = 'source'
    await nextTick()
    if (body.value) { enhanceCodeBlocks(body.value); observer?.observe(body.value) }
    refresh()
  }, { flush: 'post' })
  watch(enabled, refresh)
  onMounted(() => {
    observer = new ResizeObserver(refresh)
    if (input.value) observer.observe(input.value)
    if (preview.value) observer.observe(preview.value)
    if (body.value) observer.observe(body.value)
    refresh()
  })
  onBeforeUnmount(() => { observer?.disconnect(); cancelAnimationFrame(frame) })
  return { renderedContent, syncEnabled: enabled, onSourceScroll: () => { onScroll('source'); if (driver === 'source') followVisibleCursor() }, onPreviewScroll: () => onScroll('preview'), followCursor, revealCursor, refreshSync: refresh, captureSyncPosition }
}
