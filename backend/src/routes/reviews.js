import express from 'express';
import { prisma, redis } from '../index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ==================== 获取商品评价列表 ====================
// GET /api/products/:id/reviews
router.get('/products/:id/reviews', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    page = 1,
    limit = 10,
    sort = 'newest', // newest, oldest, helpful, rating_high, rating_low
    rating // 筛选特定星级: 1, 2, 3, 4, 5
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // 构建查询条件
  const where = {
    productId: id,
    isApproved: true,
    ...(rating && { rating: parseInt(rating) })
  };

  // 排序选项
  const orderByOptions = {
    newest: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    oldest: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
    helpful: [{ isPinned: 'desc' }, { helpfulCount: 'desc' }, { createdAt: 'desc' }],
    rating_high: [{ isPinned: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
    rating_low: [{ isPinned: 'desc' }, { rating: 'asc' }, { createdAt: 'desc' }]
  };
  const orderBy = orderByOptions[sort] || orderByOptions.newest;

  // 并行查询评价列表、总数和各星级统计
  const [reviews, total, ratingStats] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        user: {
          select: { 
            id: true,
            firstName: true, 
            lastName: true, 
            avatar: true 
          }
        }
      }
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { productId: id, isApproved: true },
      _count: { rating: true }
    })
  ]);

  // 整理星级统计
  const stats = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    total: 0,
    average: 0
  };
  let sum = 0;
  for (const s of ratingStats) {
    stats[s.rating] = s._count.rating;
    stats.total += s._count.rating;
    sum += s.rating * s._count.rating;
  }
  stats.average = stats.total > 0 ? (sum / stats.total).toFixed(1) : 0;

  res.json({
    reviews: reviews.map(r => ({
      ...r,
      userName: r.user 
        ? `${r.user.firstName || ''}${r.user.lastName ? ' ' + r.user.lastName[0] + '***' : ''}`.trim() || '匿名用户'
        : '匿名用户',
      userAvatar: r.user?.avatar
    })),
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / take)
    }
  });
}));

// ==================== 创建评价 ====================
// POST /api/reviews
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { productId, orderId, rating, title, content, images } = req.body;
  const userId = req.user.id;

  // 验证评分
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: '评分必须在1-5之间' });
  }

  // 检查商品是否存在
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true }
  });
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }

  // 检查是否已购买(订单状态为已完成)
  let isVerified = false;
  let verifiedOrderId = orderId;

  if (orderId) {
    // 如果指定了订单ID，验证该订单
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: { in: ['DELIVERED', 'CONFIRMED', 'SHIPPED'] },
        items: { some: { productId } }
      },
      select: { id: true }
    });
    if (order) {
      isVerified = true;
    } else {
      return res.status(400).json({ error: '订单无效或您未购买该商品' });
    }
  } else {
    // 查找任意一个已购买该商品的订单
    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: { in: ['DELIVERED', 'CONFIRMED', 'SHIPPED'] },
        items: { some: { productId } }
      },
      select: { id: true }
    });
    if (order) {
      isVerified = true;
      verifiedOrderId = order.id;
    }
  }

  // 检查是否已评价过(同一商品/订单)
  const existing = await prisma.review.findFirst({
    where: {
      userId,
      productId,
      ...(verifiedOrderId && { orderId: verifiedOrderId })
    }
  });
  if (existing) {
    return res.status(400).json({ error: '您已评价过该商品' });
  }

  // 创建评价
  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      orderId: verifiedOrderId,
      rating: parseInt(rating),
      title,
      content,
      images: images || [],
      isVerified
    },
    include: {
      user: {
        select: { firstName: true, lastName: true }
      }
    }
  });

  // 更新商品的评分统计
  await updateProductRating(productId);

  // 清除商品缓存
  const productSlug = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true }
  });
  if (productSlug) {
    await redis.del(`product:${productSlug.slug}`);
  }

  // 评价返积分逻辑(如果有积分系统)
  let pointsEarned = 0;
  if (content && content.length > 10) {
    pointsEarned += 10; // 文字评价+10分
  }
  if (images && images.length > 0) {
    pointsEarned += 20; // 带图+20分
  }
  // TODO: 集成会员积分系统
  // if (pointsEarned > 0) {
  //   await addUserPoints(userId, pointsEarned, 'REVIEW', review.id);
  // }

  res.status(201).json({
    message: '评价发布成功',
    review,
    pointsEarned
  });
}));

