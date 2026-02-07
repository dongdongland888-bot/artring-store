import axios from 'axios'

// 创建 Axios 实例
const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

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
    const message = error.response?.data?.error || '请求失败'
    
    // 401 未授权
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token')
      window.location.href = '/login'
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
    confirm: (data) => http.post('/payments/confirm', data)
  }
}

export default api
