import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'

import App from './App.vue'
import router from './router'
import { reveal } from './directives/reveal'

const app = createApp(App)
const head = createHead()

app.directive('reveal', reveal)
app.use(head)
app.use(createPinia())
app.use(router)

/* ── 全局涟漪效果：点击 .btn-ripple 元素时设置扩散坐标 ── */
document.addEventListener('mousedown', (e) => {
  const target = (e.target as HTMLElement)?.closest('.btn-ripple') as HTMLElement | undefined
  if (!target) return
  const rect = target.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  target.style.setProperty('--ripple-x', `${x}%`)
  target.style.setProperty('--ripple-y', `${y}%`)
})

app.mount('#app')
