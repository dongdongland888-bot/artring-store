import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { awardRegisterPoints, awardInvitePoints } from '../services/pointsService.js';
import { nanoid } from 'nanoid';

const router = express.Router();

// 生成JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 注册
router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('inviteCode').optional().trim(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, inviteCode } = req.body;

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 验证邀请码
    let inviter = null;
    if (inviteCode) {
      inviter = await prisma.user.findUnique({
        where: { inviteCode }
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 生成用户唯一邀请码
    const userInviteCode = nanoid(8).toUpperCase();

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        inviteCode: userInviteCode,
        invitedBy: inviter?.id || null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        inviteCode: true,
        createdAt: true
      }
    });

    // 发放注册积分
    let registerPoints = 0;
    let invitePoints = 0;
    try {
      registerPoints = await awardRegisterPoints(user.id);
      
      // 如果有邀请人，双方发放邀请积分
      if (inviter) {
        invitePoints = await awardInvitePoints(inviter.id, user.id);
      }
    } catch (error) {
      console.error('发放注册积分失败:', error);
    }

    // 生成token
    const token = generateToken(user.id);

    res.status(201).json({
      message: '注册成功',
      user,
      token,
      points: {
        register: registerPoints,
        invite: invitePoints
      }
    });
  })
);

// 登录
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: '账户已被禁用' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成token
    const token = generateToken(user.id);

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });
  })
);

// 获取当前用户信息
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      createdAt: true,
      addresses: true
    }
  });

  res.json(user);
}));

// 更新用户信息
router.put('/me', authenticate,
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phone').optional().trim(),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        phone
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true
      }
    });

    res.json({
      message: '更新成功',
      user
    });
  })
);

// 修改密码
router.put('/password', authenticate,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // 获取用户密码
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { password: true }
    });

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: '当前密码错误' });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: '密码修改成功' });
  })
);

export default router;
