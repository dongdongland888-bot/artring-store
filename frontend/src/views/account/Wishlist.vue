<template>
  <div>
    <h1 class="text-2xl font-serif font-bold mb-6">{{ t('account.wishlistTitle') }}</h1>
    <div v-if="isLoading" class="grid grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="animate-pulse"><div class="aspect-square bg-gray-200"></div></div>
    </div>
    <div v-else-if="wishlist.length" class="grid grid-cols-2 lg:grid-cols-3 gap-6">
      <ProductCard v-for="item in wishlist" :key="item.id" :product="item.product" />
    </div>
    <div v-else class="text-center py-12">
      <p class="text-gray-500 mb-4">{{ t('account.wishlistEmpty') }}</p>
      <RouterLink to="/shop" class="btn btn-primary">{{ t('account.discover') }}</RouterLink>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ProductCard from '@/components/product/ProductCard.vue'
import api from '@/api'

const { t } = useI18n()
const isLoading = ref(true)
const wishlist = ref([])
onMounted(async () => { try { wishlist.value = await api.users.wishlist() } catch(e){} finally { isLoading.value = false } })
</script>
