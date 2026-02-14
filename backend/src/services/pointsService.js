/**
 * 积分服务
 * 处理会员积分相关的业务逻辑
 */

import { prisma } from '../index.js';

// 积分规则配置
export const POINTS_RULES = {
  PURCHASE_RATE: 1,           // 消费返积分: 1元=1分
  REVIEW_TEXT: 10,            // 文字评价返积分
  REVIEW_IMAGE: 20,           // 带图评价额外积分
  REGISTER_BONUS: 100,        // 注册送积分
  INVITE_BONUS: 50,           // 邀请好友各得积分
  BIRTHDAY_MULTIPLIER: 2,     // 生日双倍积分
};

// 会员等级配置
export const MEMBER_LEVELS = [
  { name: '普通会员', minPoints: 0, discount: 1.00, benefits: [] },
  { name: '银卡会员', minPoints: 1000, discount: 0.95, benefits: ['95折优惠'] },
  { name: '金卡会员', minPoints: 5000, discount: 0.90, benefits: ['9折优惠', '生日礼遇'] },
  { name: '黑卡会员', minPoints: 20000, discount: 0.85, benefits: ['85折优惠', '免运费', '专属客服', '优先发货'] },
];

/**
 * 获取或创建用户积分记录
 */
export async function getOrCreateUserPoints(userId) {
  let userPoints = await prisma.userPoints.findUnique({
    where: { userId },
  });

  if (!userPoints) {
    userPoints = await prisma.userPoints.create({
      data: { userId },
    });
  }

  return userPoints;
}

/**
 * 根据累计积分计算会员等级
 */
export function calculateMemberLevel(totalEarned) {
  let level = MEMBER_LEVELS[0];
  for (const l of MEMBER_LEVELS) {
    if (totalEarned >= l.minPoints) {
      level = l;
    }
  }
  return level;
}

/**
 * 获取下一等级信息
 */
export function getNextLevel(totalEarned) {
  for (const l of MEMBER_LEVELS) {
    if (totalEarned < l.minPoints) {
      return {
        level: l,
        pointsNeeded: l.minPoints - totalEarned,
      };
    }
  }
  return null; // 已是最高等级
}

/**
 * 检查是否是用户生日
 */
export async function isBirthday(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { birthday: true },
  });

  if (!user?.birthday) return false;

  const today = new Date();
  const birthday = new Date(user.birthday);
  return (
    today.getMonth() === birthday.getMonth() &&
    today.getDate() === birthday.getDate()
  );
}

/**
 * 添加积分交易记录
 */
export async function addPointsTransaction(userId, type, amount, description, orderId = null, reviewId = null) {
  const userPoints = await getOrCreateUserPoints(userId);

  // 创建交易记录
  const transaction = await prisma.pointsTransaction.create({
    data: {
      userId,
      type,
      amount,
      description,
      orderId,
      reviewId,
    },
  });

  // 更新用户积分
  const updateData = {
    balance: userPoints.balance + amount,
  };

  if (amount > 0) {
    updateData.totalEarned = userPoints.totalEarned + amount;
  } else {
    updateData.totalSpent = userPoints.totalSpent + Math.abs(amount);
  }

  await prisma.userPoints.update({
    where: { userId },
    data: updateData,
  });

  return transaction;
}

/**
 * 消费返积分
 * @param {string} userId 用户ID
 * @param {string} orderId 订单ID
 * @param {number} amount 订单金额(元)
 */
export async function awardPurchasePoints(userId, orderId, amount) {
  // 检查是否生日
  const birthday = await isBirthday(userId);
  const multiplier = birthday ? POINTS_RULES.BIRTHDAY_MULTIPLIER : 1;
  
  // 计算积分(向下取整)
  const basePoints = Math.floor(amount * POINTS_RULES.PURCHASE_RATE);
  const points = basePoints * multiplier;

  const description = birthday
    ? `订单消费返积分(生日双倍) +${points}`
    : `订单消费返积分 +${points}`;

  await addPointsTransaction(userId, 'PURCHASE', points, description, orderId);
  
  return points;
}

/**
 * 评价返积分
 * @param {string} userId 用户ID
 * @param {string} reviewId 评价ID
 * @param {boolean} hasImages 是否带图
 */
export async function awardReviewPoints(userId, reviewId, hasImages) {
  let points = POINTS_RULES.REVIEW_TEXT;
  let description = '文字评价奖励';

  if (hasImages) {
    points += POINTS_RULES.REVIEW_IMAGE;
    description = '带图评价奖励';
  }

  // 检查是否生日
  const birthday = await isBirthday(userId);
  if (birthday) {
    points *= POINTS_RULES.BIRTHDAY_MULTIPLIER;
    description += '(生日双倍)';
  }

  await addPointsTransaction(userId, hasImages ? 'REVIEW_IMAGE' : 'REVIEW_TEXT', points, description, null, reviewId);
  
  return points;
}

