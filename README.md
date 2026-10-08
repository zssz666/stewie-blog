# 🧪 Stewie Lab · 前端实验图纸
## 项目已经上线，网址[stewie.fun](http://stewie.fun/)，欢迎访问👏

> **把踩过的坑，写成实验报告。** ⌒★

一个基于 **Vue 3 + Vite + TypeScript** 的个人博客前端，配套 Spring Boot 后端（[`../stewie-blog-spring`](../stewie-blog-spring/README.md)）提供文章、分类、标签、评论、点赞与作者鉴权能力。读者无需登录即可浏览；作者登录后进入管理后台发布与维护内容。

整个站点被设计成一座 **「Stewie 实验室」**：浅色主题是一张铺在制图桌上的**工程图纸底稿**，深色主题则切换为**晒蓝图**；二次元元素以「贴在图纸上的实物贴纸」形式呈现，反差萌拉满。每一篇博文都是一次**登记在册的实验**——假设、复现、修复、沉淀。🔬

## ✨ 一分钟看懂这座实验室

| 图纸区域 | 是什么 | 好玩在哪 |
|---------|--------|---------|
| 📐 首页 Hero | 制图桌上的一张实验图纸 | 双线制图边框 + 四角对位十字标，标题逐字「勾勒 → 上墨」 |
| 📟 示波器 OSC-1 | Canvas 实时波形装置 | 鼠标横移调**频率**、纵移调**振幅**、点击切波形 `SIN → SQR → NOISE` |
| 🎮 研究员状态卡 | RPG 角色面板 | **HP = 发量**、**MP = 咖啡**、**EXP = 真实文章数**，每 10 篇升一级 |
| 😶‍🌫️ 表情小球 | emotion-ball 库吉祥物 | 40+ 款表情 × 3 种形状，点击随机换脸 + 自旋 + 撒花，还会**注视你的鼠标** |
| 🖼 四格漫画 | 方法论可视化小剧场 | 假设 → 复现 → 修复 → 沉淀，每格都有拟声词贴纸 |
| ⚔️ 装备库 ARSENAL | 技术栈的游戏化陈列 | 每门技术都是一件装备：`SSR/SR/R` 稀有度 + 熟练度进度条 |

## 🛠 技术栈

| 技术 | 版本 | 实验室用途 |
|------|------|-----------|
| Vue | ^3.5.38 | Composition API + `<script setup>` |
| Vite | ^8.0.16 | 极速构建引擎（含 `@` 别名与 dev/preview 双代理） |
| TypeScript | ~6.0.0 | 类型安全结界 ✨ |
| Vue Router | ^5.1.0 | 路由管理（含 `/admin` 鉴权守卫） |
| Pinia | ^3.0.4 | 状态管理（theme / auth / ui） |
| @unhead/vue | ^3.1.7 | SEO 元信息管理 |
| emotion-ball | — | 表情小球 SVG 引擎（40+ 表情，主题跟色） |
| 高德地图 JS API | 2.0 | 关于页「实验基地」定位四川成都 🗺 |

> 要求 Node `^22.18.0 || >=24.12.0`。

## 🚀 功能特性

### 🏠 首页 · 一张实验图纸

- **图纸入场**：双线制图边框 + 四角对位十字标 + `EXP-000 · 实验开始` 编号眉题；标题以「勾勒 → 上墨」两阶段逐字绘制，首次访问播放、同会话刷新不重播（`sessionStorage` 打标）。
- **示波器装置** [Oscilloscope.vue](src/components/Oscilloscope.vue)：荧光屏波形不随主题切换（屏幕颜色是仪器物理属性 🖥），横移鼠标 = 拧 FREQ 旋钮、纵移 = 拧 AMPL 旋钮、点击面板循环切换正弦 / 方波 / 叠加噪声。
- **研究员状态卡** [LabStatusCard.vue](src/components/LabStatusCard.vue)：HP 发量、MP 咖啡（趣味固定值），EXP 取真实文章数实时驱动等级与称号 —— `见习研究员 → 实验助理 → 疯狂科学家 → 传说发明家`，数字滚动动画进入视口才触发。
- **表情小球吉祥物** [EmotionBall.vue](src/components/EmotionBall.vue)：emotion-ball 引擎的 Vue 封装，体色跟主题色板走（hazard 安全橙 / draft 制图蓝 / fix 实验绿）；点击随机换表情 + 形状，35% 概率自旋，还会含蓄地注视你的鼠标光标 👀。
- **实验四格漫画** [FlowComic.vue](src/components/FlowComic.vue)：`假设 → 复现 → 修复 → 沉淀` 的踩坑方法论小剧场，表情按剧情锁定不随刷新随机，戳一戳触发自旋 / 撒花彩蛋。
- **装备库** [Arsenal.vue](src/components/Arsenal.vue)：技术栈按游戏装备陈列，稀有度徽章 + 进入视口时熟练度条动画填充。
- **实验登记簿**：文章卡片**左右交替**单列布局（奇偶 `flip`），首篇 `featured` 强化展示（粗边框 + 大图）；Hero 角落的便签贴纸显示**后台文章真实总数**（而非当前列表长度）。
- **前端梗弹幕**：`git push --force 之前，记得先备份`、`CSS 垂直居中：一门玄学`、`今晚一定早睡 —— 23:59` …… 会心一笑的实验室日常。
- **磁吸按钮**：桌面端 hover 时按钮像被磁铁吸引般微微跟随鼠标。

