<template>
  <div>
    <!-- Hero Section -->
    <section class="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] bg-primary-100">
      <div class="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80"
          alt="Hero"
          class="w-full h-full object-cover"
        >
        <div class="absolute inset-0 bg-black/30"></div>
      </div>
      
      <div class="relative container-custom h-full flex items-center">
        <div class="max-w-xl text-white">
          <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-4 sm:mb-6 animate-fade-in whitespace-pre-line">
            {{ t('home.heroTitle') }}
          </h1>
          <p class="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-gray-200">
            {{ t('home.heroSubtitle') }}
          </p>
          <RouterLink to="/shop" class="btn btn-primary bg-white text-dark hover:bg-gray-100">
            {{ t('home.explore') }}
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 特色分类 -->
    <section class="container-custom py-10 sm:py-16 lg:py-20">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <RouterLink 
          v-for="item in featuredCategories"
          :key="item.slug"
          :to="`/category/${item.slug}`"
          class="group relative aspect-[3/2] sm:aspect-[4/5] overflow-hidden"
        >
          <img 
            :src="item.image"
            :alt="item.name"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          >
          <div class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center text-white">
            <h3 class="text-2xl font-serif font-bold mb-2">{{ item.name }}</h3>
            <span class="text-sm underline underline-offset-4">{{ t('home.browseSeries') }}</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- 新品上市 -->
    <section class="container-custom py-10 sm:py-16 lg:py-20">
      <div class="flex items-center justify-between mb-6 sm:mb-10">
        <h2 class="text-2xl sm:text-3xl font-serif font-bold">{{ t('home.newArrivals') }}</h2>
        <RouterLink to="/shop?sort=newest" class="link">
          {{ t('home.viewAll') }}
        </RouterLink>
      </div>
      
      <div v-if="isLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div v-for="i in 4" :key="i" class="animate-pulse">
          <div class="aspect-square bg-gray-200 mb-4"></div>
          <div class="h-4 bg-gray-200 mb-2"></div>
          <div class="h-4 bg-gray-200 w-1/2"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <ProductCard 
          v-for="product in newProducts"
          :key="product.id"
          :product="product"
        />
      </div>
    </section>

    <!-- 品牌故事 -->
    <section class="bg-primary-100 py-10 sm:py-16 lg:py-20">
      <div class="container-custom">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div class="order-2 lg:order-1">
            <h2 class="text-3xl lg:text-4xl font-serif font-bold mb-6">
              {{ t('home.aboutTitle') }}
            </h2>
            <p class="text-gray-600 leading-relaxed mb-6">
              {{ t('home.aboutText1') }}
            </p>
            <p class="text-gray-600 leading-relaxed mb-8">
              {{ t('home.aboutText2') }}
            </p>
            <RouterLink to="/about" class="btn btn-outline">
              {{ t('home.learnMore') }}
            </RouterLink>
          </div>
          <div class="order-1 lg:order-2">
            <img 
              src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80"
              alt="About"
              class="w-full aspect-[4/3] object-cover"
            >
          </div>
        </div>
      </div>
    </section>

    <!-- 畅销商品 -->
    <section class="container-custom py-10 sm:py-16 lg:py-20">
      <div class="flex items-center justify-between mb-6 sm:mb-10">
        <h2 class="text-2xl sm:text-3xl font-serif font-bold">{{ t('home.bestsellers') }}</h2>
        <RouterLink to="/shop?sort=popular" class="link">
          {{ t('home.viewAll') }}
        </RouterLink>
      </div>
      
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <ProductCard 
          v-for="product in bestSellers"
          :key="product.id"
          :product="product"
        />
      </div>
    </section>

    <!-- 服务保障 -->
    <section class="border-t border-gray-200">
      <div class="container-custom py-16">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <TruckIcon class="w-8 h-8 mx-auto mb-4 text-accent-500" />
            <h3 class="font-semibold mb-2">{{ t('home.freeShipping') }}</h3>
            <p class="text-sm text-gray-500">{{ t('home.freeShippingDesc') }}</p>
          </div>
          <div>
            <ArrowPathIcon class="w-8 h-8 mx-auto mb-4 text-accent-500" />
            <h3 class="font-semibold mb-2">{{ t('home.returns30') }}</h3>
            <p class="text-sm text-gray-500">{{ t('home.returns30Desc') }}</p>
          </div>
          <div>
            <ShieldCheckIcon class="w-8 h-8 mx-auto mb-4 text-accent-500" />
            <h3 class="font-semibold mb-2">{{ t('home.quality') }}</h3>
            <p class="text-sm text-gray-500">{{ t('home.qualityDesc') }}</p>
          </div>
          <div>
            <ChatBubbleLeftRightIcon class="w-8 h-8 mx-auto mb-4 text-accent-500" />
            <h3 class="font-semibold mb-2">{{ t('home.support') }}</h3>
            <p class="text-sm text-gray-500">{{ t('home.supportDesc') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Instagram Feed -->
    <section class="py-10 sm:py-16 lg:py-20">
      <div class="text-center mb-6 sm:mb-10">
        <h2 class="text-2xl sm:text-3xl font-serif font-bold mb-2">@ArtRing</h2>
        <p class="text-gray-500">{{ t('home.instagram') }}</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <a 
          v-for="i in 6" 
          :key="i"
          href="#"
          class="group relative aspect-square overflow-hidden"
        >
          <img 
            :src="`https://picsum.photos/400/400?random=${i}`"
            alt="Instagram"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          >
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-white">{{ t('home.viewPhoto') }}</span>
          </div>
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  TruckIcon, 
  ArrowPathIcon, 
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'
import ProductCard from '@/components/product/ProductCard.vue'
import api from '@/api'

const { t } = useI18n()
const isLoading = ref(true)
const newProducts = ref([])
const bestSellers = ref([])

const featuredCategories = computed(() => [
  { name: t('home.featuredMinimal'), slug: 'minimal', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80' },
  { name: t('home.featuredVintage'), slug: 'vintage', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80' },
  { name: t('home.featuredArtistic'), slug: 'artistic', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80' }
])

onMounted(async () => {
  try {
    const [newRes, bestRes] = await Promise.all([
      api.products.newArrivals(4),
      api.products.bestsellers(4)
    ])
    newProducts.value = newRes
    bestSellers.value = bestRes
  } catch (error) {
    console.error('Failed to fetch products:', error)
  } finally {
    isLoading.value = false
  }
})
</script>
