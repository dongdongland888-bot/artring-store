<template>
  <TransitionRoot :show="cartStore.isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="cartStore.closeCart()">
      <!-- 背景遮罩 -->
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50" />
      </TransitionChild>

      <!-- 侧边栏 -->
      <div class="fixed inset-0 overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <TransitionChild
              as="template"
              enter="transform transition ease-in-out duration-300"
              enter-from="translate-x-full"
              enter-to="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leave-from="translate-x-0"
              leave-to="translate-x-full"
            >
              <DialogPanel class="pointer-events-auto w-screen max-w-md">
                <div class="flex h-full flex-col bg-white shadow-xl">
                  <!-- 头部 -->
                  <div class="flex items-center justify-between px-6 py-4 border-b">
                    <DialogTitle class="text-lg font-semibold">
                      购物车 ({{ cartStore.itemCount }})
                    </DialogTitle>
                    <button 
                      @click="cartStore.closeCart()"
                      class="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <XMarkIcon class="w-6 h-6" />
                    </button>
                  </div>

                  <!-- 购物车内容 -->
                  <div v-if="cartStore.isEmpty" class="flex-1 flex flex-col items-center justify-center p-8">
                    <ShoppingBagIcon class="w-16 h-16 text-gray-300 mb-4" />
                    <p class="text-gray-500 mb-6">购物车是空的</p>
                    <RouterLink 
                      to="/shop" 
                      class="btn btn-primary"
                      @click="cartStore.closeCart()"
                    >
                      去购物
                    </RouterLink>
                  </div>

                  <div v-else class="flex-1 overflow-y-auto py-6">
                    <ul class="divide-y">
                      <li 
                        v-for="item in cartStore.items" 
                        :key="item.id"
                        class="flex gap-4 px-6 py-4"
                      >
                        <!-- 商品图片 -->
                        <RouterLink 
                          :to="`/product/${item.product.slug}`"
                          @click="cartStore.closeCart()"
                        >
                          <img 
                            :src="item.product.images?.[0]?.url || '/placeholder.jpg'"
                            :alt="item.product.name"
                            class="w-20 h-20 object-cover"
                          >
                        </RouterLink>

                        <!-- 商品信息 -->
                        <div class="flex-1 min-w-0">
                          <RouterLink 
                            :to="`/product/${item.product.slug}`"
                            class="font-medium hover:underline line-clamp-2"
                            @click="cartStore.closeCart()"
                          >
                            {{ item.product.name }}
                          </RouterLink>
                          <p v-if="item.variant" class="text-sm text-gray-500 mt-1">
                            {{ item.variant.size }} / {{ item.variant.color }}
                          </p>
                          <p class="text-accent-500 font-medium mt-1">
                            ${{ item.variant?.price || item.product.basePrice }}
                          </p>

                          <!-- 数量控制 -->
                          <div class="flex items-center gap-2 mt-2">
                            <button 
                              @click="updateQty(item, -1)"
                              class="w-8 h-8 flex items-center justify-center border hover:bg-gray-50"
                              :disabled="item.quantity <= 1"
                            >
                              <MinusIcon class="w-4 h-4" />
                            </button>
                            <span class="w-8 text-center">{{ item.quantity }}</span>
                            <button 
                              @click="updateQty(item, 1)"
                              class="w-8 h-8 flex items-center justify-center border hover:bg-gray-50"
                            >
                              <PlusIcon class="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <!-- 删除按钮 -->
                        <button 
                          @click="cartStore.removeItem(item.id)"
                          class="self-start p-1 hover:bg-gray-100 rounded"
                        >
                          <TrashIcon class="w-5 h-5 text-gray-400" />
                        </button>
                      </li>
                    </ul>
                  </div>

                  <!-- 底部结算 -->
                  <div v-if="!cartStore.isEmpty" class="border-t px-6 py-6 space-y-4">
                    <div class="flex justify-between text-lg font-semibold">
                      <span>小计</span>
                      <span>${{ cartStore.subtotal.toFixed(2) }}</span>
                    </div>
                    <p class="text-sm text-gray-500">运费将在结算时计算</p>
                    <RouterLink 
                      to="/checkout" 
                      class="block w-full btn btn-primary text-center"
                      @click="cartStore.closeCart()"
                    >
                      结算
                    </RouterLink>
                    <RouterLink 
                      to="/cart" 
                      class="block w-full btn btn-outline text-center"
                      @click="cartStore.closeCart()"
                    >
                      查看购物车
                    </RouterLink>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { 
  XMarkIcon, 
  ShoppingBagIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

const updateQty = (item, delta) => {
  cartStore.updateQuantity(item.id, item.quantity + delta)
}
</script>