### 📇 文章列表 · 实验登记簿

- 欢迎区 + 分类筛选（[CategoryFilter.vue](src/components/CategoryFilter.vue)）+ 分页（[Pagination.vue](src/components/Pagination.vue)）。
- 侧边栏：个人资料卡（[ProfileCard.vue](src/components/ProfileCard.vue)）+ 热门实验 Top 5（[PopularPosts.vue](src/components/PopularPosts.vue)，按浏览量倒序）。
- 全站 `v-reveal` 滚动入场指令：元素错峰滑入（位移 + 透明度）。

### 🔬 文章详情 · 实验记录

- 视差 banner（含封面大图）+ 顶部阅读进度条 + 摘要登记框。
- macOS 风格代码块：红黄绿圆点 + 一键复制 📋。
- 悬浮 TOC 目录（长文不迷路）。
- **点赞**：按浏览器指纹幂等，点了不会重复计数 👍。
- **评论**：楼中楼嵌套 + 审核状态展示，畅所欲言（通过审核后展示）。

### 🧪 关于页 · 研究员档案（Bento 宫格）

参照 Bento 宫格美学重构的 12 张登记卡片（`#01 ~ #12`，12 列 grid 宽窄交错）：

- **#01 性格**：提倡者 **INFJ-A** 🧑‍🔬，链接直达 16personalities。
- **#02 爱好**：编码 / 造轮子 / 数码 / 音乐 / 番剧 / 咖啡 ☕，pill 标签 hover 弹跳。
- **#03 影视收藏**：电影 & 动漫海报墙，hover 时 `scale(1.15)` 放大 + 阴影光晕 + 标题淡入 🎬。
- **#04 引言**：`Talk is cheap. Show me the code.` —— 贴纸 hover 会甩动。
- **#05 技术栈墙**：`author.skills` 动态渲染 + 品牌色映射（Vue 绿 / TS 蓝 / Spring 青苗……）。
- **#06 初心**：终端窗口复刻 2023 年的第一行 `node hello.js`。
- **#07 / #08 关注偏好 & 音乐偏好**：紫色光晕呼吸 + 均衡器跳动动画 🎧。
- **#09 实验数据**：登记数 / 总浏览量 / 分类 / 标签，`useCountUp` 数字滚动 + 进入视口触发，全部来自后端实时统计。
- **#10 实验基地**：**高德地图**定位四川成都 🗺（深绿荧光主题，绿色标记点）。
- **#11 履历**：破壳 2004 → 入行 2023 → 专职 2025 → 开博 2026。
- **#12 摆烂卡**：`不想重构… 能跑就行…`，hover 触发彩蛋 —— `……行吧，明天就改`（并没有）。
- 通用交互：所有卡片 hover 时编号 `#NN` 与眉题点亮、卡片上浮，深色卡各有专属强调色。

### 🛡 管理后台 `/admin`（需登录）

- **仪表盘**（AdminDashboard）：全站数据一览。
- **文章管理**（AdminPosts）：封面缩略图 / 状态徽章 / 分页 / 删除。
- **文章编辑器**（PostEditor）：标题 / slug / 摘要 / 正文（模块化块编辑）/ **封面上传** / 分类 / 多标签 / 发布日期 / 草稿 · 发布。
- **评论审核台**（AdminComments）：通过 / 标记垃圾 / 删除。
- **作者信息维护**（AdminAuthor）：关于页展示的内容由此配置。

### 🌐 全局体验

