<template><div class="container-custom py-12 text-center"><div class="max-w-md mx-auto"><CheckCircleIcon class="w-20 h-20 text-green-500 mx-auto mb-6" /><h1 class="text-3xl font-serif font-bold mb-2">订单已确认!</h1><p class="text-gray-500 mb-6">感谢您的购买，订单号: {{ route.params.orderNumber }}</p><p class="text-gray-600 mb-8">我们已发送确认邮件到您的邮箱，请注意查收。</p><div class="flex gap-4 justify-center"><RouterLink to="/account/orders" class="btn btn-primary">查看订单</RouterLink><RouterLink to="/shop" class="btn btn-outline">继续购物</RouterLink></div></div></div></template>
<script setup>
import { CheckCircleIcon } from '@heroicons/vue/24/solid'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
