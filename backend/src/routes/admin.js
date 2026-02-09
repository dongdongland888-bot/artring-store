import express from 'express';
import { prisma, redis } from '../index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 所有管理路由需要认证和管理权限
router.use(authenticate);
router.use(requireAdmin);

// ==================== 仪表盘 ====================

router.get('/dashboard', asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    totalOrders,
    totalUsers,
    todayOrders,
    totalRevenue,
    pendingOrders,
    recentOrders
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { total: true }
    }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } }
      }
    })
  ]);

  res.json({
    stats: {
      totalProducts,
      totalOrders,
      totalUsers,
      todayOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingOrders
    },
    recentOrders
  });
}));

// ==================== 商品管理 ====================

// 获取商品列表 (管理员)
router.get('/products', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, category, isActive } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } }
      ]
    }),
    ...(category && { categoryId: category }),
    ...(isActive !== undefined && { isActive: isActive === 'true' })
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: { take: 1 },
        _count: { select: { variants: true } }
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

// 创建商品
router.post('/products', asyncHandler(async (req, res) => {
  const {
    name, slug, description, shortDesc, material, style,
    basePrice, comparePrice, costPrice, categoryId,
    isFeatured, variants, images
  } = req.body;

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      shortDesc,
      material,
      style,
      basePrice,
      comparePrice,
      costPrice,
      categoryId,
      isFeatured,
      variants: variants ? {
        create: variants.map((v, i) => ({
          sku: v.sku || `${slug}-${i}`,
          size: v.size,
          color: v.color,
          material: v.material,
          price: v.price || basePrice,
          stock: v.stock || 0
        }))
      } : undefined,
      images: images ? {
        create: images.map((img, i) => ({
          url: img.url,
          alt: img.alt || name,
          sortOrder: i,
          isPrimary: i === 0
        }))
      } : undefined
    },
    include: {
      variants: true,
      images: true,
      category: true
    }
  });

  // 清除缓存
  await redis.del('categories:all');

  res.status(201).json({
    message: '商品创建成功',
    product
  });
}));

// 更新商品
router.put('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name, slug, description, shortDesc, material, style,
    basePrice, comparePrice, costPrice, categoryId,
    isFeatured, isActive
  } = req.body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      shortDesc,
      material,
      style,
      basePrice,
      comparePrice,
      costPrice,
      categoryId,
      isFeatured,
      isActive
    },
    include: {
      variants: true,
      images: true,
      category: true
    }
  });

  // 清除缓存
  await redis.del(`product:${slug}`);
  await redis.del('categories:all');

  res.json({
    message: '商品更新成功',
    product
  });
}));

// 删除商品
router.delete('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id }
  });

  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }

  // 软删除
  await prisma.product.update({
    where: { id },
    data: { isActive: false }
  });

  // 清除缓存
  await redis.del(`product:${product.slug}`);

  res.json({ message: '商品已删除' });
}));

// 获取单个商品详情 (管理员)
router.get('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: { orderBy: { createdAt: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } }
    }
  });

  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }

  res.json(product);
}));

// ==================== 商品变体管理 ====================

router.post('/products/:id/variants', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sku, size, color, material, price, stock } = req.body;

  const variant = await prisma.productVariant.create({
    data: { productId: id, sku, size, color, material, price, stock: stock || 0 }
  });

  res.status(201).json({ message: '变体创建成功', variant });
}));

router.put('/products/:productId/variants/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sku, size, color, material, price, stock, isActive } = req.body;

  const variant = await prisma.productVariant.update({
    where: { id },
    data: { sku, size, color, material, price, stock, isActive }
  });

  res.json({ message: '变体更新成功', variant });
}));

router.delete('/products/:productId/variants/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.productVariant.delete({ where: { id } });
  res.json({ message: '变体已删除' });
}));

// ==================== 商品图片管理 ====================

router.post('/products/:id/images', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { url, alt, isPrimary } = req.body;

  if (isPrimary) {
    await prisma.productImage.updateMany({
      where: { productId: id },
      data: { isPrimary: false }
    });
  }

  const count = await prisma.productImage.count({ where: { productId: id } });
  const image = await prisma.productImage.create({
    data: { productId: id, url, alt, sortOrder: count, isPrimary: isPrimary || count === 0 }
  });

  res.status(201).json({ message: '图片添加成功', image });
}));

router.delete('/products/:productId/images/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.productImage.delete({ where: { id } });
  res.json({ message: '图片已删除' });
}));

// ==================== 订单管理 ====================

// 获取订单列表
router.get('/orders', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    ...(status && { status }),
    ...(paymentStatus && { paymentStatus })
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        items: { include: { product: true } }
      }
    }),
    prisma.order.count({ where })
  ]);

  res.json({
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / take)
    }
  });
}));

// 获取单个订单详情
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: { take: 1, orderBy: { sortOrder: 'asc' } }
            }
          }
        }
      },
      shippingAddress: true
    }
  });

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  res.json(order);
}));

// 更新订单状态
router.put('/orders/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, trackingNumber } = req.body;

  const updateData = { status };

  if (status === 'SHIPPED') {
    updateData.shippedAt = new Date();
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }
  } else if (status === 'DELIVERED') {
    updateData.deliveredAt = new Date();
  }

  const order = await prisma.order.update({
    where: { id },
    data: updateData
  });

  res.json({
    message: '订单状态已更新',
    order
  });
}));

// ==================== 分类管理 ====================

// 创建分类
router.post('/categories', asyncHandler(async (req, res) => {
  const { name, slug, description, image, parentId, sortOrder } = req.body;

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      image,
      parentId,
      sortOrder: sortOrder || 0
    }
  });

  // 清除缓存
  await redis.del('categories:all');

  res.status(201).json({
    message: '分类创建成功',
    category
  });
}));

// 更新分类
router.put('/categories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, image, parentId, sortOrder, isActive } = req.body;

  const category = await prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      image,
      parentId,
      sortOrder,
      isActive
    }
  });

  // 清除缓存
  await redis.del('categories:all');

  res.json({
    message: '分类更新成功',
    category
  });
}));

// 删除分类
router.delete('/categories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.category.update({
    where: { id },
    data: { isActive: false }
  });

  // 清除缓存
  await redis.del('categories:all');

  res.json({ message: '分类已删除' });
}));

// ==================== 用户管理 ====================

router.get('/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    ...(role && { role }),
    ...(search && {
      OR: [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } }
      ]
    })
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } }
      }
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / take)
    }
  });
}));

// 更新用户状态
router.put('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, isActive } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { role, isActive },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true
    }
  });

  res.json({
    message: '用户已更新',
    user
  });
}));

export default router;
