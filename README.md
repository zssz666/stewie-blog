# Stewie Blog

一个基于 Vue 3 + Vite + TypeScript 构建的个人博客，记录前端开发中踩过的坑和解决过程。

## 技术栈

| 技术 | 说明 |
|------|------|
| Vue 3.5 | Composition API + `<script setup>` |
| Vite 8 | 开发构建工具 |
| TypeScript 6 | 类型安全 |
| Vue Router 5 | 路由管理 |
| Pinia 3 | 状态管理（深色模式） |

## 功能特性

- **首页**：全屏暗色沉浸式 Hero，打字机标题动画，浮动光斑背景，滚动后导航栏毛玻璃效果
- **文章列表**：欢迎区 + 技术栈展示，pill 标签筛选，卡片淡入动画，右侧个人资料卡 + 热门文章侧边栏
- **文章详情**：40vh 视差 banner，阅读进度条，摘要框，macOS 风格代码块（三圆点 + 复制按钮），悬浮 TOC 目录，点赞互动
- **关于页**：头像虚线圆环 + 呼吸动画，时间线滑入 + 圆点脉冲，技术栈标签 hover 填充
- **全局**：路由过渡动画，蓝色自定义滚动条，返回顶部浮动按钮，深色模式切换，链接下划线中心展开

## 项目结构

```
src/
├── assets/          # 全局样式（base.css 色彩系统 + main.css 布局/组件）
├── components/      # 组件
│   ├── AppNavbar.vue       # 导航栏（首页透明 → 滚动毛玻璃）
│   ├── AppFooter.vue       # 页脚
│   ├── PostCard.vue        # 文章卡片（横向布局 + 封面渐变）
│   ├── CategoryFilter.vue  # 分类筛选（pill 样式）
│   ├── ProfileCard.vue     # 侧边栏个人资料卡
│   ├── PopularPosts.vue    # 侧边栏热门文章
│   └── icons/              # 图标组件
├── composables/     # 组合式函数
│   ├── useTilt.ts          # 3D 倾斜效果
│   └── useInView.ts        # 视口检测（IntersectionObserver）
├── data/            # 数据
│   └── posts.ts            # 文章数据 + 作者信息
├── router/          # 路由配置
├── stores/          # Pinia 状态管理
│   └── theme.ts            # 深色/浅色模式
├── types/           # TypeScript 类型定义
│   └── blog.ts             # Post / Author 接口
├── views/           # 页面视图
│   ├── HomeView.vue        # 首页（暗色沉浸式 Hero）
│   ├── ArticlesView.vue    # 文章列表页
│   ├── PostView.vue        # 文章详情页
│   └── AboutView.vue       # 关于页
├── App.vue          # 根组件（返回顶部按钮）
└── main.ts          # 应用入口
```

## 快速开始

```sh
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查 + 生产构建
npm run build

# 预览构建结果
npm run preview

# 代码检查
npm run lint
```

## 设计说明

- **色彩**：首页深色渐变 `#0f172a → #1e1b4b → #312e81`，内容页浅灰白 `#f8fafc`，强调色蓝 `#3b82f6`
- **动效**：统一使用 `cubic-bezier(0.4, 0, 0.2, 1)` 物理感缓动曲线，支持 `prefers-reduced-motion` 无障碍降级
- **响应式**：适配桌面、平板、移动端三档断点
