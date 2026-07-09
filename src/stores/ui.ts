import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 跨组件共享的 UI 状态。
 * 目前用于：文章详情页 → 导航栏 的「吸顶标题」传递。
 */
export const useUiStore = defineStore('ui', () => {
  // 当前文章标题（非空时表示处于文章详情页）
  const postTitle = ref('')

  function setPostTitle(title: string) {
    postTitle.value = title
  }

  function clearPostTitle() {
    postTitle.value = ''
  }

  return { postTitle, setPostTitle, clearPostTitle }
})
