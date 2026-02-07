# ArtRing Store - 艺术戒指电商独立站

一个完整的电商独立站项目，专注于销售艺术戒指。参考 Ana Luisa、Missoma 等成功的 DTC 珠宝品牌设计。

## ✨ 特性

- 🎨 **时尚设计** - 现代简约的 UI 设计，突出产品美感
- 🛒 **完整购物流程** - 浏览、加入购物车、结算、支付
- 👤 **用户系统** - 注册、登录、个人中心、订单管理
- 💳 **Stripe 支付** - 安全可靠的信用卡支付
- 📱 **响应式设计** - 完美适配桌面和移动端
- ⚡ **高性能** - Redis 缓存，优化的数据库查询

## 🛠️ 技术栈

### 前端
- Vue 3 + Vite
- TailwindCSS + Headless UI
- Pinia (状态管理)
- Vue Router

### 后端
- Node.js + Express
- Prisma ORM
- MySQL 8.0
- Redis 7.0
- JWT 认证

## 📦 安装

### 前置要求

- Node.js 18+
- MySQL 8.0
- Redis 7.0
- Docker (可选)

### 使用 Docker (推荐)

```bash
# 克隆项目
git clone https://github.com/your-username/artring-store.git
cd artring-store

# 启动所有服务
docker-compose up -d

# 初始化数据库
docker-compose exec backend npx prisma db push
docker-compose exec backend npm run db:seed
```

访问: http://localhost

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

## 📁 项目结构

```
artring-store/
├── frontend/                 # Vue 3 前端
│   ├── src/
│   │   ├── api/             # API 接口
│   │   ├── assets/          # 静态资源
│   │   ├── components/      # 组件
│   │   │   ├── cart/        # 购物车组件
│   │   │   ├── layout/      # 布局组件
│   │   │   └── product/     # 商品组件
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # Pinia 状态
│   │   ├── views/           # 页面
│   │   └── App.vue
│   └── package.json
│
├── backend/                  # Node.js 后端
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/      # 中间件
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务逻辑
│   │   └── index.js
│   ├── prisma/
│   │   ├── schema.prisma    # 数据库模型
│   │   └── seed.js          # 种子数据
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

## 🔧 配置

### 环境变量 (backend/.env)

```env
# 服务器
PORT=3000
NODE_ENV=development

# 数据库
DATABASE_URL="mysql://root:password@localhost:3306/artring_store"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# 前端URL
FRONTEND_URL="http://localhost:5173"
```

## 📱 页面预览

- **首页** - Hero Banner + 特色分类 + 新品 + 畅销
- **商品列表** - 筛选 + 排序 + 分页
- **商品详情** - 多图 + 规格选择 + 加入购物车
- **购物车** - 数量调整 + 删除 + 小计
- **结算** - 地址选择 + 订单摘要 + 支付
- **用户中心** - 订单 + 地址 + 收藏 + 设置

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
docker-compose -f docker-compose.yml up -d
```

## 📝 API 文档

### 认证

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |

### 商品

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | 商品列表 |
| GET | /api/products/:slug | 商品详情 |
| GET | /api/products/featured/list | 特色商品 |

### 购物车

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/cart | 获取购物车 |
| POST | /api/cart | 添加商品 |
| PUT | /api/cart/:id | 更新数量 |
| DELETE | /api/cart/:id | 删除商品 |

### 订单

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders | 订单列表 |
| POST | /api/orders | 创建订单 |
| GET | /api/orders/:orderNumber | 订单详情 |

## 📄 License

MIT License

---

Made with ❤️ by ArtRing Team
