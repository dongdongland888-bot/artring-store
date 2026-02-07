import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 创建支付意图
router.post('/create-payment-intent', authenticate, asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: req.user.id
    }
  });

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.paymentStatus === 'PAID') {
    return res.status(400).json({ error: '订单已支付' });
  }

  // 创建 Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(parseFloat(order.total) * 100), // Stripe 使用分
    currency: 'usd',
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber
    }
  });

  // 保存 Payment Intent ID
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentId: paymentIntent.id }
  });

  res.json({
    clientSecret: paymentIntent.client_secret
  });
}));

// Stripe Webhook 处理
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 处理事件
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // 更新订单状态
      await prisma.order.updateMany({
        where: { paymentId: paymentIntent.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          paymentMethod: 'stripe'
        }
      });
      
      console.log(`✅ Payment succeeded for order: ${paymentIntent.metadata.orderNumber}`);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      await prisma.order.updateMany({
        where: { paymentId: failedPayment.id },
        data: {
          paymentStatus: 'FAILED'
        }
      });
      
      console.log(`❌ Payment failed for order: ${failedPayment.metadata.orderNumber}`);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}));

// 确认支付成功 (前端回调)
router.post('/confirm', authenticate, asyncHandler(async (req, res) => {
  const { orderId, paymentIntentId } = req.body;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: req.user.id,
      paymentId: paymentIntentId
    }
  });

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  // 验证支付状态
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status === 'succeeded') {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paymentMethod: 'stripe'
      }
    });

    res.json({
      success: true,
      message: '支付成功',
      orderNumber: order.orderNumber
    });
  } else {
    res.status(400).json({
      success: false,
      message: '支付未完成',
      status: paymentIntent.status
    });
  }
}));

export default router;
