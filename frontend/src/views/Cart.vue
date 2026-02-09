<template>
  <div class="container-custom py-8 sm:py-12">
    <h1 class="text-2xl sm:text-3xl font-serif font-bold mb-6 sm:mb-8">
      购物车
    </h1>

    <div v-if="cartStore.isEmpty" class="text-center py-16 sm:py-20">
      <ShoppingBagIcon
        class="w-16 sm:w-20 h-16 sm:h-20 text-gray-300 mx-auto mb-4"
      />
      <p class="text-gray-500 mb-6">购物车是空的</p>
      <RouterLink to="/shop" class="btn btn-primary">去购物</RouterLink>
    </div>

    <div v-else class="lg:flex gap-8 xl:gap-12">
      <!-- 购物车列表 -->
      <div class="flex-1">
        <!-- Desktop header -->
        <div
          class="border-b pb-4 mb-4 hidden md:grid grid-cols-12 gap-4 text-sm text-gray-500"
        >
          <div class="col-span-6">商品</div>
          <div class="col-span-2 text-center">单价</div>
          <div class="col-span-2 text-center">数量</div>
          <div class="col-span-2 text-right">小计</div>
        </div>

        <div class="space-y-4 sm:space-y-6">
          <div
            v-for="item in cartStore.items"
            :key="item.id"
            class="border-b pb-4 sm:pb-0"
          >
            <!-- Mobile layout -->
            <div class="flex gap-3 sm:hidden">
              <RouterLink
                :to="`/product/${item.product.slug}`"
                class="flex-shrink-0"
              >
                <img
                  :src="item.product.images?.[0]?.url || '/placeholder.jpg'"
                  :alt="item.product.name"
                  class="w-20 h-20 object-cover"
                />
              </RouterLink>
              <div class="flex-1 min-w-0">
                <RouterLink
                  :to="`/product/${item.product.slug}`"
                  class="font-medium text-sm hover:underline line-clamp-2"
                >
                  {{ item.product.name }}
                </RouterLink>
                <p v-if="item.variant" class="text-xs text-gray-500 mt-0.5">
                  {{ item.variant.size }} / {{ item.variant.color }}
                </p>
                <p class="text-accent-600 font-medium text-sm mt-1">
                  ${{
                    (
                      (item.variant?.price || item.product.basePrice) *
                      item.quantity
                    ).toFixed(2)
                  }}
                </p>
                <div class="flex items-center justify-between mt-2">
                  <div class="flex items-center border">
                    <button
                      @click="updateQty(item, -1)"
                      class="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-sm"
                    >
                      -
                    </button>
                    <span class="w-8 text-center text-sm">{{
                      item.quantity
                    }}</span>
                    <button
                      @click="updateQty(item, 1)"
                      class="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-sm"
                    >
                      +
                    </button>
                  </div>
                  <button
                    @click="cartStore.removeItem(item.id)"
                    class="text-xs text-red-500 hover:underline"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>

            <!-- Desktop layout -->
            <div class="hidden sm:grid grid-cols-12 gap-4 items-center py-4">
              <div class="col-span-6 flex gap-4">
                <RouterLink :to="`/product/${item.product.slug}`">
                  <img
                    :src="item.product.images?.[0]?.url || '/placeholder.jpg'"
                    :alt="item.product.name"
                    class="w-24 h-24 object-cover"
                  />
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
              <div class="col-span-2 text-center">
                ${{ item.variant?.price || item.product.basePrice }}
              </div>
              <div class="col-span-2 flex justify-center">
                <div class="flex items-center border">
                  <button
                    @click="updateQty(item, -1)"
                    class="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span class="w-10 text-center">{{ item.quantity }}</span>
                  <button
                    @click="updateQty(item, 1)"
                    class="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
              <div class="col-span-2 text-right font-medium">
                ${{
                  (
                    (item.variant?.price || item.product.basePrice) *
                    item.quantity
                  ).toFixed(2)
                }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 结算区 -->
      <div class="lg:w-80 mt-6 lg:mt-0">
        <div class="bg-gray-50 p-5 sm:p-6 rounded-lg sticky top-24">
          <h2 class="text-lg font-semibold mb-4">订单摘要</h2>

          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">商品小计</span>
              <span>${{ cartStore.subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">运费</span>
              <span>{{ cartStore.subtotal >= 100 ? "免费" : "$10.00" }}</span>
            </div>
          </div>

          <hr class="my-4" />

          <div class="flex justify-between text-lg font-semibold">
            <span>总计</span>
            <span
              >${{
                (
                  cartStore.subtotal + (cartStore.subtotal >= 100 ? 0 : 10)
                ).toFixed(2)
              }}</span
            >
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
import { ShoppingBagIcon } from "@heroicons/vue/24/outline";
import { useCartStore } from "@/stores/cart";

const cartStore = useCartStore();

const updateQty = (item, delta) => {
  const newQty = item.quantity + delta;
  if (newQty < 1) {
    cartStore.removeItem(item.id);
  } else {
    cartStore.updateQuantity(item.id, newQty);
  }
};
</script>
