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
- **全局**：路由过渡动画、返回顶部浮动按钮、深色模式切换、链接下划线中心展开、`fetchpriority` 优化首屏 LCP。

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

开发时通过 Vite 代理访问后端（`vite.config.ts` 已配置）：

- `/api` → `http://localhost:8081`
- `/uploads` → `http://localhost:8081`（封面图静态访问）

请确保后端已在 `8081` 启动（见 [`../stewie-blog-spring/README.md`](../stewie-blog-spring/README.md)）。生产构建产物在 `dist/`，可由任意静态服务器托管，并将 `/api` 反向代理到后端。

## 设计说明

- **色彩**：首页深色渐变 `#0f172a → #1e1b4b → #312e81`，内容页浅灰白 `#f8fafc`，强调色蓝 `#3b82f6`。
- **动效**：统一 `cubic-bezier(0.4, 0, 0.2, 1)` 物理感缓动；仅使用 `transform` / `opacity`（GPU 友好），支持 `prefers-reduced-motion` 无障碍降级。
- **响应式**：适配桌面、平板、移动端三档断点。
