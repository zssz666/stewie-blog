# Stewie Blog 后端与数据库过程设计

> Senior Developer 出品 · 2026-07-06
> 技术选型：Spring Boot + MySQL + 全功能（认证 / 评论 / 点赞浏览量 / 搜索）

---

## 一、技术栈选型

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|---------|
| 框架 | Spring Boot | 3.2.x | Java 生态最成熟，自动配置省心 |
| 语言 | Java | 17 (LTS) | 长期支持，record/密封类等新特性可用 |
| 数据库 | MySQL | 8.0 | 用户指定，全文索引支持中文（ngram） |
| ORM | MyBatis-Plus | 3.5.x | 国内主流，代码生成 + 条件构造器高效 |
| 认证 | Spring Security + JWT | 6.x | 无状态认证，前后端分离友好 |
| 缓存 | Redis | 7.x（可选） | 浏览量/点赞去重、热点文章缓存 |
| 文档 | Knife4j | 4.x | Swagger 增强，中文 UI 友好 |
| 构建 | Maven | 3.9 | 依赖管理稳定 |
| 迁移 | Flyway | 9.x | 数据库版本管理，可重复部署 |

---

## 二、数据库设计（9 张表）

### 2.1 表清单

| 表名 | 说明 | 记录量级 |
|------|------|---------|
| t_user | 管理员账户 | 极少（1-3 条） |
| t_post | 文章主体 | 中（百级） |
| t_category | 分类 | 极少（5-10 条） |
| t_tag | 标签 | 少（20-50 条） |
| t_post_tag | 文章-标签多对多 | 中 |
| t_comment | 评论 | 中-大 |
| t_author | 作者信息（关于页） | 1 条 |
| t_social_link | 社交链接 | 少 |
| t_like_record | 点赞记录（防刷） | 大 |

### 2.2 核心表字段详解

**t_post（文章表）** —— 对齐前端 `Post` 接口
```
id            bigint       PK, AUTO_INCREMENT
slug          varchar(100) UNIQUE, 用于 URL 友好路径
title         varchar(200) NOT NULL
excerpt       text         摘要
content       longtext     正文 HTML
cover_color   varchar(20)  封面色值
category_id   bigint       FK → t_category.id
publish_date  date         发布日期（前端展示用）
reading_time  int          阅读时长（分钟，可自动计算）
views         bigint       浏览量，默认 0
likes         bigint       点赞数，默认 0
status        tinyint      0=草稿 1=已发布
created_at    datetime
updated_at    datetime
published_at  datetime     发布时间戳
```
索引：`slug`（唯一）、`category_id`、`status`、`published_at DESC`、`FULLTEXT(title, content)` 用 ngram 解析器

**t_comment（评论表）** —— 支持楼中楼
```
id          bigint      PK
post_id     bigint      FK → t_post.id
parent_id   bigint      FK → t_comment.id（顶级评论为 NULL）
nickname    varchar(50) 评论者昵称
email       varchar(100) 邮箱（不公开显示）
content     text        评论内容
status      tinyint     0=待审核 1=已通过 2=垃圾
ip          varchar(45) 评论者 IP
created_at  datetime
```

**t_like_record（点赞记录）** —— 防重复点赞
```
id           bigint      PK
post_id      bigint      FK → t_post.id
fingerprint  varchar(64) 用户指纹（IP+UA hash）
created_at   datetime
UNIQUE KEY (post_id, fingerprint)  -- 同一指纹对同一文章只能赞一次
```

### 2.3 前端数据映射

| 前端字段 | 数据库来源 | 说明 |
|---------|-----------|------|
| Post.tag | t_tag.name（经 t_post_tag 关联） | 前端单标签，后端可多标签 |
| Post.category | t_category.name | 独立表管理 |
| Post.date | t_post.publish_date | |
| Author.skills | t_author.skills (JSON) | 数组存 JSON |
| Author.socials | t_social_link 关联查询 | |

---

## 三、API 设计

### 3.1 公开 API（无需认证）

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | /api/posts | 文章列表（分页 + 标签/分类筛选） |
| GET | /api/posts/{slug} | 文章详情（views +1） |
| GET | /api/posts/popular | 热门文章 Top N |
| GET | /api/categories | 分类列表 |
| GET | /api/tags | 标签列表 |
| GET | /api/search?q=&page= | 全文搜索 |
| POST | /api/posts/{id}/like | 点赞（带指纹去重） |
| GET | /api/posts/{id}/comments | 评论列表（树形） |
| POST | /api/posts/{id}/comments | 提交评论（待审核） |
| GET | /api/author | 作者信息 + 社交链接 |

### 3.2 管理 API（需 JWT）

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | /api/auth/login | 登录获取 token |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/info | 当前用户信息 |
| POST | /api/admin/posts | 新建文章 |
| PUT | /api/admin/posts/{id} | 更新文章 |
| DELETE | /api/admin/posts/{id} | 删除文章 |
| GET | /api/admin/comments | 评论列表（含待审核） |
| PUT | /api/admin/comments/{id} | 审核评论 |
| DELETE | /api/admin/comments/{id} | 删除评论 |
| PUT | /api/admin/author | 更新作者信息 |