// ==================== 编辑评价 ====================
// PUT /api/reviews/:id
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, content, images } = req.body;
  const userId = req.user.id;

  // 查找评价
  const review = await prisma.review.findUnique({
    where: { id },
    select: { userId: true, productId: true, createdAt: true }
  });

  if (!review) {
    return res.status(404).json({ error: '评价不存在' });
  }

  // 检查权限(只能编辑自己的评价)
  if (review.userId !== userId) {
    return res.status(403).json({ error: '无权编辑该评价' });
  }

  // 检查是否在7天内(可编辑期限)
  const daysSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation > 7) {
    return res.status(400).json({ error: '评价已超过7天，无法编辑' });
  }

  // 验证评分
  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: '评分必须在1-5之间' });
  }

  // 更新评价
  const updatedReview = await prisma.review.update({
    where: { id },
    data: {
      ...(rating && { rating: parseInt(rating) }),
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(images !== undefined && { images })
    }
  });

  // 更新商品评分
  await updateProductRating(review.productId);

  // 清除缓存
  const product = await prisma.product.findUnique({
    where: { id: review.productId },
    select: { slug: true }
  });
  if (product) {
    await redis.del(`product:${product.slug}`);
  }

  res.json({
    message: '评价更新成功',
    review: updatedReview
  });
}));

// ==================== 删除评价 ====================
// DELETE /api/reviews/:id
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

  // 查找评价
  const review = await prisma.review.findUnique({
    where: { id },
    select: { userId: true, productId: true }
  });

  if (!review) {
    return res.status(404).json({ error: '评价不存在' });
  }

  // 检查权限(用户只能删除自己的评价，管理员可以删除任何评价)
  if (!isAdmin && review.userId !== userId) {
    return res.status(403).json({ error: '无权删除该评价' });
  }

  // 删除评价
  await prisma.review.delete({
    where: { id }
  });

  // 删除相关的有帮助记录
  await prisma.reviewHelpful.deleteMany({
    where: { reviewId: id }
  });

  // 更新商品评分
  await updateProductRating(review.productId);

  // 清除缓存
  const product = await prisma.product.findUnique({
    where: { id: review.productId },
    select: { slug: true }
  });
  if (product) {
    await redis.del(`product:${product.slug}`);
  }

  res.json({ message: '评价已删除' });
}));

// ==================== 标记评价有帮助 ====================
// POST /api/reviews/:id/helpful
router.post('/:id/helpful', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // 生成访客ID(登录用户用userId，匿名用户用IP或请求中的visitorId)
  const visitorId = req.user?.id || req.body.visitorId || req.ip;

  // 查找评价
  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true, helpfulCount: true }
  });

  if (!review) {
    return res.status(404).json({ error: '评价不存在' });
  }

  // 检查是否已标记过
  const existing = await prisma.reviewHelpful.findUnique({
    where: {
      reviewId_visitorId: { reviewId: id, visitorId }
    }
  });

  if (existing) {
    // 取消标记
    await prisma.reviewHelpful.delete({
      where: { id: existing.id }
    });
    await prisma.review.update({
      where: { id },
      data: { helpfulCount: { decrement: 1 } }
    });
    return res.json({
      message: '已取消有帮助标记',
      helpfulCount: review.helpfulCount - 1,
      marked: false
    });
  }

  // 添加标记
  await prisma.reviewHelpful.create({
    data: { reviewId: id, visitorId }
  });
  await prisma.review.update({
    where: { id },
    data: { helpfulCount: { increment: 1 } }
  });

  res.json({
    message: '已标记为有帮助',
    helpfulCount: review.helpfulCount + 1,
    marked: true
  });
}));

// ==================== 获取用户的评价列表 ====================
// GET /api/reviews/my
router.get('/my', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: { take: 1 }
          }
        }
      }
    }),
    prisma.review.count({ where: { userId } })
  ]);

  res.json({
    reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / take)
    }
  });
}));

// ==================== 获取待评价订单商品 ====================
// GET /api/reviews/pending
router.get('/pending', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 查找已完成但未评价的订单商品
  const orders = await prisma.order.findMany({
    where: {
      userId,
      status: { in: ['DELIVERED', 'CONFIRMED', 'SHIPPED'] }
    },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      items: {
        select: {
          productId: true,
          productName: true,
          variantInfo: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: { take: 1 }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // 获取用户已评价的商品
  const reviewedProducts = await prisma.review.findMany({
    where: { userId },
    select: { productId: true, orderId: true }
  });

  const reviewedSet = new Set(
    reviewedProducts.map(r => `${r.productId}-${r.orderId || ''}`)
  );

  // 过滤出未评价的商品
  const pendingItems = [];
  for (const order of orders) {
    for (const item of order.items) {
      const key = `${item.productId}-${order.id}`;
      if (!reviewedSet.has(key) && !reviewedSet.has(`${item.productId}-`)) {
        pendingItems.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          productId: item.productId,
          productName: item.productName,
          variantInfo: item.variantInfo,
          product: item.product
        });
      }
    }
  }

  res.json({ pendingItems });
}));

// ==================== 辅助函数: 更新商品评分 ====================
async function updateProductRating(productId) {
  const stats = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true }
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating: stats._avg.rating || 0,
      reviewCount: stats._count.rating || 0
    }
  });
}

export default router;