- 🌗 **深色模式**：图纸底稿 ↔ 晒蓝图一键切换，表情小球自动跟色。
- 🧲 滚动后导航栏毛玻璃化，导航链接切换为页面标题；品牌 logo 即研究员头像。
- 🔍 全文搜索（MySQL ngram FULLTEXT，按相关度排序）。
- 🎞 路由过渡动画 + 返回顶部浮动按钮 + 未知路由 404 页。
- ♿ **无障碍**：全站动画遵循 `prefers-reduced-motion` 降级；装饰元素均带 `aria-hidden`。
- 📈 SEO：`useSeo` + @unhead/vue 按页注入标题 / 描述 / OG 图；`fetchpriority` 优化首屏 LCP。

## 🎨 设计语言

> **工程图纸 × 贴纸反差萌**

- **色彩**：浅色主题 = 图纸底稿（内容页浅灰白 `#f8fafc`）；深色主题 = 晒蓝图（首页深色渐变 `#0f172a → #1e1b4b → #312e81`）；强调色安全橙贯穿全站，三色板 `hazard / draft / fix` 对应橙 / 蓝 / 绿。
- **字体**：正文无衬线 + 等宽字体点缀（编号、眉题、代码），处处透着「实验室登记簿」气质。
- **动效**：统一 `cubic-bezier` 物理感缓动，仅用 `transform` / `opacity`（GPU 友好）；跑马灯等部分动画按无障碍偏好豁免。
- **世界观一致性**：评论是「实验反馈」，点赞是「实验认可」，404 是「实验失败」——所有文案都住在实验室语境里。

## 📁 项目结构

```
src/
├── api/                 # 后端接口封装
│   ├── request.ts           # fetch 封装（JWT 注入 / resolveAsset 静态资源拼接 / 统一错误处理）
│   ├── post.ts              # 文章 / 分类 / 标签 / 搜索 / 热门 / 浏览埋点
│   ├── author.ts            # 作者公开信息
│   ├── interaction.ts       # 点赞 / 评论
│   ├── auth.ts              # 登录 / 登出
│   └── admin.ts             # 管理后台接口（文章 CRUD / 封面上传 / 评论审核）
├── assets/              # 全局样式（base.css 色彩系统 + animations.css 动效）
├── components/
│   ├── AppNavbar.vue         # 导航栏（透明 → 滚动毛玻璃；品牌 logo 头像）
│   ├── AppFooter.vue         # 页脚
│   ├── PostCard.vue          # 实验登记簿卡片（左右交替 / featured 强化）
│   ├── Oscilloscope.vue      # 示波器装置（Canvas 波形交互）
│   ├── LabStatusCard.vue     # RPG 研究员状态卡（HP 发量 / MP 咖啡 / EXP 文章数）
│   ├── FlowComic.vue         # 实验四格漫画小剧场
│   ├── Arsenal.vue           # 技术栈装备库（稀有度 + 熟练度）
│   ├── EmotionBall.vue       # 表情小球（emotion-ball 引擎的 Vue 封装）
│   ├── CategoryFilter.vue    # 分类筛选
│   ├── Pagination.vue        # 分页
│   ├── PopularPosts.vue      # 热门实验 Top 5
│   ├── ProfileCard.vue       # 个人资料卡
│   ├── AdminLayout.vue       # 管理后台框架（顶栏 + 侧栏）
│   └── icons/                # 图标组件（日 / 月 / 菜单 / 关闭）
├── composables/          # useSeo / useMagnetic / useTilt / useCountUp / useParticles
├── directives/           # reveal.ts（v-reveal 滚动入场指令）
├── editor/               # blocks.ts（后台编辑器块定义）
├── router/               # 路由配置（/admin 嵌套 + requiresAuth 守卫）
├── stores/               # Pinia（theme / auth / ui）
├── styles/               # admin.css（后台样式）
├── types/                # TS 类型（blog / auth / emotion-ball.d.ts）
├── utils/                # article.ts（文章解析）/ token.ts（JWT 存取）
├── views/
│   ├── HomeView.vue          # 首页（实验图纸 Hero + 登记簿）
│   ├── ArticlesView.vue      # 实验登记簿列表
│   ├── PostView.vue          # 实验记录详情
│   ├── AboutView.vue         # 关于（Bento 宫格 + 高德地图）
│   ├── SearchView.vue        # 全文搜索
│   ├── LoginView.vue         # 作者登录
│   ├── NotFoundView.vue      # 404（实验失败页）
│   └── admin/                # Dashboard / Posts / PostEditor / Comments / Author
├── App.vue              # 根组件（返回顶部按钮）
└── main.ts              # 应用入口
public/
├── avatar.png           # 研究员头像（导航 logo & 关于页 Hero 共用）
├── images/              # 静态图片（hero-bg.webp 等）
├── og-image.png         # 社交分享卡
├── robots.txt / favicon.ico / BingSiteAuth.xml
```

## 🔧 快速开始

