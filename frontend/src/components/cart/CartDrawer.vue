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
          <div
            class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10"
          >
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
                  <div
                    class="flex items-center justify-between px-6 py-4 border-b"
                  >
                    <DialogTitle class="text-lg font-semibold">
                      {{ t('cart.cartCount', { count: cartStore.itemCount }) }}
                    </DialogTitle>
                    <button
                      @click="cartStore.closeCart()"
                      class="p-2 hover:bg-gray-100 rounded-full"
                      :aria-label="t('cart.closeAria')"
                    >
                      <XMarkIcon class="w-6 h-6" />
                    </button>
                  </div>

                  <!-- 加载状态 -->
                  <div
                    v-if="cartStore.isLoading && cartStore.isEmpty"
                    class="flex-1 flex items-center justify-center"
                  >
                    <div class="text-center">
                      <div
                        class="w-8 h-8 border-2 border-gray-300 border-t-dark rounded-full animate-spin mx-auto mb-3"
                      ></div>
                      <p class="text-sm text-gray-500">{{ t('common.loading') }}</p>
                    </div>
                  </div>

                  <!-- 购物车空 -->
                  <div
                    v-else-if="cartStore.isEmpty"
                    class="flex-1 flex flex-col items-center justify-center p-8"
                  >
                    <ShoppingBagIcon class="w-16 h-16 text-gray-300 mb-4" />
                    <p class="text-gray-500 mb-6">{{ t('cart.empty') }}</p>
                    <RouterLink
                      to="/shop"
                      class="btn btn-primary"
                      @click="cartStore.closeCart()"
                    >
                      {{ t('cart.goShopping') }}
                    </RouterLink>
                  </div>

                  <!-- 购物车内容 -->
                  <div v-else class="flex-1 overflow-y-auto py-4">
                    <ul class="divide-y">
                      <li
                        v-for="item in cartStore.items"
                        :key="item.id"
                        class="flex gap-4 px-6 py-4 transition-opacity"
                        :class="{ 'opacity-50': updatingItems.has(item.id) }"
                      >
                        <!-- 商品图片 -->
                        <RouterLink
                          :to="`/product/${item.product.slug}`"
                          @click="cartStore.closeCart()"
                          class="flex-shrink-0"
                        >
                          <img
                            :src="
                              item.product.images?.[0]?.url ||
                              '/placeholder.jpg'
                            "
                            :alt="item.product.name"
                            class="w-20 h-20 object-cover rounded"
                            @error="handleImageError"
                          />
                        </RouterLink>

                        <!-- 商品信息 -->
                        <div class="flex-1 min-w-0">
                          <RouterLink
                            :to="`/product/${item.product.slug}`"
                            class="font-medium hover:underline line-clamp-2 text-sm"
                            @click="cartStore.closeCart()"
                          >
                            {{ item.product.name }}
                          </RouterLink>
                          <p
                            v-if="item.variant"
                            class="text-xs text-gray-500 mt-0.5"
                          >
                            {{ item.variant.size }} / {{ item.variant.color }}
                          </p>
                          <p class="text-accent-600 font-medium mt-1 text-sm">
                            ${{
                              (
                                parseFloat(
                                  item.variant?.price || item.product.basePrice
                                ) * item.quantity
                              ).toFixed(2)
                            }}
                          </p>

                          <!-- 数量控制 -->
                          <div class="flex items-center gap-2 mt-2">
                            <button
                              @click="updateQty(item, -1)"
                              class="w-7 h-7 flex items-center justify-center border rounded hover:bg-gray-50 transition-colors"
                              :disabled="
                                updatingItems.has(item.id) || item.quantity <= 1
                              "
                              :aria-label="t('cart.decreaseQty')"
                            >
                              <MinusIcon class="w-3 h-3" />
                            </button>
                            <span class="w-7 text-center text-sm font-medium">{{
                              item.quantity
                            }}</span>
                            <button
                              @click="updateQty(item, 1)"
                              class="w-7 h-7 flex items-center justify-center border rounded hover:bg-gray-50 transition-colors"
                              :disabled="updatingItems.has(item.id)"
                              :aria-label="t('cart.increaseQty')"
                            >
                              <PlusIcon class="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <!-- 删除按钮 -->
                        <button
                          @click="removeItem(item)"
                          class="self-start p-1.5 hover:bg-red-50 rounded transition-colors group"
                          :disabled="updatingItems.has(item.id)"
                          :aria-label="t('cart.removeItem')"
                        >
                          <TrashIcon
                            class="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors"
                          />
                        </button>
                      </li>
                    </ul>
                  </div>

                  <!-- 底部结算 -->
                  <div
                    v-if="!cartStore.isEmpty"
                    class="border-t px-6 py-5 space-y-4"
                  >
                    <div class="flex justify-between items-baseline">
                      <span class="text-base font-semibold">{{ t('cart.subtotal') }}</span>
                      <span class="text-lg font-bold"
                        >${{ cartStore.subtotal.toFixed(2) }}</span
                      >
                    </div>
                    <p class="text-xs text-gray-500">{{ t('cart.shippingAtCheckout') }}</p>
                    <RouterLink
                      to="/checkout"
                      class="block w-full btn btn-primary text-center"
                      @click="cartStore.closeCart()"
                    >
                      {{ t('cart.checkout') }}
                    </RouterLink>
                    <RouterLink
                      to="/cart"
                      class="block w-full btn btn-outline text-center"
                      @click="cartStore.closeCart()"
                    >
                      {{ t('cart.viewCart') }}
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
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import {
  XMarkIcon,
  ShoppingBagIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
import { useCartStore } from "@/stores/cart";
import { useBodyScrollLock } from "@/composables/useBodyScrollLock";

const { t } = useI18n();
const cartStore = useCartStore();
const updatingItems = ref(new Set());

// Lock body scroll when drawer is open
useBodyScrollLock(computed(() => cartStore.isOpen));

const updateQty = async (item, delta) => {
  const newQty = item.quantity + delta;
  if (newQty < 1) return;

  updatingItems.value.add(item.id);
  try {
    await cartStore.updateQuantity(item.id, newQty);
  } finally {
    updatingItems.value.delete(item.id);
  }
};

const removeItem = async (item) => {
  updatingItems.value.add(item.id);
  try {
    await cartStore.removeItem(item.id);
  } finally {
    updatingItems.value.delete(item.id);
  }
};

const handleImageError = (e) => {
  e.target.src = "/placeholder.jpg";
};
</script>
