<template>
  <header class="bg-white sticky top-0 z-50 border-b border-gray-100">
    <nav class="container-custom">
      <div class="flex items-center justify-between h-16 lg:h-20">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center space-x-2">
          <span class="text-2xl font-serif font-bold tracking-tight">ArtRing</span>
        </RouterLink>

        <!-- 导航链接 (桌面端) -->
        <div class="hidden lg:flex items-center space-x-8">
          <RouterLink to="/shop" class="nav-link">全部商品</RouterLink>
          <div 
            class="relative group"
            @mouseenter="showCategories = true"
            @mouseleave="showCategories = false"
          >
            <button class="nav-link flex items-center">
              分类
              <ChevronDownIcon class="w-4 h-4 ml-1" />
            </button>
            <transition name="fade">
              <div 
                v-if="showCategories"
                class="absolute top-full left-0 mt-1 bg-white shadow-lg border border-gray-100 py-4 min-w-[200px] rounded-lg"
              >
                <RouterLink 
                  v-for="category in categories" 
                  :key="category.id"
                  :to="`/category/${category.slug}`"
                  class="block px-6 py-2 hover:bg-gray-50 transition-colors"
                >
                  {{ category.name }}
                </RouterLink>
                <p v-if="categories.length === 0" class="px-6 py-2 text-sm text-gray-400">暂无分类</p>
              </div>
            </transition>
          </div>
          <RouterLink to="/about" class="nav-link">关于我们</RouterLink>
          <RouterLink to="/contact" class="nav-link">联系我们</RouterLink>
        </div>

        <!-- 右侧图标 -->
        <div class="flex items-center space-x-2 sm:space-x-4">
          <!-- 搜索按钮 -->
          <button 
            @click="showSearch = true"
            class="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="搜索"
          >
            <MagnifyingGlassIcon class="w-5 h-5" />
          </button>

          <!-- 用户菜单 -->
          <div class="relative" v-if="authStore.isLoggedIn" ref="userMenuRef">
            <button 
              @click="showUserMenu = !showUserMenu"
              class="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="用户菜单"
            >
              <UserIcon class="w-5 h-5" />
            </button>
            <transition name="fade">
              <div 
                v-if="showUserMenu"
                class="absolute right-0 top-full mt-1 bg-white shadow-lg border border-gray-100 py-2 min-w-[160px] rounded-lg"
              >
                <RouterLink v-if="authStore.isAdmin" to="/admin" class="block px-4 py-2 hover:bg-gray-50 text-blue-600 font-medium">
                  管理后台
                </RouterLink>
                <RouterLink to="/account" class="block px-4 py-2 hover:bg-gray-50">
                  我的账户
                </RouterLink>
                <RouterLink to="/account/orders" class="block px-4 py-2 hover:bg-gray-50">
                  我的订单
                </RouterLink>
                <RouterLink to="/account/wishlist" class="block px-4 py-2 hover:bg-gray-50">
                  我的收藏
                </RouterLink>
                <hr class="my-2">
                <button 
                  @click="handleLogout"
                  class="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                >
                  退出登录
                </button>
              </div>
            </transition>
          </div>
          <RouterLink v-else to="/login" class="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="登录">
            <UserIcon class="w-5 h-5" />
          </RouterLink>

          <!-- 购物车 -->
          <button 
            @click="cartStore.toggleCart()"
            class="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            aria-label="购物车"
          >
            <ShoppingBagIcon class="w-5 h-5" />
            <span 
              v-if="cartStore.itemCount > 0"
              class="absolute -top-1 -right-1 bg-accent-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium shadow-sm"
            >
              {{ cartStore.itemCount > 99 ? '99+' : cartStore.itemCount }}
            </span>
          </button>

          <!-- 移动端菜单按钮 -->
          <button 
            @click="showMobileMenu = true"
            class="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="菜单"
          >
            <Bars3Icon class="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>

    <!-- 移动端菜单 -->
    <MobileMenu 
      :show="showMobileMenu" 
      :categories="categories"
      @close="showMobileMenu = false" 
    />

    <!-- 搜索弹窗 -->
    <SearchModal 
      :show="showSearch" 
      @close="showSearch = false" 
    />
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import api from '@/api'
import {
  MagnifyingGlassIcon,
  UserIcon,
  ShoppingBagIcon,
  Bars3Icon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'
import MobileMenu from './MobileMenu.vue'
import SearchModal from '@/components/layout/SearchModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()

const showCategories = ref(false)
const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const showSearch = ref(false)
const categories = ref([])
const userMenuRef = ref(null)

// 点击外部关闭用户菜单
const handleClickOutside = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)

  try {
    categories.value = await api.categories.list()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }

  if (authStore.isLoggedIn) {
    await cartStore.fetchCart()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 路由切换时关闭所有菜单
watch(() => route.fullPath, () => {
  showUserMenu.value = false
  showCategories.value = false
  showMobileMenu.value = false
  showSearch.value = false
})

// 登出
const handleLogout = () => {
  authStore.logout()
  cartStore.clearLocal()
  showUserMenu.value = false
  router.push('/')
}
</script>

<style scoped>
.nav-link {
  @apply text-sm font-medium text-gray-600 hover:text-dark transition-colors;
}

.router-link-active {
  @apply text-dark;
}
</style>
