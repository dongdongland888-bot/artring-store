<template>
  <div class="container-custom py-12">
    <div class="lg:flex gap-12">
      <aside class="lg:w-64 mb-8 lg:mb-0">
        <nav class="space-y-1">
          <RouterLink to="/account" class="block px-4 py-2 hover:bg-gray-100" :class="{ 'bg-gray-100 font-medium': route.name === 'accountOverview' }">{{ t('account.overview') }}</RouterLink>
          <RouterLink to="/account/orders" class="block px-4 py-2 hover:bg-gray-100" :class="{ 'bg-gray-100 font-medium': route.name?.includes('order') }">{{ t('account.orders') }}</RouterLink>
          <RouterLink to="/account/addresses" class="block px-4 py-2 hover:bg-gray-100" :class="{ 'bg-gray-100 font-medium': route.name === 'accountAddresses' }">{{ t('account.shippingAddress') }}</RouterLink>
          <RouterLink to="/account/wishlist" class="block px-4 py-2 hover:bg-gray-100" :class="{ 'bg-gray-100 font-medium': route.name === 'accountWishlist' }">{{ t('account.wishlist') }}</RouterLink>
          <RouterLink to="/account/settings" class="block px-4 py-2 hover:bg-gray-100" :class="{ 'bg-gray-100 font-medium': route.name === 'accountSettings' }">{{ t('account.settings') }}</RouterLink>
          <button @click="handleLogout" class="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">{{ t('account.logout') }}</button>
        </nav>
      </aside>
      <div class="flex-1"><RouterView /></div>
    </div>
  </div>
</template>
<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const handleLogout = () => { authStore.logout(); router.push('/') }
</script>
