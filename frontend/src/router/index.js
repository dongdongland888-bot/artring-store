import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 页面组件
import Home from '@/views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/shop',
    name: 'shop',
    component: () => import('@/views/Shop.vue')
  },
  {
    path: '/category/:slug',
    name: 'category',
    component: () => import('@/views/Category.vue')
  },
  {
    path: '/product/:slug',
    name: 'product',
    component: () => import('@/views/ProductDetail.vue')
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('@/views/Cart.vue')
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/views/Checkout.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/order-success/:orderNumber',
    name: 'orderSuccess',
    component: () => import('@/views/OrderSuccess.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/Login.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/Register.vue')
  },
  {
    path: '/account',
    name: 'account',
    component: () => import('@/views/account/Account.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'accountOverview',
        component: () => import('@/views/account/Overview.vue')
      },
      {
        path: 'orders',
        name: 'accountOrders',
        component: () => import('@/views/account/Orders.vue')
      },
      {
        path: 'orders/:orderNumber',
        name: 'orderDetail',
        component: () => import('@/views/account/OrderDetail.vue')
      },
      {
        path: 'addresses',
        name: 'accountAddresses',
        component: () => import('@/views/account/Addresses.vue')
      },
      {
        path: 'wishlist',
        name: 'accountWishlist',
        component: () => import('@/views/account/Wishlist.vue')
      },
      {
        path: 'settings',
        name: 'accountSettings',
        component: () => import('@/views/account/Settings.vue')
      }
    ]
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/About.vue')
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/views/Contact.vue')
  },
  // 管理后台
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'adminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'products',
        name: 'adminProducts',
        component: () => import('@/views/admin/Products.vue')
      },
      {
        path: 'products/new',
        name: 'adminProductNew',
        component: () => import('@/views/admin/ProductForm.vue')
      },
      {
        path: 'products/:id/edit',
        name: 'adminProductEdit',
        component: () => import('@/views/admin/ProductForm.vue')
      },
      {
        path: 'orders',
        name: 'adminOrders',
        component: () => import('@/views/admin/Orders.vue')
      },
      {
        path: 'orders/:id',
        name: 'adminOrderDetail',
        component: () => import('@/views/admin/OrderDetail.vue')
      },
      {
        path: 'users',
        name: 'adminUsers',
        component: () => import('@/views/admin/Users.vue')
      },
      {
        path: 'categories',
        name: 'adminCategories',
        component: () => import('@/views/admin/Categories.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 如果有 token 但没有 user 信息，先恢复用户数据
  if (authStore.isLoggedIn && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch {
      // token 过期或无效，清除登录状态
      authStore.logout()
    }
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
