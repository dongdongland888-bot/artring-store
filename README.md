# ArtRing Store - 艺术戒指电商独立站

一个完整的电商独立站项目，专注于销售艺术戒指。参考 Ana Luisa、Missoma 等成功的 DTC 珠宝品牌设计。

## ✨ 特性

- 🎨 **时尚设计** - 现代简约的 UI 设计，突出产品美感
- 🛒 **完整购物流程** - 浏览、加入购物车、结算、支付
- 👤 **用户系统** - 注册、登录、个人中心、订单管理
- 💳 **Stripe 支付** - 安全可靠的信用卡支付
- 📱 **响应式设计** - 完美适配桌面和移动端（44px 触控目标）
- ⚡ **高性能** - Redis 缓存，优化的数据库查询，乐观更新
- 🎯 **管理后台** - 完整的商品、订单、用户管理系统
- 🔒 **完善的错误处理** - 智能错误提示，自动恢复，防止应用崩溃

## 🛠️ 技术栈

### 前端

- Vue 3 + Vite
- TailwindCSS + Headless UI
- Pinia (状态管理 + 持久化)
- Vue Router (路由 + 守卫)
- Axios (HTTP 客户端)
- vue-toastification (全局通知)
- @heroicons/vue (图标库)

### 后端

- Node.js + Express
- Prisma ORM
- MySQL 8.0
- Redis 7.0
- JWT 认证
- Stripe 支付集成

### DevOps

- Docker + Docker Compose
- Nginx (前端反向代理)
- Multi-stage Docker 构建

## 📦 安装

### 前置要求

- Node.js 18+
- MySQL 8.0
- Redis 7.0
- Docker (可选)

### 一键部署 (推荐)

```bash
# 克隆项目
git clone https://github.com/dongdongland888-bot/artring-store.git
cd artring-store

# 执行部署脚本（自动启动所有服务，初始化数据库）
./deploy.sh

# 或者直接使用 Docker Compose
docker compose up -d
```

访问地址：

- 🏪 **前台**: http://localhost
- 🏢 **管理后台**: http://localhost/admin
- 📊 **API**: http://localhost/api

### 手动安装

#### 1. 后端

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填写数据库连接等信息

# 初始化数据库
npx prisma db push
npm run db:seed

# 启动开发服务器
npm run dev
```

#### 2. 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build
```

## 🗄️ 数据库

### 初始化

```bash
cd backend

# 同步数据库结构
npx prisma db push

# 生成测试数据
npm run db:seed

# 打开 Prisma Studio 查看数据
npm run db:studio
```

### 默认账户

- **管理员**: admin@artring.com / admin123
- **普通用户**: customer@example.com / password123

## 📁 项目结构

```
artring-store/
├── frontend/                          # Vue 3 前端
│   ├── src/
│   │   ├── api/                       # API 客户端 + 错误处理
│   │   ├── assets/                    # 静态资源 + 全局样式
│   │   ├── components/
│   │   │   ├── cart/                  # 购物车抽屉（Body锁定）
│   │   │   ├── layout/                # Navbar、Footer、MobileMenu
│   │   │   ├── product/               # ProductCard
│   │   │   └── search/                # SearchModal
│   │   ├── composables/               # useBodyScrollLock 等
│   │   ├── router/                    # 路由 + 守卫 + 异步用户恢复
│   │   ├── stores/                    # Pinia (auth、cart、state)
│   │   ├── views/
│   │   │   ├── auth/                  # Login + Register (完整验证)
│   │   │   ├── admin/                 # 管理后台 (Dashboard、Products等)
│   │   │   ├── account/               # 用户中心 (Addresses、Orders等)
│   │   │   ├── Home.vue               # 首页 (响应式)
│   │   │   ├── Shop.vue               # 商品列表 (移动端筛选)
│   │   │   ├── ProductDetail.vue      # 商品详情 (库存限制)
│   │   │   ├── Cart.vue               # 购物车页面 (响应式)
│   │   │   ├── Checkout.vue           # 结算页面 (订单确认)
│   │   │   └── ...
│   │   └── App.vue                    # 路由进度条 + 返回顶部
│   ├── Dockerfile                     # Multi-stage 构建
│   ├── nginx.conf                     # Nginx 反向代理配置
│   └── package.json
│
├── backend/                            # Node.js 后端
│   ├── src/
│   │   ├── routes/
│   │   │   ├── admin.js               # 管理接口 + 直接查询优化
│   │   │   ├── auth.js                # 认证接口
│   │   │   ├── products.js            # 商品接口
│   │   │   ├── orders.js              # 订单接口
│   │   │   ├── cart.js                # 购物车接口
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT 验证 + 角色检查
│   │   │   ├── errorHandler.js        # 统一错误处理
│   │   │   └── ...
│   │   ├── index.js                   # 主应用 + CORS + 中间件
│   │   └── ...
│   ├── prisma/
│   │   ├── schema.prisma              # 数据库模型
│   │   └── seed.js                    # 种子数据 (管理员、商品等)
│   ├── Dockerfile                     # Alpine + OpenSSL
│   ├── docker-entrypoint.sh           # 数据库初始化脚本
│   └── package.json
│
├── docker-compose.yml                 # 健康检查 + 正确顺序
├── deploy.sh                          # 一键部署脚本
├── OPTIMIZATION_CHANGES.md            # 优化详细记录
└── README.md
```

## 🔧 配置

### 环境变量 (backend/.env)

```env
# 服务器
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# 数据库
DATABASE_URL="mysql://root:password@mysql:3306/artring_store"

# Redis
REDIS_URL="redis://redis:6379"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# 前端
FRONTEND_URL="http://localhost"
```

## 💡 主要优化亮点

### 🎯 用户体验