### 3.3 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": 1779990000000
}
```
分页响应额外包含 `data.list`、`data.total`、`data.page`、`data.size`。

---

## 四、实施阶段（8 阶段）

### 阶段 1：项目初始化与基础设施
- Spring Initializr 生成项目（Web/Validation/Lombok/MySQL Driver）
- 引入 MyBatis-Plus、Spring Security、JWT、Knife4j、Flyway
- 配置 `application.yml`（多环境：dev/prod）
- 统一响应体 `Result<T>` + 全局异常处理器
- CORS 跨域配置（允许前端 5173 端口）
- Knife4j 文档接入

### 阶段 2：数据库设计与建表
- 编写 Flyway 迁移脚本 `V1__init_schema.sql`
- 创建 9 张表 + 索引 + 外键
- 编写 `V2__seed_data.sql` 种子数据
  - 从前端 `posts.ts` 迁移 6 篇文章
  - 初始化管理员账号（BCrypt 加密密码）
  - 初始化作者信息、分类、标签
- MyBatis-Plus 代码生成器生成 Entity/Mapper/Service

### 阶段 3：核心业务模块
- 文章模块：列表（分页/筛选/排序）、详情、热门
- 分类标签模块：CRUD + 文章计数
- 作者信息模块：查询 + 更新
- DTO 设计：`PostVO`（前端视图）、`PostDTO`（管理输入）
- 单元测试（Service 层）

### 阶段 4：认证授权
- Spring Security 配置（放行公开 API，拦截管理 API）
- `JwtAuthenticationFilter` JWT 过滤器
- `JwtUtil` 工具类（生成/验证/刷新 token）
- 登录接口 + 密码 BCrypt 校验
- 自定义 `@RequiresAuth` 注解（可选）

### 阶段 5：互动模块
- 评论模块：提交（待审核）、树形查询、审核、删除
- 点赞模块：指纹去重、t_post.likes 同步更新
- 浏览量：Redis 计数 + 定时刷回 MySQL（高并发优化）
  - 单机版可简化为直接 UPDATE +1

### 阶段 6：搜索功能
- MySQL FULLTEXT 索引（ngram 解析器，支持中文）
- 搜索接口：关键词高亮、相关性排序
- 标签/分类筛选复用文章列表接口

### 阶段 7：前端对接
- 新建 `src/api/` 目录，封装 axios 请求层
  - 请求/响应拦截器、token 注入、错误统一处理
- `src/stores/` 新增 auth、posts 等 store
- 替换 `src/data/posts.ts` 静态数据为 API 调用
- 文章详情页接入真实浏览量/点赞/评论
- 管理后台路由 + 登录页（新增）

### 阶段 8：部署与优化
- Maven 打包 `mvn clean package`
- Nginx 反向代理：`/api/*` → Spring Boot，`/*` → 静态前端
- PM2/Systemd 守护 Java 进程
- 安全加固：HTTPS、SQL 注入防护、XSS 过滤、限流
- 性能优化：Redis 缓存热点文章、Gzip 压缩、连接池调优

---

## 五、项目结构

```
stewie-blog-server/
├── src/main/java/com/stewie/blog/
│   ├── config/           # 配置类（Security/CORS/Mybatis/Knife4j）
│   ├── common/           # 通用（Result/异常/枚举/常量）
│   ├── security/         # JWT 过滤器、工具类、UserDetailsService
│   ├── controller/
│   │   ├── pub/          # 公开 API
│   │   └── admin/        # 管理 API
│   ├── service/
│   │   └── impl/
│   ├── mapper/           # MyBatis-Plus Mapper
│   ├── entity/           # 数据库实体
│   ├── dto/              # 数据传输对象
│   │   ├── vo/           # 返回视图
│   │   └── req/          # 请求参数
│   └── util/             # 工具类
├── src/main/resources/
│   ├── db/migration/     # Flyway 脚本
│   ├── application.yml
│   ├── application-dev.yml
│   └── application-prod.yml
└── pom.xml
```

---

## 六、关键决策说明

1. **分类独立成表**：前端 `category` 是字符串，后端独立表便于管理和文章计数。API 返回时 join 出 name。

2. **标签多对多**：前端 `tag` 单字段，但后端设计为多对多以支持未来扩展。API 当前返回首个标签兼容前端。

3. **点赞用指纹去重**：`IP + User-Agent` hash 作为指纹，UNIQUE 约束防重复。比登录点赞门槛低，比纯计数防刷强。

4. **浏览量 Redis 缓冲**：高并发下直接 UPDATE 会成瓶颈。Redis 累积 + 定时批量刷库。个人博客可先用直接 UPDATE，预留优化空间。

5. **评论审核机制**：默认 `status=0` 待审核，管理后台审核后展示。防垃圾评论。

6. **Flyway 版本管理**：数据库变更走迁移脚本，可重复部署、团队协作、回滚可控。

---

## 七、后续可选扩展

- [ ] 图片上传（本地/OSS/COS）
- [ ] Markdown 编辑器接入管理后台
- [ ] 邮件通知（新评论提醒）
- [ ] RSS 订阅
- [ ] 站点地图（SEO）
- [ ] 数据统计仪表盘

---

**Senior Developer** · 过程设计已就绪，待确认后即可进入阶段 1 实施
