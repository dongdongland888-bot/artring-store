import express from 'express';
import { prisma } from '../index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 获取购物车
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: {
      product: {
        include: {
          images: {
            where: { isPrimary: true },
            take: 1
          }
        }
      },
      variant: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // 计算总价
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.variant?.price || item.product.basePrice;
    return sum + parseFloat(price) * item.quantity;
  }, 0);

  res.json({
    items: cartItems,
    itemCount: cartItems.length,
    subtotal: subtotal.toFixed(2)
  });
}));

// 添加到购物车
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;

  // 验证商品
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product || !product.isActive) {
    return res.status(404).json({ error: '商品不存在' });
  }

  // 验证变体 (如果有)
  if (variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId }
    });

    if (!variant || !variant.isActive) {
      return res.status(404).json({ error: '商品规格不存在' });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ error: '库存不足' });
    }
  }

  // 检查是否已存在（variantId 为 null 时 findUnique 不可用，改用 findFirst）
  const existing = variantId != null
    ? await prisma.cartItem.findUnique({
        where: {
          userId_productId_variantId: {
            userId: req.user.id,
            productId,
            variantId
          }
        }
      })
    : await prisma.cartItem.findFirst({
        where: {
          userId: req.user.id,
          productId,
          variantId: null
        }
      });

  let cartItem;
  if (existing) {
    // 更新数量
    cartItem = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
      include: {
        product: true,
        variant: true
      }
    });
  } else {
    // 创建新项
    cartItem = await prisma.cartItem.create({
      data: {
        userId: req.user.id,
        productId,
        variantId,
        quantity
      },
      include: {
        product: true,
        variant: true
      }
    });
  }

  res.json({
    message: '已添加到购物车',
    item: cartItem
  });
}));

// 更新购物车项数量
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (quantity < 1) {
    return res.status(400).json({ error: '数量必须大于0' });
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id,
      userId: req.user.id
    },
    include: { variant: true }
  });

  if (!cartItem) {
    return res.status(404).json({ error: '购物车项不存在' });
  }

  // 检查库存
  if (cartItem.variant && cartItem.variant.stock < quantity) {
    return res.status(400).json({ error: '库存不足' });
  }

  const updated = await prisma.cartItem.update({
    where: { id },
    data: { quantity },
    include: {
      product: true,
      variant: true
    }
  });

  res.json({
    message: '已更新',
    item: updated
  });
}));

// 删除购物车项
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id,
      userId: req.user.id
    }
  });

  if (!cartItem) {
    return res.status(404).json({ error: '购物车项不存在' });
  }

  await prisma.cartItem.delete({
    where: { id }
  });

  res.json({ message: '已删除' });
}));

// 清空购物车
router.delete('/', authenticate, asyncHandler(async (req, res) => {
  await prisma.cartItem.deleteMany({
    where: { userId: req.user.id }
  });

  res.json({ message: '购物车已清空' });
}));

export default router;
