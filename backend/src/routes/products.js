import express from 'express';
import { prisma, redis } from '../index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// 获取商品列表
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    material,
    style,
    minPrice,
    maxPrice,
    sort = 'newest',
    search
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // 构建查询条件
  const where = {
    isActive: true,
    ...(category && { category: { slug: category } }),
    ...(material && { material }),
    ...(style && { style }),
    ...(minPrice && { basePrice: { gte: parseFloat(minPrice) } }),
    ...(maxPrice && { basePrice: { lte: parseFloat(maxPrice) } }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    })
  };

  // 排序
  const orderBy = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    priceAsc: { basePrice: 'asc' },
    priceDesc: { basePrice: 'desc' },
    popular: { totalSold: 'desc' },
    rating: { avgRating: 'desc' }
  }[sort] || { createdAt: 'desc' };

  // 查询商品
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        images: {
          where: { isPrimary: true },
          take: 1
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            size: true,
            color: true,
            price: true,
            stock: true
          }
        }
      }
    }),
    prisma.product.count({ where })
  ]);

  res.json({
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / take)
    }
  });
}));

// 获取单个商品详情
router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // 尝试从缓存获取
  const cacheKey = `product:${slug}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' }
      },
      variants: {
        where: { isActive: true },
        orderBy: { size: 'asc' }
      },
      reviews: {
        where: { isApproved: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      }
    }
  });

  if (!product || !product.isActive) {
    return res.status(404).json({ error: '商品不存在' });
  }

  // 缓存1小时
  await redis.setex(cacheKey, 3600, JSON.stringify(product));

  res.json(product);
}));

// 获取特色商品
router.get('/featured/list', asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true
    },
    take: parseInt(limit),
    orderBy: { createdAt: 'desc' },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1
      }
    }
  });

  res.json(products);
}));

// 获取畅销商品
router.get('/bestsellers/list', asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: parseInt(limit),
    orderBy: { totalSold: 'desc' },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1
      }
    }
  });

  res.json(products);
}));

// 获取新品
router.get('/new/list', asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: parseInt(limit),
    orderBy: { createdAt: 'desc' },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1
      }
    }
  });

  res.json(products);
}));

// 获取相关商品
router.get('/:id/related', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 4 } = req.query;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { categoryId: true, material: true, style: true }
  });

  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: id },
      OR: [
        { categoryId: product.categoryId },
        { material: product.material },
        { style: product.style }
      ]
    },
    take: parseInt(limit),
    orderBy: { totalSold: 'desc' },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1
      }
    }
  });

  res.json(relatedProducts);
}));

export default router;
