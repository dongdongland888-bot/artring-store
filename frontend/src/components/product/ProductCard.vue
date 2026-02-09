<template>
  <RouterLink 
    :to="`/product/${product.slug}`"
    class="product-card group block"
  >
    <!-- 商品图片 -->
    <div class="relative aspect-square overflow-hidden bg-gray-100">
      <img 
        :src="product.images?.[0]?.url || '/placeholder.jpg'"
        :alt="product.name"
        class="product-image w-full h-full object-cover"
        loading="lazy"
      >
      
      <!-- 标签 -->
      <div class="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-2">
        <span 
          v-if="isNew"
          class="bg-dark text-white text-xs px-2 py-1"
        >
          NEW
        </span>
        <span 
          v-if="product.comparePrice"
          class="bg-red-500 text-white text-xs px-2 py-1"
        >
          SALE
        </span>
      </div>

      <!-- 快捷操作 (always visible on mobile, hover on desktop) -->
      <div class="absolute inset-x-0 bottom-0 p-2 sm:p-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          @click.prevent="addToCart"
          class="w-full btn btn-primary text-xs sm:text-sm py-2 sm:py-3"
          :disabled="!hasStock"
        >
          {{ hasStock ? '加入购物车' : '售罄' }}
        </button>
      </div>

      <!-- 收藏按钮 -->
      <button 
        @click.prevent="toggleWishlist"
        class="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-white/80 hover:bg-white rounded-full sm:opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <HeartIcon 
          class="w-5 h-5"
          :class="isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'"
        />
      </button>
    </div>

    <!-- 商品信息 -->
    <div class="py-2 sm:py-4">
      <h3 class="font-medium text-xs sm:text-sm mb-1 line-clamp-2 group-hover:text-accent-600 transition-colors">
        {{ product.name }}
      </h3>
      
      <!-- 评分 -->
      <div v-if="product.reviewCount > 0" class="flex items-center gap-1 mb-2">
        <div class="flex text-accent-400">
          <StarIcon v-for="i in 5" :key="i" class="w-3.5 h-3.5" :class="i <= Math.round(product.avgRating) ? 'fill-current' : ''" />
        </div>
        <span class="text-xs text-gray-500">({{ product.reviewCount }})</span>
      </div>

      <!-- 价格 -->
      <div class="flex items-center gap-1 sm:gap-2">
        <span class="font-semibold text-sm sm:text-base text-accent-600">${{ product.basePrice }}</span>
        <span 
          v-if="product.comparePrice"
          class="text-sm text-gray-400 line-through"
        >
          ${{ product.comparePrice }}
        </span>
      </div>

      <!-- 颜色选项预览 -->
      <div v-if="colors.length > 0" class="flex gap-1 mt-2">
        <span 
          v-for="color in colors.slice(0, 4)"
          :key="color"
          class="w-4 h-4 rounded-full border border-gray-200"
          :style="{ backgroundColor: getColorHex(color) }"
          :title="color"
        ></span>
        <span v-if="colors.length > 4" class="text-xs text-gray-500 ml-1">
          +{{ colors.length - 4 }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { HeartIcon, StarIcon } from '@heroicons/vue/24/outline'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import api from '@/api'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()

// 是否新品 (30天内)
const isNew = computed(() => {
  const created = new Date(props.product.createdAt)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return created > thirtyDaysAgo
})

// 是否有库存
const hasStock = computed(() => {
  if (!props.product.variants?.length) return true
  return props.product.variants.some(v => v.stock > 0)
})

// 是否已收藏
const isWishlisted = computed(() => {
  // TODO: 实现收藏状态检查
  return false
})

// 获取颜色选项
const colors = computed(() => {
  if (!props.product.variants?.length) return []
  const colorSet = new Set(props.product.variants.map(v => v.color).filter(Boolean))
  return Array.from(colorSet)
})

// 颜色名称转十六进制
const colorMap = {
  '金色': '#c9a050',
  '银色': '#c0c0c0',
  '玫瑰金': '#b76e79',
  '黑色': '#1a1a1a',
  '白色': '#ffffff',
  'Gold': '#c9a050',
  'Silver': '#c0c0c0',
  'Rose Gold': '#b76e79',
  'Black': '#1a1a1a',
  'White': '#ffffff'
}

const getColorHex = (color) => colorMap[color] || '#cccccc'

// 加入购物车
const addToCart = async () => {
  if (!authStore.isLoggedIn) {
    toast.warning('请先登录')
    return
  }

  try {
    // 如果有变体，选择第一个有库存的
    const variant = props.product.variants?.find(v => v.stock > 0)
    await cartStore.addItem(props.product.id, variant?.id)
    toast.success('已加入购物车')
  } catch (error) {
    toast.error(error.message)
  }
}

// 收藏
const toggleWishlist = async () => {
  if (!authStore.isLoggedIn) {
    toast.warning('请先登录')
    return
  }

  try {
    if (isWishlisted.value) {
      await api.users.removeWishlist(props.product.id)
      toast.success('已取消收藏')
    } else {
      await api.users.addWishlist(props.product.id)
      toast.success('已添加到收藏')
    }
  } catch (error) {
    toast.error(error.message)
  }
}
</script>
