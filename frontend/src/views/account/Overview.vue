<template>
  <div>
    <h1 class="text-2xl font-serif font-bold mb-6">{{ t('account.welcome', { name: authStore.user?.firstName || t('account.user') }) }}</h1>
    <div class="grid md:grid-cols-2 gap-6">
      <div class="card"><h2 class="font-semibold mb-2">{{ t('account.myOrders') }}</h2><p class="text-gray-600 text-sm mb-4">{{ t('account.ordersDesc') }}</p><RouterLink to="/account/orders" class="text-accent-600 text-sm hover:underline">{{ t('account.viewOrders') }} →</RouterLink></div>
      <div class="card"><h2 class="font-semibold mb-2">{{ t('account.manageAddresses') }}</h2><p class="text-gray-600 text-sm mb-4">{{ t('account.manageAddressesDesc') }}</p><RouterLink to="/account/addresses" class="text-accent-600 text-sm hover:underline">{{ t('account.manageAddresses') }} →</RouterLink></div>
      <div class="card"><h2 class="font-semibold mb-2">{{ t('account.wishlistTitle') }}</h2><p class="text-gray-600 text-sm mb-4">{{ t('account.wishlistDesc') }}</p><RouterLink to="/account/wishlist" class="text-accent-600 text-sm hover:underline">{{ t('account.viewWishlist') }} →</RouterLink></div>
      <div class="card"><h2 class="font-semibold mb-2">{{ t('account.settingsTitle') }}</h2><p class="text-gray-600 text-sm mb-4">{{ t('account.settingsDesc') }}</p><RouterLink to="/account/settings" class="text-accent-600 text-sm hover:underline">{{ t('account.goToSettings') }} →</RouterLink></div>
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()
</script>
