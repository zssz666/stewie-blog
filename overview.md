# Stewie Blog · UI 重新设计概览

> 由 UI Designer 完成 · 2026-07-06
> 参考风格：[burgess-t.cn](https://burgess-t.cn/) 简洁阅读型博客

## 一、设计目标

在保留博客核心功能（文章列表、文章详情、分类标签、关于页）的前提下，重新设计视觉系统，使其：

- **更优雅**：从冷硬科技感转向柔和阅读型质感
- **更舒适**：优化配色、字体、留白，提升长时间阅读体验
- **更精致**：细化圆角、阴影、动效的层次表现
- **更一致**：建立完整的设计令牌系统，保证全局视觉统一

---

## 二、核心设计决策

### 1. 配色系统调整

| 旧值 | 新值 | 变化说明 |
|------|------|---------|
| 主色 `#3b82f6`（亮蓝） | `#2563eb`（稳重蓝） | 更稳重，符合阅读型博客气质 |
| 无强调色 | `#f59e0b`（暖琥珀） | 新增暖色点缀，增加温度感 |
| 背景偏冷灰 | `#fafbfc`（暖白） | 更柔和的背景层次 |
| 圆角 4-8px | 6-20px | 更大圆角，视觉更柔和 |
| 阴影单一 | 五层阴影系统 | xs/sm/md/lg/xl 精细层次 |

### 2. 字体系统升级

- **引入 Google Fonts**：Inter（无衬线）+ Lora（衬线）+ JetBrains Mono（等宽）
- 中文优先：苹方 / 思源黑体 / 微软雅黑
- 字号层级：xs(12) → sm(14) → base(16) → lg(18) → xl(20) → 2xl(24) → 3xl(30) → 4xl(40)
- 字距优化：标题 `-0.02em`，正文 `0.01em`，提升阅读节奏

### 3. 视觉风格特征

- **Hero 区**：保留视觉冲击力，但优化为网格点阵 + 浮动光斑 + 渐变叠加
- **卡片系统**：更精致的圆角、层次化阴影、悬停微动效
- **导航栏**：毛玻璃模糊增强（blur 16px + saturate 180%），过渡更自然
- **文章排版**：h2 带渐变左侧装饰条，blockquote 引号水印，列表自定义圆点
- **代码块**：macOS 风格窗口 + 复制反馈动效

---

## 三、改动文件清单

### 基础层
- `src/assets/base.css` — 设计令牌系统重构（配色/字体/圆角/阴影/动效）
- `src/assets/main.css` — 全局样式优化（按钮/链接/文章排版/代码块）
- `index.html` — 引入 Google Fonts，更新 theme-color

### 组件层
- `src/App.vue` — 返回顶部按钮样式优化
- `src/components/AppNavbar.vue` — 导航栏毛玻璃增强、Logo 重设计
- `src/components/AppFooter.vue` — 页脚布局重构、社交图标化
- `src/components/PostCard.vue` — 文章卡片重设计（封面图标/元信息图标化）
- `src/components/ProfileCard.vue` — 资料卡顶部装饰条
- `src/components/PopularPosts.vue` — 热门文章前三名徽章化
- `src/components/CategoryFilter.vue` — 分类筛选容器化设计

### 视图层
- `src/views/HomeView.vue` — Hero 区重设计（徽章/统计/网格点阵）
- `src/views/ArticlesView.vue` — 欢迎区装饰、文章计数、空状态优化
- `src/views/PostView.vue` — Banner 网格、摘要图标、TOC 优化、点赞交互
- `src/views/AboutView.vue` — 章节标题、时间线渐变线、技能悬停动效

---

## 四、无障碍与性能

### WCAG AA 合规
- 所有文字配色对比度 ≥ 4.5:1
- 焦点可见性：`:focus-visible` 全局样式
- 语义化 HTML + ARIA 标签
- 触摸目标 ≥ 38px

### 动效尊重用户偏好
- 全部动效支持 `prefers-reduced-motion: reduce`
- 关闭动画时降级为即时响应

### 性能优化
- Google Fonts 使用 `preconnect` + `display=swap`
- 字体特性 `cv11, ss01` 优化渲染
- 构建产物 CSS 总计 ~52KB（gzip ~12KB）

---

## 五、构建验证

```
✓ 71 modules transformed
✓ built in 2.15s
✓ 0 errors, 0 warnings
```

构建产物已生成至 `dist/`，开发服务器运行在 `http://localhost:5173/`。

---

## 六、后续可优化项

1. **图片资源**：当前文章封面用纯色渐变，后续可接入真实封面图
2. **搜索功能**：可增加全局搜索入口
3. **评论系统**：当前评论按钮为占位，可接入 Giscus/Valine
4. **SEO 优化**：可增加 OG 标签、结构化数据
5. **PWA**：可配置 Service Worker 支持离线访问

---

**UI Designer** · 设计系统已就绪，可交付开发实现