/**
 * 注册送积分
 * @param {string} userId 用户ID
 */
export async function awardRegisterPoints(userId) {
  const points = POINTS_RULES.REGISTER_BONUS;
  await addPointsTransaction(userId, 'REGISTER', points, '新用户注册奖励');
  return points;
}

/**
 * 邀请好友返积分
 * @param {string} inviterId 邀请人ID
 * @param {string} inviteeId 被邀请人ID
 */
export async function awardInvitePoints(inviterId, inviteeId) {
  const points = POINTS_RULES.INVITE_BONUS;
  
  // 邀请人获得积分
  await addPointsTransaction(inviterId, 'INVITE', points, '邀请好友奖励');
  
  // 被邀请人获得积分
  await addPointsTransaction(inviteeId, 'INVITE', points, '受邀注册奖励');
  
  return points;
}

/**
 * 积分兑换优惠券
 * @param {string} userId 用户ID
 * @param {string} couponId 优惠券ID
 */
export async function redeemCoupon(userId, couponId) {
  const userPoints = await getOrCreateUserPoints(userId);
  
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
  });

  if (!coupon) {
    throw new Error('优惠券不存在');
  }

  if (!coupon.pointsCost) {
    throw new Error('该优惠券不支持积分兑换');
  }

  if (!coupon.isActive) {
    throw new Error('优惠券已下架');
  }

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw new Error('优惠券不在有效期内');
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new Error('优惠券已被兑完');
  }

  if (userPoints.balance < coupon.pointsCost) {
    throw new Error(`积分不足，需要${coupon.pointsCost}积分，当前余额${userPoints.balance}积分`);
  }

  // 扣除积分
  await addPointsTransaction(
    userId,
    'REDEEM',
    -coupon.pointsCost,
    `兑换优惠券: ${coupon.code}`
  );

  // 更新优惠券使用次数
  await prisma.coupon.update({
    where: { id: couponId },
    data: { usedCount: coupon.usedCount + 1 },
  });

  return coupon;
}

/**
 * 获取用户积分信息(包含等级)
 */
export async function getUserPointsInfo(userId) {
  const userPoints = await getOrCreateUserPoints(userId);
  const level = calculateMemberLevel(userPoints.totalEarned);
  const nextLevel = getNextLevel(userPoints.totalEarned);

  return {
    balance: userPoints.balance,
    totalEarned: userPoints.totalEarned,
    totalSpent: userPoints.totalSpent,
    level: {
      name: level.name,
      discount: level.discount,
      benefits: level.benefits,
    },
    nextLevel: nextLevel ? {
      name: nextLevel.level.name,
      minPoints: nextLevel.level.minPoints,
      pointsNeeded: nextLevel.pointsNeeded,
      progress: Math.round((userPoints.totalEarned / nextLevel.level.minPoints) * 100),
    } : null,
  };
}

/**
 * 获取积分历史记录
 */
export async function getPointsHistory(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.pointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.pointsTransaction.count({ where: { userId } }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 获取可兑换优惠券列表
 */
export async function getRedeemableCoupons(userId) {
  const userPoints = await getOrCreateUserPoints(userId);
  const now = new Date();

  const coupons = await prisma.coupon.findMany({
    where: {
      pointsCost: { not: null },
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      OR: [
        { usageLimit: null },
        { usedCount: { lt: prisma.coupon.fields.usageLimit } },
      ],
    },
    orderBy: { pointsCost: 'asc' },
  });

  return coupons.map(coupon => ({
    ...coupon,
    canRedeem: userPoints.balance >= coupon.pointsCost,
    pointsNeeded: Math.max(0, coupon.pointsCost - userPoints.balance),
  }));
}

/**
 * 计算订单可获得积分
 */
export async function calculateOrderPoints(userId, amount) {
  const birthday = await isBirthday(userId);
  const multiplier = birthday ? POINTS_RULES.BIRTHDAY_MULTIPLIER : 1;
  const points = Math.floor(amount * POINTS_RULES.PURCHASE_RATE) * multiplier;
  
  return {
    points,
    isBirthday: birthday,
    multiplier,
  };
}

export default {
  POINTS_RULES,
  MEMBER_LEVELS,
  getOrCreateUserPoints,
  calculateMemberLevel,
  getNextLevel,
  addPointsTransaction,
  awardPurchasePoints,
  awardReviewPoints,
  awardRegisterPoints,
  awardInvitePoints,
  redeemCoupon,
  getUserPointsInfo,
  getPointsHistory,
  getRedeemableCoupons,
  calculateOrderPoints,
};
