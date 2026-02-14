/**
 * 积分路由
 * 处理会员积分相关的API
 */

import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import pointsService from '../services/pointsService.js';

const router = express.Router();

/**
 * GET /api/points/rules
 * 获取积分规则 (公开接口，无需登录)
 */
router.get('/rules', async (req, res) => {
  res.json({
    rules: pointsService.POINTS_RULES,
    levels: pointsService.MEMBER_LEVELS,
  });
});

// 以下路由需要登录
router.use(authenticate);

/**
 * GET /api/points/balance
 * 查询积分余额和等级
 */
router.get('/balance', async (req, res, next) => {
  try {
    const info = await pointsService.getUserPointsInfo(req.user.id);
    res.json(info);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/points/history
 * 积分明细(分页)
 */
router.get('/history', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const result = await pointsService.getPointsHistory(req.user.id, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/points/coupons
 * 可兑换的优惠券列表
 */
router.get('/coupons', async (req, res, next) => {
  try {
    const coupons = await pointsService.getRedeemableCoupons(req.user.id);
    res.json(coupons);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/points/redeem
 * 积分兑换优惠券
 */
router.post('/redeem', async (req, res, next) => {
  try {
    const { couponId } = req.body;

    if (!couponId) {
      return res.status(400).json({ error: '请选择要兑换的优惠券' });
    }

    const coupon = await pointsService.redeemCoupon(req.user.id, couponId);
    
    // 获取更新后的积分信息
    const pointsInfo = await pointsService.getUserPointsInfo(req.user.id);

    res.json({
      success: true,
      message: `成功兑换优惠券 ${coupon.code}`,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minPurchase: coupon.minPurchase,
        endDate: coupon.endDate,
      },
      pointsInfo,
    });
  } catch (error) {
    if (error.message.includes('积分不足') || 
        error.message.includes('不存在') ||
        error.message.includes('不支持') ||
        error.message.includes('已下架') ||
        error.message.includes('有效期') ||
        error.message.includes('已被兑完')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * GET /api/points/calculate
 * 计算订单可获得积分(结算页面使用)
 */
router.get('/calculate', async (req, res, next) => {
  try {
    const amount = parseFloat(req.query.amount) || 0;

    if (amount <= 0) {
      return res.json({ points: 0, isBirthday: false, multiplier: 1 });
    }

    const result = await pointsService.calculateOrderPoints(req.user.id, amount);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
