<template><div class="container-custom py-12"><RouterLink to="/" class="text-gray-500 hover:text-dark mb-4 block">← 返回首页</RouterLink><h1 class="text-3xl font-serif font-bold mb-2">{{ category?.name }}</h1><p class="text-gray-500 mb-8">{{ category?.description || `浏览 ${category?.name} 系列商品` }}</p><div v-if="isLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-6"><div v-for="i in 8" :key="i" class="animate-pulse"><div class="aspect-square bg-gray-200 mb-4"></div><div class="h-4 bg-gray-200 mb-2"></div><div class="h-4 bg-gray-200 w-1/2"></div></div></div><div v-else-if="products.length" class="grid grid-cols-2 lg:grid-cols-4 gap-6"><ProductCard v-for="p in products" :key="p.id" :product="p" /></div><div v-else class="text-center py-20"><p class="text-gray-500">该分类暂无商品</p></div></div></template>
<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '@/components/product/ProductCard.vue'
import api from '@/api'
const route = useRoute()
const isLoading = ref(true)
const category = ref(null)
const products = ref([])
const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await api.categories.products(route.params.slug)
    category.value = res.category
    products.value = res.products
  } catch (e) { console.error(e) }
  finally { isLoading.value = false }
}
watch(() => route.params.slug, fetchData, { immediate: true })
</script>
