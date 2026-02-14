/**
 * Redis 服务
 * 封装 Redis 操作，支持优雅降级
 * 当 Redis 不可用时，自动降级为无缓存模式
 */

import Redis from 'ioredis';

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempted = false;
    this.lastErrorLogged = 0;
    this.errorLogInterval = 60000; // 每分钟最多打印一次错误
    this.reconnectDelay = 30000; // 重连延迟 30 秒
  }

  /**
   * 初始化 Redis 连接
   */
  init(redisUrl) {
    if (this.connectionAttempted) {
      return;
    }
    this.connectionAttempted = true;

    try {
      this.client = new Redis(redisUrl || 'redis://localhost:6379', {
        maxRetriesPerRequest: 1, // 每次请求只重试1次
        retryStrategy: (times) => {
          // 首次失败后，延迟30秒重试，之后逐渐增加
          if (times > 10) {
            return null; // 10次后停止重试
          }
          return Math.min(times * this.reconnectDelay, 300000); // 最大5分钟
        },
        enableOfflineQueue: false, // 不在离线时排队命令
        lazyConnect: true, // 延迟连接
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Redis connected');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this._logErrorOnce(err);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      this.client.on('end', () => {
        this.isConnected = false;
      });

      // 尝试连接，但不阻塞启动
      this.client.connect().catch((err) => {
        this._logErrorOnce(err);
      });
    } catch (err) {
      this._logErrorOnce(err);
    }
  }

  /**
   * 限制错误日志频率
   */
  _logErrorOnce(err) {
    const now = Date.now();
    if (now - this.lastErrorLogged > this.errorLogInterval) {
      this.lastErrorLogged = now;
      console.warn(`⚠️ Redis unavailable: ${err.message}. Caching disabled.`);
    }
  }

  /**
   * 安全执行 Redis 命令
   */
  async _safeExec(operation) {
    if (!this.isConnected || !this.client) {
      return null;
    }
    try {
      return await operation();
    } catch (err) {
      this._logErrorOnce(err);
      return null;
    }
  }

  /**
   * GET - 获取缓存
   */
  async get(key) {
    return this._safeExec(() => this.client.get(key));
  }

  /**
   * SET - 设置缓存
   */
  async set(key, value, ...args) {
    return this._safeExec(() => this.client.set(key, value, ...args));
  }

  /**
   * SETEX - 设置带过期时间的缓存
   */
  async setex(key, seconds, value) {
    return this._safeExec(() => this.client.setex(key, seconds, value));
  }

  /**
   * DEL - 删除缓存
   */
  async del(...keys) {
    return this._safeExec(() => this.client.del(...keys));
  }

  /**
   * EXISTS - 检查键是否存在
   */
  async exists(...keys) {
    return this._safeExec(() => this.client.exists(...keys));
  }

  /**
   * KEYS - 获取匹配的键
   */
  async keys(pattern) {
    return this._safeExec(() => this.client.keys(pattern));
  }

  /**
   * 优雅关闭连接
   */
  async quit() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (err) {
        // 忽略关闭时的错误
      }
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * 获取连接状态
   */
  get connected() {
    return this.isConnected;
  }
}

// 导出单例
export const redisService = new RedisService();
export default redisService;