- **乐观更新** - 购物车操作立即反馈，无需等待
- **智能错误提示** - 详细的错误消息，指导用户操作
- **加载反馈** - 进度条、Skeleton、加载中状态
- **密码强度指示** - 注册时实时反馈密码强度
- **库存提示** - "缺货"、"仅剩 X 件"、"库存充足"

### 📱 移动端

- **44px 触控目标** - 符合 Apple HIG 标准
- **16px 字体** - iOS 中防止自动放大
- **响应式布局** - 所有关键页面完美适配
- **移动端筛选抽屉** - 隐藏筛选条件，节省空间

### 🔒 安全性

- **CORS 配置** - 仅允许指定前端域名
- **JWT 认证** - 安全的用户会话管理
- **HTTPS 就绪** - 支持 SSL/TLS 部署
- **输入验证** - 前后端双重验证

### ⚡ 性能

- **Redis 缓存** - 常用数据缓存
- **数据库查询优化** - 避免 N+1 查询
- **Docker 构建优化** - Multi-stage 减少镜像大小
- **前端资源优化** - Vite 自动分割、压缩

### 🏢 管理后台

- **Dashboard** - 实时统计数据
- **商品管理** - 完整的 CRUD 操作，支持变体和图片
- **订单管理** - 查看、更新状态、物流跟踪
- **用户管理** - 搜索、角色管理、启禁用
- **分类管理** - 完整的分类系统

## 📱 页面预览

### 前台

- **首页** - Hero Banner + 特色分类 + 新品 + 畅销
- **商品列表** - 筛选 + 排序 + 分页（移动端抽屉）
- **商品详情** - 多图 + 规格选择 + 库存限制 + 加入购物车
- **购物车** - 乐观更新 + 数量调整 + 删除确认 + 小计
- **结算** - 地址管理 + 订单确认 + 支付集成
- **用户中心** - 订单管理 + 地址簿 + 收藏列表 + 设置

### 管理后台

- **Dashboard** - 销售统计 + 最近订单
- **商品管理** - 列表 + 搜索 + 创建/编辑 + 变体/图片管理
- **订单管理** - 列表 + 筛选 + 详情 + 状态更新 + 物流跟踪
- **用户管理** - 搜索 + 角色切换 + 启禁用
- **分类管理** - 创建/编辑 + 排序 + 启禁用

## 🚀 部署

### 生产环境构建

```bash
# 前端构建
cd frontend
npm run build

# 后端准备
cd backend
npm ci --only=production
```

### Docker 部署

```bash
# 使用 deploy.sh 一键部署
./deploy.sh

# 或手动使用 docker compose
docker compose up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 服务访问

```
前台: http://localhost
管理后台: http://localhost/admin
API: http://localhost/api
```

## 📊 API 文档

### 认证

| Method | Endpoint           | Description  |
| ------ | ------------------ | ------------ |
| POST   | /api/auth/register | 用户注册     |
| POST   | /api/auth/login    | 用户登录     |
| GET    | /api/auth/me       | 获取当前用户 |
| PUT    | /api/auth/me       | 更新用户信息 |
| PUT    | /api/auth/password | 修改密码     |

### 商品

| Method | Endpoint                       | Description                  |
| ------ | ------------------------------ | ---------------------------- |
| GET    | /api/products                  | 商品列表（分页、筛选、搜索） |
| GET    | /api/products/:slug            | 商品详情                     |
| GET    | /api/products/featured/list    | 特色商品                     |
| GET    | /api/products/bestsellers/list | 畅销商品                     |
| GET    | /api/products/new/list         | 新品商品                     |

### 购物车

| Method | Endpoint      | Description |
| ------ | ------------- | ----------- |
| GET    | /api/cart     | 获取购物车  |
| POST   | /api/cart     | 添加商品    |
| PUT    | /api/cart/:id | 更新数量    |
| DELETE | /api/cart/:id | 删除商品    |
| DELETE | /api/cart     | 清空购物车  |

### 订单

| Method | Endpoint                        | Description |
| ------ | ------------------------------- | ----------- |
| GET    | /api/orders                     | 订单列表    |
| POST   | /api/orders                     | 创建订单    |
| GET    | /api/orders/:orderNumber        | 订单详情    |
| PUT    | /api/orders/:orderNumber/cancel | 取消订单    |

### 管理接口

| Method | Endpoint                     | Description      |
| ------ | ---------------------------- | ---------------- |
| GET    | /api/admin/dashboard         | 仪表板统计       |
| GET    | /api/admin/products          | 商品列表（管理） |
| POST   | /api/admin/products          | 创建商品         |
| GET    | /api/admin/products/:id      | 商品详情（管理） |
| PUT    | /api/admin/products/:id      | 更新商品         |
| GET    | /api/admin/orders            | 订单列表（管理） |
| GET    | /api/admin/orders/:id        | 订单详情（管理） |
| PUT    | /api/admin/orders/:id/status | 更新订单状态     |
| GET    | /api/admin/users             | 用户列表         |
| PUT    | /api/admin/users/:id         | 更新用户信息     |

## 🐛 已知问题 & 改进

### 已修复

- ✅ 401 错误不再导致页面刷新
- ✅ OrderDetail 不再一次性加载所有订单
- ✅ ProductForm 编辑模式正确保存变体和图片
- ✅ Admin 页面加载状态完整
- ✅ 购物车操作立即反馈（乐观更新）

### 未来改进

- [ ] 推荐系统（基于浏览历史）
- [ ] 库存实时更新（WebSocket）
- [ ] 订单物流跟踪（第三方集成）
- [ ] 多语言支持
- [ ] SEO 优化（Server-side rendering）

## 📄 License

MIT License

---

**Made with ❤️ by ArtRing Team**

最后更新：2026-02-09 | 优化版本：v2.0
