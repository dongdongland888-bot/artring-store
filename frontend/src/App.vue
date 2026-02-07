<template>
  <div class="min-h-screen flex flex-col">
    <!-- 顶部公告栏 -->
    <div class="bg-dark text-white text-center py-2 text-sm">
      <p>✨ 新会员首单享 15% OFF | 满 $100 免运费</p>
    </div>

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
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import Navbar from '@/components/layout/Navbar.vue'
import Footer from '@/components/layout/Footer.vue'
import CartDrawer from '@/components/cart/CartDrawer.vue'
</script>
