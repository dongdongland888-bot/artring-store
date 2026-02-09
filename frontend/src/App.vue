<template>
  <div class="min-h-screen flex flex-col">
    <!-- 顶部公告栏 -->
    <div v-if="showAnnouncement" class="bg-dark text-white text-center py-2 text-sm relative">
      <p>新会员首单享 15% OFF | 满 $100 免运费</p>
      <button
        @click="showAnnouncement = false"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1"
        aria-label="关闭公告"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- 路由加载进度条 -->
    <div
      v-if="isRouteLoading"
      class="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-accent-500"
      :style="{ width: loadingProgress + '%', transition: 'width 0.3s ease' }"
    ></div>

    <!-- 导航栏 -->
    <Navbar />

    <!-- 主内容区 -->
    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <!-- 页脚 -->
    <Footer />

    <!-- 购物车侧边栏 -->
    <CartDrawer />

    <!-- 返回顶部按钮 -->
    <transition name="fade">
      <button
        v-if="showBackToTop"
        @click="scrollToTop"
        class="fixed bottom-6 right-6 z-40 w-10 h-10 bg-dark text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
        aria-label="返回顶部"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import Navbar from '@/components/layout/Navbar.vue'
import Footer from '@/components/layout/Footer.vue'
import CartDrawer from '@/components/cart/CartDrawer.vue'

const router = useRouter()

// 公告栏
const showAnnouncement = ref(!sessionStorage.getItem('announcement-closed'))

// 路由加载进度条
const isRouteLoading = ref(false)
const loadingProgress = ref(0)
let loadingTimer = null

router.beforeEach(() => {
  isRouteLoading.value = true
  loadingProgress.value = 30
  loadingTimer = setInterval(() => {
    if (loadingProgress.value < 90) {
      loadingProgress.value += Math.random() * 15
    }
  }, 200)
})

router.afterEach(() => {
  loadingProgress.value = 100
  clearInterval(loadingTimer)
  setTimeout(() => {
    isRouteLoading.value = false
    loadingProgress.value = 0
  }, 300)
})

// 返回顶部
const showBackToTop = ref(false)

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 400
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  clearInterval(loadingTimer)
})
</script>
