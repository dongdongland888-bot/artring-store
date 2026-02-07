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
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
})

export default router
