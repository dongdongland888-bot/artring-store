<template><div><h1 class="text-2xl font-serif font-bold mb-6">订单详情</h1><div v-if="isLoading" class="animate-pulse space-y-4"><div class="h-8 bg-gray-200 w-1/2"></div><div class="h-40 bg-gray-200"></div></div><div v-else-if="order"><div class="mb-6"><p class="text-gray-500">订单号: {{ order.orderNumber }}</p><p class="text-gray-500">下单时间: {{ new Date(order.createdAt).toLocaleString() }}</p><p class="mt-2"><span class="px-2 py-1 text-sm" :class="statusClass">{{ statusText }}</span></p></div><div class="border p-4 mb-6"><h2 class="font-semibold mb-3">订单商品</h2><div v-for="item in order.items" :key="item.id" class="flex gap-4 py-3 border-b last:border-0"><img :src="item.product?.images?.[0]?.url" class="w-16 h-16 object-cover"><div class="flex-1"><p class="font-medium">{{ item.productName }}</p><p class="text-sm text-gray-500">{{ item.variantInfo }} x{{ item.quantity }}</p></div><p class="font-medium">${{ item.total }}</p></div></div><div class="grid md:grid-cols-2 gap-6"><div class="border p-4"><h2 class="font-semibold mb-3">收货地址</h2><p>{{ order.shippingAddress?.firstName }} {{ order.shippingAddress?.lastName }}</p><p class="text-sm text-gray-600">{{ order.shippingAddress?.street }}, {{ order.shippingAddress?.city }}</p><p class="text-sm text-gray-600">{{ order.shippingAddress?.phone }}</p></div><div class="border p-4"><h2 class="font-semibold mb-3">支付信息</h2><p>小计: ${{ order.subtotal }}</p><p>运费: ${{ order.shippingFee }}</p><p>折扣: -${{ order.discount }}</p><p class="font-semibold mt-2">总计: ${{ order.total }}</p></div></div></div></div></template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'
const route = useRoute()
const isLoading = ref(true)
const order = ref(null)
onMounted(async () => { try { order.value = await api.orders.get(route.params.orderNumber) } catch(e){} finally { isLoading.value = false } })
const statusText = computed(() => ({ PENDING: '待处理', CONFIRMED: '已确认', PROCESSING: '处理中', SHIPPED: '已发货', DELIVERED: '已送达', CANCELLED: '已取消' }[order.value?.status] || ''))
const statusClass = computed(() => ({ PENDING: 'bg-yellow-100 text-yellow-800', CONFIRMED: 'bg-blue-100 text-blue-800', SHIPPED: 'bg-purple-100 text-purple-800', DELIVERED: 'bg-green-100 text-green-800', CANCELLED: 'bg-gray-100 text-gray-800' }[order.value?.status] || 'bg-gray-100'))
</script>
