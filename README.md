# Stewie Blog · 前端

一个基于 **Vue 3 + Vite + TypeScript** 的个人博客前端，配套 Spring Boot 后端（`../stewie-blog-spring`）提供文章、分类、标签、评论、点赞与作者鉴权能力。读者无需登录即可浏览；作者通过登录进入管理后台发布与维护内容。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | ^3.5.38 | Composition API + `<script setup>` |
| Vite | ^8.0.16 | 开发构建工具 |
| TypeScript | ~6.0.0 | 类型安全 |
| Vue Router | ^5.1.0 | 路由管理（含 `/admin` 鉴权守卫） |
| Pinia | ^3.0.4 | 状态管理（主题 / 登录态） |
| @unhead/vue | ^3.1.7 | SEO 元信息 |

> 要求 Node `^22.18.0 || >=24.12.0`。

## 功能特性

- **首页**：全屏沉浸式 Hero，打字机标题动画，**背景图模糊→清晰渐显入场**，文章卡片错峰滑入（位移 + 透明度），滚动后导航栏毛玻璃；首次访问播放动画、刷新不重播，遵循 `prefers-reduced-motion`。
- **文章列表**：欢迎区 + 技术栈展示，标签筛选，卡片淡入动画，右侧个人资料卡 + 热门文章侧边栏。
- **文章详情**：视差 banner（含封面大图）、阅读进度条、摘要框、macOS 风格代码块（圆点 + 复制）、悬浮 TOC 目录、**点赞（按指纹幂等）**、**评论（含楼中楼 + 审核态）**。
- **关于页**：头像虚线圆环 + 呼吸动画、时间线滑入、技术栈标签 hover 填充。
- **管理后台 `/admin`**（需登录）：文章管理表格（封面缩略图 / 状态徽章 / 分页 / 删除）、文章编辑器（标题 / slug / 摘要 / 正文 / **封面上传** / 分类 / 多标签 / 发布日期 / 草稿·发布）、评论审核台（通过 / 标记垃圾 / 删除）。
- **全局**：路由过渡动画、返回顶部浮动按钮、深色模式切换、链接下划线中心展开、`fetchpriority` 优化首屏 LCP、未知路由 404 页面。

## 项目结构

```
src/
├── api/             # 后端接口封装
│   ├── request.ts        # axios 实例（注入 JWT、统一错误处理）
│   ├── posts.ts          # 文章 / 分类 / 标签 / 作者 公开接口
│   ├── interaction.ts    # 点赞 / 评论 公开接口
│   └── admin.ts          # 管理后台接口（文章 CRUD / 封面上传 / 评论审核）
├── assets/          # 全局样式（base.css 色彩系统 + animations.css 动效）
├── components/      # 组件
│   ├── AppNavbar.vue      # 导航栏（透明 → 滚动毛玻璃；已登录显示「管理后台」）
│   ├── AdminLayout.vue    # 管理后台框架（顶栏 + 侧栏）
│   ├── PostCard.vue       # 文章卡片（封面图 / 渐变占位）
│   └── icons/             # 图标组件
├── composables/     # useTilt / useInView 等
├── router/          # 路由配置（/admin 嵌套 + requiresAuth 守卫）
├── stores/          # Pinia（theme / auth）
├── types/           # TypeScript 类型（blog / auth）
├── views/           # 页面
│   ├── HomeView.vue       # 首页（Hero + 文章网格）
│   ├── ArticlesView.vue   # 文章列表
│   ├── PostView.vue       # 文章详情
│   ├── AboutView.vue      # 关于
│   ├── LoginView.vue      # 作者登录（登录后进入 /admin）
│   └── admin/             # AdminDashboard / PostEditor / AdminComments
├── App.vue          # 根组件（返回顶部按钮）
└── main.ts          # 应用入口
public/
└── images/         # 静态资源（hero-bg.webp 等）
```

## 快速开始

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

### 对接后端

开发（`npm run dev`）与生产预览（`npm run preview`）均通过 Vite 代理访问后端（`vite.config.ts` 已同时配置 `server.proxy` 与 `preview.proxy`）：

- `/api` → `http://localhost:8081`
- `/uploads` → `http://localhost:8081`（封面图静态访问）

请确保后端已在 `8081` 启动（见 [`../stewie-blog-spring/README.md`](../stewie-blog-spring/README.md)）。

> 注意：`npm run preview` **默认不会**复用 `server.proxy`，必须在 `preview.proxy` 中再次声明，否则打包后用 preview 测登录 / 进入 `/admin` 会因 `/api` 不通而失败。本项目已配置好，可直接 `npm run preview` 验证。

### 部署说明（SPA 注意事项）

构建产物在 `dist/`，可由任意静态服务器托管。根据前后端是否同源，有两种部署方式：

#### 方式 A：前后端同源（推荐，最简单）

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

#### 方式 B：前后端跨域（如前端 GitHub Pages + 后端云服务器）

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

> 关键点：无论哪种方式，**只要登录接口 `/api/auth/login` 不通或被 CORS 拦截，就无法拿到 token，自然进不去 `/admin`**。打包后"进不去后台"几乎都是这个原因——检查接口是否可达、后端 CORS 是否放行了前端域名。

未知路由会由前端 catch-all 渲染 404 页面（`/` 之外的任意路径）。

## 设计说明

- **色彩**：首页深色渐变 `#0f172a → #1e1b4b → #312e81`，内容页浅灰白 `#f8fafc`，强调色蓝 `#3b82f6`。
- **动效**：统一 `cubic-bezier(0.4, 0, 0.2, 1)` 物理感缓动；仅使用 `transform` / `opacity`（GPU 友好），支持 `prefers-reduced-motion` 无障碍降级。
- **响应式**：适配桌面、平板、移动端三档断点。
