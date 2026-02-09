<template>
  <div class="container-custom py-8 sm:py-12">
    <!-- 面包屑 -->
    <nav class="mb-6 sm:mb-8 text-sm">
      <RouterLink to="/" class="text-gray-500 hover:text-dark">首页</RouterLink>
      <span class="mx-2 text-gray-400">/</span>
      <span>全部商品</span>
    </nav>

    <div class="lg:flex gap-8 xl:gap-12">
      <!-- Mobile filter toggle -->
      <button
        @click="showFilters = true"
        class="lg:hidden flex items-center gap-2 mb-4 text-sm font-medium border px-4 py-2.5 hover:bg-gray-50 w-full justify-center"
      >
        <AdjustmentsHorizontalIcon class="w-4 h-4" />
        筛选条件
      </button>

      <!-- Sidebar overlay (mobile) -->
      <div
        v-if="showFilters"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden"
        @click="showFilters = false"
      ></div>

      <!-- 侧边栏筛选 -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-72 lg:w-64 bg-white lg:bg-transparent flex-shrink-0 transform transition-transform lg:transform-none overflow-y-auto"
        :class="showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <div class="p-6 lg:p-0 lg:sticky lg:top-24 space-y-8">
          <!-- Mobile header -->
          <div class="flex items-center justify-between lg:hidden">
            <h3 class="font-semibold text-lg">筛选条件</h3>
            <button @click="showFilters = false" class="p-1 hover:bg-gray-100 rounded">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- 分类 -->
          <div>
            <h3 class="font-semibold mb-4">分类</h3>
            <ul class="space-y-2">
              <li>
                <button 
                  @click="filters.category = ''; showFilters = false"
                  class="text-sm"
                  :class="filters.category === '' ? 'font-semibold' : 'text-gray-600'"
                >
                  全部
                </button>
              </li>
              <li v-for="cat in categories" :key="cat.id">
                <button 
                  @click="filters.category = cat.slug; showFilters = false"
                  class="text-sm"
                  :class="filters.category === cat.slug ? 'font-semibold' : 'text-gray-600'"
                >
                  {{ cat.name }} ({{ cat._count?.products || 0 }})
                </button>
              </li>
            </ul>
          </div>

          <!-- 材质 -->
          <div>
            <h3 class="font-semibold mb-4">材质</h3>
            <ul class="space-y-2">
              <li v-for="m in materials" :key="m">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    :value="m"
                    v-model="filters.materials"
                    class="rounded border-gray-300"
                  >
                  <span class="text-sm">{{ m }}</span>
                </label>
              </li>
            </ul>
          </div>

          <!-- 价格范围 -->
          <div>
            <h3 class="font-semibold mb-4">价格</h3>
            <div class="flex gap-2 items-center">
              <input 
                v-model.number="filters.minPrice"
                type="number"
                placeholder="最低"
                class="input w-24 text-sm py-2"
              >
              <span class="text-gray-400">-</span>
              <input 
                v-model.number="filters.maxPrice"
                type="number"
                placeholder="最高"
                class="input w-24 text-sm py-2"
              >
            </div>
          </div>

          <!-- 清除筛选 -->
          <button 
            @click="clearFilters"
            class="text-sm text-gray-500 underline"
          >
            清除筛选
          </button>
        </div>
      </aside>

      <!-- 商品列表 -->
      <div class="flex-1">
        <!-- 头部 -->
        <div class="flex items-center justify-between mb-6 sm:mb-8">
          <p class="text-gray-500 text-sm sm:text-base">
            共 {{ total }} 件商品
          </p>
          <select 
            v-model="sort"
            class="input w-auto text-sm py-2"
          >
            <option value="newest">最新上架</option>
            <option value="priceAsc">价格从低到高</option>
            <option value="priceDesc">价格从高到低</option>
            <option value="popular">热门商品</option>
            <option value="rating">好评优先</option>
          </select>
        </div>

        <!-- 加载中 -->
        <div v-if="isLoading" class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <div v-for="i in 6" :key="i" class="animate-pulse">
            <div class="aspect-square bg-gray-200 mb-4"></div>
            <div class="h-4 bg-gray-200 mb-2"></div>
            <div class="h-4 bg-gray-200 w-1/2"></div>
          </div>
        </div>

        <!-- 商品网格 -->
        <div v-else-if="products.length > 0" class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <ProductCard 
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>

        <!-- 无商品 -->
        <div v-else class="text-center py-20">
          <p class="text-gray-500 mb-4">没有找到相关商品</p>
          <button @click="clearFilters" class="btn btn-outline">
            清除筛选
          </button>
        </div>

        <!-- 分页 -->
        <div v-if="pages > 1" class="mt-8 sm:mt-12 flex justify-center gap-2">
          <button 
            v-for="p in pages"
            :key="p"
            @click="page = p"
            class="w-10 h-10 flex items-center justify-center border transition-colors"
            :class="page === p ? 'bg-dark text-white' : 'hover:bg-gray-100'"
          >
            {{ p }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import ProductCard from '@/components/product/ProductCard.vue'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const isLoading = ref(true)
const products = ref([])
const categories = ref([])
const total = ref(0)
const pages = ref(1)
const page = ref(1)
const sort = ref('newest')
const showFilters = ref(false)

const filters = reactive({
  category: '',
  materials: [],
  minPrice: null,
  maxPrice: null
})

const materials = ['925银', '18K金', '不锈钢', '钛钢', '合金']

// 获取分类
onMounted(async () => {
  try {
    categories.value = await api.categories.list()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
})

// 获取商品
const fetchProducts = async () => {
  isLoading.value = true
  try {
    const params = {
      page: page.value,
      limit: 12,
      sort: sort.value,
      ...(filters.category && { category: filters.category }),
      ...(filters.minPrice && { minPrice: filters.minPrice }),
      ...(filters.maxPrice && { maxPrice: filters.maxPrice })
    }
    
    const response = await api.products.list(params)
    products.value = response.products
    total.value = response.pagination.total
    pages.value = response.pagination.pages
  } catch (error) {
    console.error('Failed to fetch products:', error)
  } finally {
    isLoading.value = false
  }
}

// 清除筛选
const clearFilters = () => {
  filters.category = ''
  filters.materials = []
  filters.minPrice = null
  filters.maxPrice = null
  page.value = 1
  showFilters.value = false
}

// 监听筛选变化
watch([filters, sort], () => {
  page.value = 1
  fetchProducts()
}, { deep: true })

watch(page, fetchProducts)

// 初始加载
onMounted(fetchProducts)
</script>
