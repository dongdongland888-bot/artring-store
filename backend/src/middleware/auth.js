import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

// JWT认证中间件
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '请先登录' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: '账户已被禁用' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token已过期，请重新登录' });
    }
    next(error);
  }
};

// 可选认证 (不强制要求登录)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // 忽略token错误，继续处理
    next();
  }
};

// 管理员权限检查
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '请先登录' });
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: '没有管理权限' });
  }

  next();
};

// 超级管理员权限检查
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '请先登录' });
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: '需要超级管理员权限' });
  }

  next();
};
