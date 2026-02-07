<template><div><h1 class="text-2xl font-serif font-bold mb-6">我的订单</h1><div v-if="isLoading" class="space-y-4"><div v-for="i in 3" :key="i" class="animate-pulse h-24 bg-gray-100"></div></div><div v-else-if="orders.length" class="space-y-4"><RouterLink v-for="order in orders" :key="order.id" :to="`/account/orders/${order.orderNumber}`" class="block p-4 border hover:border-dark transition-colors"><div class="flex justify-between items-start mb-2"><span class="font-medium">{{ order.orderNumber }}</span><span class="text-sm px-2 py-1" :class="statusClass(order.status)">{{ statusText(order.status) }}</span></div><p class="text-sm text-gray-500">{{ new Date(order.createdAt).toLocaleDateString() }} · {{ order.items.length }} 件商品 · ${{ order.total }}</p></RouterLink></div><div v-else class="text-center py-12"><p class="text-gray-500 mb-4">暂无订单</p><RouterLink to="/shop" class="btn btn-primary">去购物</RouterLink></div></div></template>
<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
const isLoading = ref(true)
const orders = ref([])
onMounted(async () => { try { const res = await api.orders.list(); orders.value = res.orders } catch(e){} finally { isLoading.value = false } })
const statusText = (s) => ({ PENDING: '待处理', CONFIRMED: '已确认', PROCESSING: '处理中', SHIPPED: '已发货', DELIVERED: '已送达', CANCELLED: '已取消' }[s] || s)
const statusClass = (s) => ({ PENDING: 'bg-yellow-100 text-yellow-800', CONFIRMED: 'bg-blue-100 text-blue-800', SHIPPED: 'bg-purple-100 text-purple-800', DELIVERED: 'bg-green-100 text-green-800', CANCELLED: 'bg-gray-100 text-gray-800' }[s] || 'bg-gray-100')
</script>
