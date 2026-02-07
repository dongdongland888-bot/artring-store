import express from 'express';
import { prisma } from '../index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 生成订单号
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AR${year}${month}${day}${random}`;
};

// 获取用户订单列表
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    userId: req.user.id,
    ...(status && { status })
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          }
        }
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

// 获取订单详情
router.get('/:orderNumber', authenticate, asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      userId: req.user.id
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true
            }
          },
          variant: true
        }
      },
      address: true
    }
  });

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  res.json(order);
}));

// 创建订单
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { addressId, couponCode, note } = req.body;

  // 获取购物车
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: {
      product: true,
      variant: true
    }
  });

  if (cartItems.length === 0) {
    return res.status(400).json({ error: '购物车为空' });
  }

  // 验证地址
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId: req.user.id
    }
  });

  if (!address) {
    return res.status(400).json({ error: '请选择收货地址' });
  }

  // 计算金额
  let subtotal = 0;
  const orderItems = [];

  for (const item of cartItems) {
    const price = item.variant?.price || item.product.basePrice;
    const total = parseFloat(price) * item.quantity;
    subtotal += total;

    // 检查库存
    if (item.variant && item.variant.stock < item.quantity) {
      return res.status(400).json({ 
        error: `${item.product.name} 库存不足` 
      });
    }

    orderItems.push({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      variantInfo: item.variant ? `${item.variant.size || ''} ${item.variant.color || ''}`.trim() : null,
      price: price,
      quantity: item.quantity,
      total: total
    });
  }

  // 计算折扣
  let discount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode }
    });

    if (coupon && coupon.isActive) {
      const now = new Date();
      if (now >= coupon.startDate && now <= coupon.endDate) {
        if (!coupon.minPurchase || subtotal >= parseFloat(coupon.minPurchase)) {
          if (coupon.type === 'PERCENTAGE') {
            discount = subtotal * parseFloat(coupon.value) / 100;
            if (coupon.maxDiscount) {
              discount = Math.min(discount, parseFloat(coupon.maxDiscount));
            }
          } else if (coupon.type === 'FIXED') {
            discount = parseFloat(coupon.value);
          }
        }
      }
    }
  }

  // 计算运费 (简化版: 满100免运费)
  const shippingFee = subtotal >= 100 ? 0 : 10;

  // 计算税费 (简化版: 无税)
  const tax = 0;

  const total = subtotal - discount + shippingFee + tax;

  // 创建订单
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: req.user.id,
      addressId,
      subtotal,
      discount,
      shippingFee,
      tax,
      total,
      couponCode,
      note,
      shippingAddress: {
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: address.postalCode
      },
      items: {
        create: orderItems
      }
    },
    include: {
      items: true
    }
  });

  // 扣减库存
  for (const item of cartItems) {
    if (item.variant) {
      await prisma.productVariant.update({
        where: { id: item.variant.id },
        data: {
          stock: { decrement: item.quantity }
        }
      });
    }

    // 更新销量
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        totalSold: { increment: item.quantity }
      }
    });
  }

  // 清空购物车
  await prisma.cartItem.deleteMany({
    where: { userId: req.user.id }
  });

  // 更新优惠券使用次数
  if (couponCode) {
    await prisma.coupon.update({
      where: { code: couponCode },
      data: {
        usedCount: { increment: 1 }
      }
    });
  }

  res.status(201).json({
    message: '订单创建成功',
    order
  });
}));

// 取消订单
router.put('/:orderNumber/cancel', authenticate, asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      userId: req.user.id
    },
    include: { items: true }
  });

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
    return res.status(400).json({ error: '订单无法取消' });
  }

  // 恢复库存
  for (const item of order.items) {
    if (item.variantId) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: { increment: item.quantity }
        }
      });
    }

    await prisma.product.update({
      where: { id: item.productId },
      data: {
        totalSold: { decrement: item.quantity }
      }
    });
  }

  // 更新订单状态
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date()
    }
  });

  res.json({
    message: '订单已取消',
    order: updated
  });
}));

export default router;
