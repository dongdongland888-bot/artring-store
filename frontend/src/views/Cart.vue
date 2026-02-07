<template>
  <div class="container-custom py-12">
    <h1 class="text-3xl font-serif font-bold mb-8">购物车</h1>

    <div v-if="cartStore.isEmpty" class="text-center py-20">
      <ShoppingBagIcon class="w-20 h-20 text-gray-300 mx-auto mb-4" />
      <p class="text-gray-500 mb-6">购物车是空的</p>
      <RouterLink to="/shop" class="btn btn-primary">去购物</RouterLink>
    </div>

    <div v-else class="lg:flex gap-12">
      <!-- 购物车列表 -->
      <div class="flex-1">
        <div class="border-b pb-4 mb-4 hidden md:grid grid-cols-12 gap-4 text-sm text-gray-500">
          <div class="col-span-6">商品</div>
          <div class="col-span-2 text-center">单价</div>
          <div class="col-span-2 text-center">数量</div>
          <div class="col-span-2 text-right">小计</div>
        </div>

        <div class="space-y-6">
          <div 
            v-for="item in cartStore.items" 
            :key="item.id"
            class="grid grid-cols-12 gap-4 items-center py-4 border-b"
          >
            <!-- 商品信息 -->
            <div class="col-span-12 md:col-span-6 flex gap-4">
              <RouterLink :to="`/product/${item.product.slug}`">
                <img 
                  :src="item.product.images?.[0]?.url || '/placeholder.jpg'"
                  :alt="item.product.name"
                  class="w-24 h-24 object-cover"
                >
              </RouterLink>
              <div>
                <RouterLink 
                  :to="`/product/${item.product.slug}`"
                  class="font-medium hover:underline"
                >
                  {{ item.product.name }}
                </RouterLink>
                <p v-if="item.variant" class="text-sm text-gray-500 mt-1">
                  {{ item.variant.size }} / {{ item.variant.color }}
                </p>
                <button 
                  @click="cartStore.removeItem(item.id)"
                  class="text-sm text-red-500 hover:underline mt-2"
                >
                  删除
                </button>
              </div>
            </div>

            <!-- 单价 -->
            <div class="col-span-4 md:col-span-2 text-center">
              ${{ item.variant?.price || item.product.basePrice }}
            </div>

            <!-- 数量 -->
            <div class="col-span-4 md:col-span-2 flex justify-center">
              <div class="flex items-center border">
                <button 
                  @click="updateQty(item, -1)"
                  class="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
                >-</button>
                <span class="w-10 text-center">{{ item.quantity }}</span>
                <button 
                  @click="updateQty(item, 1)"
                  class="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
                >+</button>
              </div>
            </div>

            <!-- 小计 -->
            <div class="col-span-4 md:col-span-2 text-right font-medium">
              ${{ ((item.variant?.price || item.product.basePrice) * item.quantity).toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 结算区 -->
      <div class="lg:w-80 mt-8 lg:mt-0">
        <div class="bg-gray-50 p-6">
          <h2 class="text-lg font-semibold mb-4">订单摘要</h2>
          
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">商品小计</span>
              <span>${{ cartStore.subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">运费</span>
              <span>{{ cartStore.subtotal >= 100 ? '免费' : '$10.00' }}</span>
            </div>
          </div>

          <hr class="my-4">

          <div class="flex justify-between text-lg font-semibold">
            <span>总计</span>
            <span>${{ (cartStore.subtotal + (cartStore.subtotal >= 100 ? 0 : 10)).toFixed(2) }}</span>
          </div>

          <RouterLink 
            to="/checkout" 
            class="block w-full btn btn-primary text-center mt-6"
          >
            结算
          </RouterLink>

          <RouterLink 
            to="/shop" 
            class="block w-full text-center text-sm text-gray-500 hover:underline mt-4"
          >
            继续购物
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ShoppingBagIcon } from '@heroicons/vue/24/outline'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

const updateQty = (item, delta) => {
  const newQty = item.quantity + delta
  if (newQty < 1) {
    cartStore.removeItem(item.id)
  } else {
    cartStore.updateQuantity(item.id, newQty)
  }
}
</script>
