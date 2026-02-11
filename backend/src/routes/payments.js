import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 支付状态/方式常量，避免魔法字符串
const PAYMENT_STATUS = { PAID: 'PAID', FAILED: 'FAILED' };
const ORDER_STATUS = { CONFIRMED: 'CONFIRMED' };
const PAYMENT_METHOD = { STRIPE: 'stripe', PAYPAL: 'paypal' };

// Stripe 懒加载，避免未配置时启动即报错
let stripeInstance = null;
function getStripe() {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('Stripe 未配置 STRIPE_SECRET_KEY');
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

// 生产环境使用 PayPal 生产接口，否则使用沙箱
const PAYPAL_API =
  process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

let paypalAuthCache = null;
function getPayPalAuth() {
  if (paypalAuthCache) return paypalAuthCache;
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error('PayPal 未配置 PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET');
  paypalAuthCache = Buffer.from(`${id}:${secret}`).toString('base64');
  return paypalAuthCache;
}

/** 获取当前用户的待支付订单，用于支付相关接口 */
async function getOrderForPayment(userId, orderId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId }
  });
  if (!order) return { error: '订单不存在', status: 404 };
  if (order.paymentStatus === PAYMENT_STATUS.PAID) return { error: '订单已支付', status: 400 };
  return { order };
}

// 获取 PayPal Client ID（前端加载 SDK 用，无需登录）
router.get('/paypal/client-id', (req, res) => {
  const id = process.env.PAYPAL_CLIENT_ID;
  if (!id) return res.status(503).json({ error: 'PayPal 未配置' });
  res.json({ clientId: id });
});

// 获取 Stripe 前端 Publishable Key（无需登录）
router.get('/stripe-publishable-key', (req, res) => {
  const key = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) return res.status(503).json({ error: 'Stripe 未配置' });
  res.json({ publishableKey: key });
});

// 创建支付意图
router.post('/create-payment-intent', authenticate, asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const result = await getOrderForPayment(req.user.id, orderId);
  if (result.error) return res.status(result.status).json({ error: result.error });

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(parseFloat(result.order.total) * 100), // Stripe 使用分
    currency: 'usd',
    metadata: {
      orderId: result.order.id,
      orderNumber: result.order.orderNumber
    }
  });

  await prisma.order.update({
    where: { id: result.order.id },
    data: { paymentId: paymentIntent.id }
  });

  res.json({ clientSecret: paymentIntent.client_secret });
}));

// Stripe Webhook 处理
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET 未配置');
    return res.status(503).send('Webhook 未配置');
  }
  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      await prisma.order.updateMany({
        where: { paymentId: paymentIntent.id },
        data: {
          paymentStatus: PAYMENT_STATUS.PAID,
          status: ORDER_STATUS.CONFIRMED,
          paymentMethod: PAYMENT_METHOD.STRIPE
        }
      });
      console.log(`✅ Payment succeeded for order: ${paymentIntent.metadata?.orderNumber}`);
      break;
    }
    case 'payment_intent.payment_failed': {
      const failedPayment = event.data.object;
      await prisma.order.updateMany({
        where: { paymentId: failedPayment.id },
        data: { paymentStatus: PAYMENT_STATUS.FAILED }
      });
      console.log(`❌ Payment failed for order: ${failedPayment.metadata?.orderNumber}`);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}));

// 确认支付成功 (前端回调)
router.post('/confirm', authenticate, asyncHandler(async (req, res) => {
  const { orderId, paymentIntentId } = req.body;
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.user.id, paymentId: paymentIntentId }
  });
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status === 'succeeded') {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PAYMENT_STATUS.PAID,
        status: ORDER_STATUS.CONFIRMED,
        paymentMethod: PAYMENT_METHOD.STRIPE
      }
    });
    return res.json({ success: true, message: '支付成功', orderNumber: order.orderNumber });
  }
  res.status(400).json({
    success: false,
    message: '支付未完成',
    status: paymentIntent.status
  });
}));

// ————— PayPal —————
// 创建 PayPal 订单，返回 orderID 给前端 SDK
router.post('/paypal/create-order', authenticate, asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const result = await getOrderForPayment(req.user.id, orderId);
  if (result.error) return res.status(result.status).json({ error: result.error });

  const { order } = result;
  const value = parseFloat(order.total).toFixed(2);
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${getPayPalAuth()}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value },
        reference_id: order.id
      }]
    })
  });
  const data = await response.json();
  if (!response.ok) {
    return res.status(400).json({ error: data.message || 'PayPal 创建订单失败' });
  }
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentId: data.id }
  });
  res.json({ orderID: data.id });
}));

// 捕获 PayPal 支付，更新订单状态
router.post('/paypal/capture', authenticate, asyncHandler(async (req, res) => {
  const { orderId, paypalOrderId } = req.body;
  const result = await getOrderForPayment(req.user.id, orderId);
  if (result.error) return res.status(result.status).json({ error: result.error });

  const { order } = result;
  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    return res.json({ success: true, message: '支付成功', orderNumber: order.orderNumber });
  }

  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${getPayPalAuth()}`
    }
  });
  const data = await response.json();
  if (!response.ok) {
    const msg = data.message || data.details?.[0]?.description || 'PayPal 扣款失败';
    return res.status(400).json({ error: msg });
  }

  const captureStatus = data.purchase_units?.[0]?.payments?.captures?.[0]?.status;
  const isCompleted = data.status === 'COMPLETED' || captureStatus === 'COMPLETED';

  if (isCompleted) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PAYMENT_STATUS.PAID,
        status: ORDER_STATUS.CONFIRMED,
        paymentMethod: PAYMENT_METHOD.PAYPAL
      }
    });
  }

  res.json({
    success: isCompleted,
    message: isCompleted ? '支付完成' : (data.status || captureStatus || '未知状态'),
    orderNumber: order.orderNumber
  });
}));

export default router;
