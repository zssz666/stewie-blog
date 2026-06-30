import type { Author, Post } from '@/types/blog'

export const author: Author = {
  name: 'Stewie',
  role: '前端工程师',
  bio: '本科毕业在一个小公司做全栈的社畜，弄个博客记录一下自己工作遇到的问题和一些心得。',
  skills: ['Vue 3', 'TypeScript', 'Vite', 'Pinia','Node.js','koa','java'],
  socials: [
    { label: 'GitHub', href: 'https://github.com/zssz666/' },
    { label: 'Twitter', href: 'https://twitter.com' },
    { label: 'Email', href: 'mailto:2133290569@qq.com' },
  ],
}

export const posts: Post[] = [
  {
    id: 1,
    slug: 'vue-watch-infinite-loop',
    title: 'Vue 3 watch 死循环？我是这样排查的',
    excerpt:
      '一个看着没问题的 watch，页面一加载就疯狂触发。从 DevTools 依赖追踪到最终改写，记录下我排查的完整过程。',
    content: `
<p>线上一个表单页面突然卡死，打开控制台才发现是 watch 触发了无限循环。这种问题在 Composition API 中尤为隐蔽，记录下我的排查思路。</p>
<h2>问题复现</h2>
<p>场景很简单：监听一个 <code>ref</code>，在回调里又修改了它依赖的另一个状态，而这个状态恰好又出现在被监听的源里。于是修改 → 触发 → 再修改，死循环就形成了。</p>
<h2>排查的第一步：定位触发源</h2>
<p>用 Vue DevTools 的「组件依赖」面板，能直观看到某个 ref 被谁读取、又被谁修改。我发现回调里隐式读取了监听源本身——这是循环的根因。</p>
<h2>三种解法</h2>
<ul>
  <li><strong>拆分状态</strong>：把「读」和「写」拆到不同的 ref，从结构上切断回路</li>
  <li><strong>用 watchOnce 或条件守卫</strong>：在回调里加 <code>if</code> 判断，满足条件才执行副作用</li>
  <li><strong>换用 computed</strong>：能用派生值表达的，优先用 computed，它天生无副作用</li>
</ul>
<blockquote>watch 是副作用，副作用最容易制造循环。能派生就别监听。</blockquote>
<p>最终我把那段逻辑改写成了 computed + 一个显式的事件触发，循环彻底消失。这次经历让我对「响应式边界」有了更深的敬畏。</p>
`,
    coverColor: '#1e3a5f',
    category: '问题解决',
    tag: 'Vue',
    date: '2026-06-22',
    readingTime: 6,
    views: 1284,
  },
  {
    id: 2,
    slug: 'typescript-narrowing-pitfalls',
    title: 'TypeScript 类型收窄总是不生效？多半是这几个坑',
    excerpt:
      'typeof、in、判别联合……类型收窄看着简单，但在闭包和数组解构里经常失效。总结下我反复踩过的几个典型场景。',
    content: `
<p>刚用 TypeScript 时，我总在「为什么编译器说这个类型不存在」上卡住。后来才明白，问题大多出在类型收窄（narrowing）没到位。</p>
<h2>判别联合是首选</h2>
<p>当一组类型有共同字段时，给它们加一个字面量类型的 <code>kind</code> 标记，TS 就能在 <code>switch</code> 里自动收窄。这比 <code>typeof</code> 和 <code>in</code> 都更可靠、更可读。</p>
<h2>类型谓词（user-defined type guard）</h2>
<p>当内置收窄不够用时，写一个返回 <code>val is Foo</code> 的函数，能把复杂的判断逻辑封装成可复用的收窄规则。这是我后来用得最多的技巧。</p>
<h2>收窄会丢失的地方</h2>
<ul>
  <li>回调函数里：TS 默认不收窄闭包内的变量，因为它们可能被改写</li>
  <li>数组解构后：收窄信息不会传播到解构出的元素</li>
</ul>
<blockquote>类型不是写给人看的约束，而是写给编译器的契约——你越清晰，它越能帮你。</blockquote>
<p>理解了收窄的边界，写 TS 就从「和编译器吵架」变成了「和编译器合作」。</p>
`,
    coverColor: '#2d4373',
    category: '学习心得',
    tag: 'TypeScript',
    date: '2026-06-15',
    readingTime: 7,
    views: 956,
  },
  {
    id: 3,
    slug: 'vite-proxy-cors-fix',
    title: 'Vite 开发服务器跨域？一套代理配置搞定',
    excerpt:
      '本地调试接口频繁遇到 CORS 报错。这篇文章给出一份亲测可用的 Vite proxy 配置，并解释每条规则背后的原理。',
    content: `
<p>前端本地起在 5173 端口，后端在 8080，浏览器直接请求就报 CORS。开发阶段不必在后端配跨域，用 Vite 的 proxy 转发最省事。</p>
<h2>最小可用配置</h2>
<p>在 <code>vite.config.ts</code> 的 <code>server.proxy</code> 里，把以 <code>/api</code> 开头的请求转发到后端地址，并重写路径。关键是要设 <code>changeOrigin: true</code>，让请求头的 host 改成目标地址。</p>
<pre><code>import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/api/, ''),
      },
    },
  },
})</code></pre>
<h2>容易踩的三个坑</h2>
<ul>
  <li><strong>路径重写写反</strong>：<code>rewrite</code> 的正则要把前缀去掉，别误删业务路径</li>
  <li><strong>WebSocket 代理</strong>：如果是 ws，记得加 <code>ws: true</code></li>
  <li><strong>cookie 跨域</strong>：带凭证时后端 <code>Access-Control-Allow-Credentials</code> 要为 true，且不能用通配符</li>
</ul>
<blockquote>开发环境的跨域，永远应该在前端工具层解决，而不是去改后端。</blockquote>
<p>配好之后，本地代码里直接写 <code>/api/xxx</code>，无感地走代理，生产再用 nginx 处理，开发体验丝滑许多。</p>
`,
    coverColor: '#3b5bdb',
    category: '问题解决',
    tag: 'Vite',
    date: '2026-06-08',
    readingTime: 5,
    views: 2103,
  },
  {
    id: 4,
    slug: 'css-centering-pitfalls',
    title: 'CSS 垂直居中又出问题了？聊聊我踩过的那些坑',
    excerpt:
      'flex、grid、absolute+transform……垂直居中的方案换了好几代，但每代都有自己坑。回顾下我实际遇到过的失效场景。',
    content: `
<p>「如何垂直居中一个元素」几乎是每个前端都被问过的问题。但更有意思的是，这个问题的答案随着 CSS 演进不断变化，而每代方案都有自己坑。</p>
<h2>第一代：表格布局</h2>
<p>早年用 <code>display: table-cell</code> + <code>vertical-align</code>，把元素当表格单元格来居中。能用，但语义混乱、灵活性差。</p>
<h2>第二代：绝对定位 + 负 margin</h2>
<p>知道元素宽高时，用 <code>position: absolute</code> 配合负 margin 居中。局限是要先知道尺寸，响应式下捉襟见肘。</p>
<h2>第三代：transform</h2>
<p><code>top: 50%; transform: translateY(-50%)</code> 解决了未知尺寸的居中，但脱离了文档流，对父容器有要求。</p>
<h2>第四代：Flexbox</h2>
<p><code>display: flex; align-items: center; justify-content: center;</code> 一行搞定，语义清晰、不脱离文档流。这是现在 90% 场景的答案。</p>
<h2>第五代：Grid</h2>
<p>Grid 的 <code>place-items: center</code> 更进一步，二维场景下更强大。布局工具的进化，本质是让开发者更少地「对抗」浏览器。</p>
<blockquote>每一代方案的消失，都是浏览器替我们承担了更多复杂性。</blockquote>
<p>理解这段演进，就不只是记住一个 API，而是理解 CSS 设计哲学的方向。</p>
`,
    coverColor: '#4a6b8a',
    category: '学习心得',
    tag: 'CSS',
    date: '2026-05-30',
    readingTime: 6,
    views: 743,
  },
  {
    id: 5,
    slug: 'pinia-persist-pitfall',
    title: 'Pinia 持久化丢数据？多半是序列化的坑',
    excerpt:
      '给 Pinia store 接了持久化插件，刷新后方法全没了、页面直接报错。追根溯源是 JSON 序列化丢掉了响应式和函数。',
    content: `
<p>给购物车 store 接上持久化后，刷新页面发现 cart 里的商品对象还在，但一些计算用的方法不见了，页面直接报错。这是一次典型的序列化陷阱。</p>
<h2>问题根因</h2>
<p><code>JSON.stringify</code> 会丢掉函数、Symbol、以及 <code>Proxy</code> 包装下的响应式元信息。存进去的是一个纯数据快照，读回来就成了普通对象，原本挂在 store 上的方法自然没了。</p>
<h2>解法：只持久化必要的字段</h2>
<p>不要把整个 store 状态无脑序列化。在持久化插件的 <code>serializer</code> 里，只挑出真正的业务数据（如商品列表），方法与计算属性留在 store 定义里，每次从 store 实例取即可。</p>
<h2>进阶：版本迁移</h2>
<p>持久化的数据结构会随业务演进。给存档加一个 <code>version</code> 字段，读取时做迁移，能避免老数据结构导致的运行时错误。</p>
<blockquote>持久化的不是「状态」，而是「可重建状态的最小数据」。</blockquote>
<p>想清楚「哪些是数据、哪些是行为」之后，持久化的边界就清晰了，问题也迎刃而解。</p>
`,
    coverColor: '#5a7299',
    category: '问题解决',
    tag: 'Pinia',
    date: '2026-05-20',
    readingTime: 5,
    views: 612,
  },
  {
    id: 6,
    slug: 'options-to-composition-refactor',
    title: '800行组件从 Options 迁到 script setup，我踩了这些坑',
    excerpt:
      '真正动手迁移一个 800 行的表单组件后，才发现 Composition API 的好处不在写法本身，而在逻辑边界变清晰了。',
    content: `
<p>一直听说 Composition API 更好，但没真正迁移过大型组件。这次把一个 800 行的表单组件从 Options API 迁到 <code>script setup</code>，收获比预期大得多。</p>
<h2>最大的改变：逻辑按关注点聚合</h2>
<p>迁移前，表单校验逻辑被拆散在 data、methods、computed、watch 里，改一个字段要跳四个地方。迁移后，我把校验抽成一个 <code>useValidation</code> 组合式函数，相关的 state、计算、监听全在一起，改起来不用再满文件跳。</p>
<h2>逻辑复用变得显式</h2>
<p>以前用 mixin，不知道哪个方法从哪混进来的；现在用 composables，输入输出一目了然，类型也能跟着走。这种「显式」让代码可读性质的飞跃。</p>
<h2>可测试性的提升</h2>
<ul>
  <li>组合式函数是纯函数式的，可以直接在组件外单测</li>
  <li>不再依赖 <code>this</code>，mock 依赖更容易</li>
</ul>
<blockquote>重构的价值不在「换写法」，而在让逻辑的边界变得清晰。</blockquote>
<p>迁移完成后，组件行数没少多少，但「理解一个功能要读多少代码」从一大段变成了一个函数。这就是 Composition API 的真正红利。</p>
`,
    coverColor: '#1e3a5f',
    category: '学习心得',
    tag: 'Vue',
    date: '2026-05-10',
    readingTime: 7,
    views: 1587,
  },
]

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug)
}
