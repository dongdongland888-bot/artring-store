import express from 'express';
import { prisma, redis } from '../index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// 获取所有分类
router.get('/', asyncHandler(async (req, res) => {
  // 尝试从缓存获取
  const cached = await redis.get('categories:all');
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      },
      _count: {
        select: { products: true }
      }
    }
  });

  // 只返回顶级分类 (带子分类)
  const topLevel = categories.filter(c => !c.parentId);

  // 缓存1小时
  await redis.setex('categories:all', 3600, JSON.stringify(topLevel));

  res.json(topLevel);
}));

// 获取单个分类
router.get('/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      },
      parent: true
    }
  });

  if (!category || !category.isActive) {
    return res.status(404).json({ error: '分类不存在' });
  }

  res.json(category);
}));

// 获取分类下的商品
router.get('/:slug/products', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { page = 1, limit = 12, sort = 'newest' } = req.query;

  const category = await prisma.category.findUnique({
    where: { slug }
  });

  if (!category || !category.isActive) {
    return res.status(404).json({ error: '分类不存在' });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const orderBy = {
    newest: { createdAt: 'desc' },
    priceAsc: { basePrice: 'asc' },
    priceDesc: { basePrice: 'desc' },
    popular: { totalSold: 'desc' }
  }[sort] || { createdAt: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: category.id
      },
      skip,
      take,
      orderBy,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1
        },
        variants: {
          where: { isActive: true }
        }
      }
    }),
    prisma.product.count({
      where: {
        isActive: true,
        categoryId: category.id
      }
    })
  ]);

  res.json({
    category,
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / take)
    }
  });
}));

export default router;
