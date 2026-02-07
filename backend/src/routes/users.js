import express from 'express';
import { prisma } from '../index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ==================== 地址管理 ====================

// 获取用户地址列表
router.get('/addresses', authenticate, asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  res.json(addresses);
}));

// 添加地址
router.post('/addresses', authenticate, asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, street, city, state, country, postalCode, isDefault } = req.body;

  // 如果设为默认，先取消其他默认
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false }
    });
  }

  const address = await prisma.address.create({
    data: {
      userId: req.user.id,
      firstName,
      lastName,
      phone,
      street,
      city,
      state,
      country,
      postalCode,
      isDefault: isDefault || false
    }
  });

  res.status(201).json({
    message: '地址添加成功',
    address
  });
}));

// 更新地址
router.put('/addresses/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, street, city, state, country, postalCode, isDefault } = req.body;

  // 验证地址属于当前用户
  const existing = await prisma.address.findFirst({
    where: { id, userId: req.user.id }
  });

  if (!existing) {
    return res.status(404).json({ error: '地址不存在' });
  }

  // 如果设为默认，先取消其他默认
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id, id: { not: id } },
      data: { isDefault: false }
    });
  }

  const address = await prisma.address.update({
    where: { id },
    data: {
      firstName,
      lastName,
      phone,
      street,
      city,
      state,
      country,
      postalCode,
      isDefault
    }
  });

  res.json({
    message: '地址更新成功',
    address
  });
}));

// 删除地址
router.delete('/addresses/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.address.findFirst({
    where: { id, userId: req.user.id }
  });

  if (!existing) {
    return res.status(404).json({ error: '地址不存在' });
  }

  await prisma.address.delete({
    where: { id }
  });

  res.json({ message: '地址已删除' });
}));

// ==================== 收藏管理 ====================

// 获取收藏列表
router.get('/wishlist', authenticate, asyncHandler(async (req, res) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    include: {
      product: {
        include: {
          images: {
            where: { isPrimary: true },
            take: 1
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(wishlist);
}));

// 添加收藏
router.post('/wishlist', authenticate, asyncHandler(async (req, res) => {
  const { productId } = req.body;

  // 检查商品是否存在
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product || !product.isActive) {
    return res.status(404).json({ error: '商品不存在' });
  }

  // 检查是否已收藏
  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId: req.user.id,
        productId
      }
    }
  });

  if (existing) {
    return res.status(400).json({ error: '已收藏该商品' });
  }

  await prisma.wishlist.create({
    data: {
      userId: req.user.id,
      productId
    }
  });

  res.json({ message: '已添加到收藏' });
}));

// 删除收藏
router.delete('/wishlist/:productId', authenticate, asyncHandler(async (req, res) => {
  const { productId } = req.params;

  await prisma.wishlist.deleteMany({
    where: {
      userId: req.user.id,
      productId
    }
  });

  res.json({ message: '已取消收藏' });
}));

export default router;
