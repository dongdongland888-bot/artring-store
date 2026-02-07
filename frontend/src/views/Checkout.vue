<template><div class="container-custom py-12"><h1 class="text-3xl font-serif font-bold mb-8">结算</h1><div class="lg:flex gap-12"><div class="flex-1 space-y-8"><div class="card"><h2 class="text-lg font-semibold mb-4">收货地址</h2><div v-if="addresses.length"><div v-for="addr in addresses" :key="addr.id" class="p-4 border mb-2 cursor-pointer" :class="selectedAddress === addr.id ? 'border-dark' : ''" @click="selectedAddress = addr.id"><p class="font-medium">{{ addr.firstName }} {{ addr.lastName }}</p><p class="text-sm text-gray-600">{{ addr.street }}, {{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}</p><p class="text-sm text-gray-600">{{ addr.phone }}</p></div></div><p v-else class="text-gray-500">请先添加收货地址</p></div><div class="card"><h2 class="text-lg font-semibold mb-4">支付方式</h2><p class="text-gray-600">Stripe 安全支付 (信用卡/借记卡)</p></div></div><div class="lg:w-96 mt-8 lg:mt-0"><div class="bg-gray-50 p-6"><h2 class="text-lg font-semibold mb-4">订单摘要</h2><div class="space-y-4 mb-4"><div v-for="item in cartStore.items" :key="item.id" class="flex gap-4"><img :src="item.product.images?.[0]?.url" class="w-16 h-16 object-cover"><div class="flex-1"><p class="text-sm font-medium">{{ item.product.name }}</p><p class="text-sm text-gray-500">x{{ item.quantity }}</p></div><p class="text-sm font-medium">${{ ((item.variant?.price || item.product.basePrice) * item.quantity).toFixed(2) }}</p></div></div><hr class="my-4"><div class="space-y-2 text-sm"><div class="flex justify-between"><span>小计</span><span>${{ cartStore.subtotal.toFixed(2) }}</span></div><div class="flex justify-between"><span>运费</span><span>{{ cartStore.subtotal >= 100 ? '免费' : '$10.00' }}</span></div></div><hr class="my-4"><div class="flex justify-between text-lg font-semibold"><span>总计</span><span>${{ (cartStore.subtotal + (cartStore.subtotal >= 100 ? 0 : 10)).toFixed(2) }}</span></div><button @click="placeOrder" class="w-full btn btn-primary mt-6" :disabled="!selectedAddress || isLoading">{{ isLoading ? '处理中...' : '确认下单' }}</button></div></div></div></div></template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import api from '@/api'
const router = useRouter()
const toast = useToast()
const cartStore = useCartStore()
const addresses = ref([])
const selectedAddress = ref(null)
const isLoading = ref(false)
onMounted(async () => {
  try {
    addresses.value = await api.users.addresses()
    if (addresses.value.length) selectedAddress.value = addresses.value.find(a => a.isDefault)?.id || addresses.value[0].id
  } catch (e) { console.error(e) }
})
const placeOrder = async () => {
  if (!selectedAddress.value) { toast.warning('请选择收货地址'); return }
  isLoading.value = true
  try {
    const res = await api.orders.create({ addressId: selectedAddress.value })
    cartStore.clearLocal()
    router.push(`/order-success/${res.order.orderNumber}`)
  } catch (e) { toast.error(e.message) }
  finally { isLoading.value = false }
}
</script>
