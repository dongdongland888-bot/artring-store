import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import path from 'path';
import { fileURLToPath } from 'url';

// 路由导入
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';

// 中间件
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

// 根据 NODE_ENV 从项目根目录加载不同环境配置：
// - test     → .env.test
// - 其他环境 → .env.production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(
    __dirname,
    process.env.NODE_ENV === 'test' ? '../../.env.test' : '../../.env.production'
  )
});

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化 Prisma
export const prisma = new PrismaClient();

// 初始化 Redis
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

// 中间件配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// 静态文件
app.use('/uploads', express.static('uploads'));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'ArtRing Store API'
  });
});

// 错误处理
app.use(errorHandler);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
  🎨 ArtRing Store API Server
  ===========================
  🚀 Server running on port ${PORT}
  📝 Environment: ${process.env.NODE_ENV || 'development'}
  🔗 API: http://localhost:${PORT}/api
  `);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});