```sh
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 类型检查 + 生产构建（vue-tsc + vite build）
npm run build

# 预览构建结果
npm run preview

# 代码检查（oxlint + eslint）
npm run lint
```

### 🔌 对接后端

开发（`npm run dev`）与生产预览（`npm run preview`）均通过 Vite 代理访问后端（`vite.config.ts` 已同时配置 `server.proxy` 与 `preview.proxy`）：

- `/api` → `http://localhost:8081`
- `/uploads` → `http://localhost:8081`（封面图静态访问）

请确保后端已在 `8081` 启动（见 [`../stewie-blog-spring/README.md`](../stewie-blog-spring/README.md)）。

> ⚠️ 注意：`npm run preview` **默认不会**复用 `server.proxy`，必须在 `preview.proxy` 中再次声明，否则打包后用 preview 测登录 / 进入 `/admin` 会因 `/api` 不通而失败。本项目已配置好，可直接 `npm run preview` 验证。

### 🚢 部署说明（SPA 注意事项）

构建产物在 `dist/`，可由任意静态服务器托管。根据前后端是否同源，有两种部署方式：

#### 方式 A：前后端同源（推荐，最简单）✅

用 Nginx（或同域反代）同时托管前端静态文件与后端，浏览器看来是同一个域名：

- 前端 `dist/` 放到 Nginx 静态根目录
- Nginx 把 `/api`、`/uploads` 反代到后端 `:8081`
- 前端无需改任何变量（默认 `VITE_API_BASE_URL=/api`）

```nginx
server {
    listen 80;
    server_name blog.your-domain.com;

    root /path/to/dist;
    index index.html;

    # SPA 路由回退：所有前端深链接（/admin、/post/xxx）都返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 接口与上传反代到 Spring Boot
    location /api/  { proxy_pass http://127.0.0.1:8081; }
    location /uploads/ { proxy_pass http://127.0.0.1:8081; }
}
```

后端在同域下**不受 CORS 限制**，无需额外配置 `CORS_ALLOWED_ORIGINS`。

#### 方式 B：前后端跨域（如前端 GitHub Pages + 后端云服务器）🌍

1. **构建前设置环境变量** `VITE_API_BASE_URL` 指向后端公共基址（见 `.env.example`）：

   ```sh
   # .env.production
   VITE_API_BASE_URL=https://api.your-domain.com/api
   ```

   构建后，封面图等静态资源会自动拼成 `https://api.your-domain.com/uploads/...`。

2. **后端允许前端域名**：在后端启动时通过环境变量追加 CORS 白名单（多个用逗号分隔）：

   ```sh
   CORS_ALLOWED_ORIGINS=https://your-name.github.io,https://blog.your-domain.com \
   java -jar stewie-blog-spring-0.0.1-SNAPSHOT.jar --server.port=8081
   ```

3. **SPA 深链接回退**：纯静态托管（GitHub Pages / Netlify / Vercel）需把未知路由回退到 `index.html`，否则刷新 `/admin`、文章详情会 404：
   - **GitHub Pages**：根目录放 `404.html`（复制 `index.html` 内容）；或改用 hash 路由。
   - **Netlify**：`public/_redirects` 写 `/* /index.html 200`
   - **Vercel / 通用**：把所有非资源请求 rewrite 到 `index.html`

> 🔑 关键点：无论哪种方式，**只要登录接口 `/api/auth/login` 不通或被 CORS 拦截，就无法拿到 token，自然进不去 `/admin`**。打包后"进不去后台"几乎都是这个原因——检查接口是否可达、后端 CORS 是否放行了前端域名。

未知路由会由前端 catch-all 渲染 404 页面（`/` 之外的任意路径）。

## 🥚 彩蛋清单

- 🖱 戳首页吉祥物小球：随机换表情 + 形状，35% 概率自旋
- 📟 点击示波器面板：`SIN → SQR → NOISE` 波形循环切换
- 🖼 戳四格漫画任意一格：小球自旋 / 低概率撒花
- 🥱 hover 关于页 #12 摆烂卡：`不想重构… 能跑就行…` → `……行吧，明天就改`（并不会）
- ✨ hover 关于页 "Hello, World⌒★" 的星星：会旋转放大
- 🎮 研究员等级：攒够 10 / 20 / 50 篇文章解锁 `实验助理 / 疯狂科学家 / 传说发明家` 称号
- 🪧 首页 Hero 便签贴纸：数字是后台文章**真实总数**，发一篇涨一篇

---

<div align="center">

**STEWIE'S LAB** · 热爱开源与写作的开发者 🔬

*渝ICP备2026015410号*

</div>
