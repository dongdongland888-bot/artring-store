import axios from 'axios'
import router from '@/router'

// 创建 Axios 实例
const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 是否正在跳转登录（防止重复跳转）
let isRedirectingToLogin = false

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 网络错误（无 response）
    if (!error.response) {
      return Promise.reject(new Error('网络连接失败，请检查网络后重试'))
    }

    const { status, data } = error.response
    let message = data?.error || '请求失败'

    // 401 未授权 - 使用 Vue Router 而不是 window.location
    if (status === 401 && !isRedirectingToLogin) {
      isRedirectingToLogin = true
      localStorage.removeItem('auth-token')

      const currentPath = router.currentRoute?.value?.fullPath
      // 不在登录页才跳转
      if (currentPath && currentPath !== '/login') {
        router.push({ name: 'login', query: { redirect: currentPath } })
      }

      // 防止短时间内重复跳转
      setTimeout(() => { isRedirectingToLogin = false }, 2000)
      message = '登录已过期，请重新登录'
    }

    // 403 无权限
    if (status === 403) {
      message = '没有权限执行此操作'
    }

    // 422 验证错误
    if (status === 422) {
      message = data?.errors?.map(e => e.message).join('，') || message
    }

    // 429 请求过多
    if (status === 429) {
      message = '请求过于频繁，请稍后再试'
    }

    // 500 服务器错误
    if (status >= 500) {
      message = '服务器内部错误，请稍后重试'
    }

    return Promise.reject(new Error(message))
  }
)

// API 模块
const api = {
  // 设置 Token
  setToken(token) {
    if (token) {
      localStorage.setItem('auth-token', token)
    } else {
      localStorage.removeItem('auth-token')
    }
  },

  // 认证相关
  auth: {
    login: (data) => http.post('/auth/login', data),
    register: (data) => http.post('/auth/register', data),
    me: () => http.get('/auth/me'),
    updateMe: (data) => http.put('/auth/me', data),
    changePassword: (data) => http.put('/auth/password', data)
  },

  // 商品相关
  products: {
    list: (params) => http.get('/products', { params }),
    get: (slug) => http.get(`/products/${slug}`),
    featured: (limit = 8) => http.get('/products/featured/list', { params: { limit } }),
    bestsellers: (limit = 8) => http.get('/products/bestsellers/list', { params: { limit } }),
    newArrivals: (limit = 8) => http.get('/products/new/list', { params: { limit } }),
    related: (id, limit = 4) => http.get(`/products/${id}/related`, { params: { limit } })
  },

  // 分类相关
  categories: {
    list: () => http.get('/categories'),
    get: (slug) => http.get(`/categories/${slug}`),
    products: (slug, params) => http.get(`/categories/${slug}/products`, { params })
  },

  // 购物车
  cart: {
    get: () => http.get('/cart'),
    add: (data) => http.post('/cart', data),
    update: (id, data) => http.put(`/cart/${id}`, data),
    remove: (id) => http.delete(`/cart/${id}`),
    clear: () => http.delete('/cart')
  },

  // 订单
  orders: {
    list: (params) => http.get('/orders', { params }),
    get: (orderNumber) => http.get(`/orders/${orderNumber}`),
    create: (data) => http.post('/orders', data),
    cancel: (orderNumber) => http.put(`/orders/${orderNumber}/cancel`)
  },

  // 用户
  users: {
    addresses: () => http.get('/users/addresses'),
    addAddress: (data) => http.post('/users/addresses', data),
    updateAddress: (id, data) => http.put(`/users/addresses/${id}`, data),
    deleteAddress: (id) => http.delete(`/users/addresses/${id}`),
    wishlist: () => http.get('/users/wishlist'),
    addWishlist: (productId) => http.post('/users/wishlist', { productId }),
    removeWishlist: (productId) => http.delete(`/users/wishlist/${productId}`)
  },

  // 支付
  payments: {
    createIntent: (orderId) => http.post('/payments/create-payment-intent', { orderId }),
    confirm: (data) => http.post('/payments/confirm', data),
    getStripePublishableKey: () => http.get('/payments/stripe-publishable-key'),
    getPayPalClientId: () => http.get('/payments/paypal/client-id'),
    createPayPalOrder: (orderId) => http.post('/payments/paypal/create-order', { orderId }),
    capturePayPal: (data) => http.post('/payments/paypal/capture', data)
  },

  // 评价
  reviews: {
    // 获取商品评价列表
    list: (productId, params) => http.get(`/products/${productId}/reviews`, { params }),
    // 创建评价
    create: (data) => http.post('/reviews', data),
    // 编辑评价
    update: (id, data) => http.put(`/reviews/${id}`, data),
    // 删除评价
    delete: (id) => http.delete(`/reviews/${id}`),
    // 标记有帮助
    helpful: (id, visitorId) => http.post(`/reviews/${id}/helpful`, { visitorId }),
    // 获取我的评价
    my: (params) => http.get('/reviews/my', { params }),
    // 获取待评价商品
    pending: () => http.get('/reviews/pending')
  },

  // 会员积分
  points: {
    // 查询积分余额和等级
    balance: () => http.get('/points/balance'),
    // 积分明细(分页)
    history: (params) => http.get('/points/history', { params }),
    // 可兑换的优惠券列表
    coupons: () => http.get('/points/coupons'),
    // 积分兑换优惠券
    redeem: (couponId) => http.post('/points/redeem', { couponId }),
    // 计算订单可获积分
    calculate: (amount) => http.get('/points/calculate', { params: { amount } }),
    // 获取积分规则
    rules: () => http.get('/points/rules')
  },

  // 管理后台
  admin: {
    dashboard: () => http.get('/admin/dashboard'),
    // 商品
    products: (params) => http.get('/admin/products', { params }),
    product: (id) => http.get(`/admin/products/${id}`),
    createProduct: (data) => http.post('/admin/products', data),
    updateProduct: (id, data) => http.put(`/admin/products/${id}`, data),
    deleteProduct: (id) => http.delete(`/admin/products/${id}`),
    // 变体
    createVariant: (productId, data) => http.post(`/admin/products/${productId}/variants`, data),
    updateVariant: (productId, id, data) => http.put(`/admin/products/${productId}/variants/${id}`, data),
    deleteVariant: (productId, id) => http.delete(`/admin/products/${productId}/variants/${id}`),
    // 图片
    addImage: (productId, data) => http.post(`/admin/products/${productId}/images`, data),
    deleteImage: (productId, id) => http.delete(`/admin/products/${productId}/images/${id}`),
    // 订单
    orders: (params) => http.get('/admin/orders', { params }),
    order: (id) => http.get(`/admin/orders/${id}`),
    updateOrderStatus: (id, data) => http.put(`/admin/orders/${id}/status`, data),
    // 分类
    createCategory: (data) => http.post('/admin/categories', data),
    updateCategory: (id, data) => http.put(`/admin/categories/${id}`, data),
    deleteCategory: (id) => http.delete(`/admin/categories/${id}`),
    // 用户
    users: (params) => http.get('/admin/users', { params }),
    updateUser: (id, data) => http.put(`/admin/users/${id}`, data),
    // 评价管理
    reviews: (params) => http.get('/admin/reviews', { params }),
    approveReview: (id, isApproved) => http.put(`/admin/reviews/${id}/approve`, { isApproved }),
    pinReview: (id, isPinned) => http.put(`/admin/reviews/${id}/pin`, { isPinned }),
    deleteReview: (id) => http.delete(`/admin/reviews/${id}`)
  }
}

export default api
