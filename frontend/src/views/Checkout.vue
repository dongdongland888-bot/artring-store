<template>
  <div class="container-custom py-8 sm:py-12">
    <!-- Empty cart redirect -->
    <div v-if="cartStore.isEmpty && !isLoading" class="text-center py-20">
      <ShoppingBagIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">购物车是空的</h2>
      <p class="text-gray-500 mb-6">添加商品后再来结算吧</p>
      <RouterLink to="/shop" class="btn btn-primary">去购物</RouterLink>
    </div>

    <template v-else>
      <h1 class="text-2xl sm:text-3xl font-serif font-bold mb-6 sm:mb-8">
        结算
      </h1>

      <div class="lg:flex gap-8 xl:gap-12">
        <!-- Left -->
        <div class="flex-1 space-y-6">
          <!-- Shipping Address -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">收货地址</h2>
              <button
                @click="openAddressForm"
                class="text-sm text-blue-600 hover:underline"
              >
                + 添加新地址
              </button>
            </div>

            <div v-if="isLoadingAddresses" class="text-center py-8">
              <div
                class="w-6 h-6 border-2 border-gray-300 border-t-dark rounded-full animate-spin mx-auto"
              ></div>
            </div>

            <div v-else-if="addresses.length" class="space-y-2">
              <div
                v-for="addr in addresses"
                :key="addr.id"
                class="p-3 sm:p-4 border rounded-lg cursor-pointer transition-all hover:border-dark"
                :class="
                  selectedAddress === addr.id
                    ? 'border-dark bg-gray-50 ring-2 ring-dark ring-opacity-20'
                    : 'border-gray-200'
                "
                @click="selectedAddress = addr.id"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="font-medium text-sm sm:text-base">
                      {{ addr.firstName }} {{ addr.lastName }}
                    </p>
                    <p class="text-sm text-gray-600 mt-1">
                      {{ addr.street }}, {{ addr.city }}, {{ addr.state }}
                      {{ addr.postalCode }}
                    </p>
                    <p class="text-sm text-gray-600">{{ addr.phone }}</p>
                  </div>
                  <div
                    v-if="selectedAddress === addr.id"
                    class="flex-shrink-0 w-5 h-5 bg-dark rounded-full flex items-center justify-center ml-3"
                  >
                    <svg
                      class="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-gray-500 py-4">请先添加收货地址</p>
          </div>

          <!-- Payment -->
          <div class="card">
            <h2 class="text-lg font-semibold mb-4">支付方式</h2>
            <div class="flex items-center gap-3 p-4 border rounded-lg">
              <svg
                class="w-8 h-8 text-blue-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 4v8h16V8H4z"
                />
              </svg>
              <div>
                <p class="font-medium">Stripe 安全支付</p>
                <p class="text-sm text-gray-500">支持信用卡/借记卡</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Order Summary -->
        <div class="lg:w-96 mt-6 lg:mt-0">
          <div class="bg-gray-50 p-5 sm:p-6 rounded-lg sticky top-24">
            <h2 class="text-lg font-semibold mb-4">订单摘要</h2>

            <div class="space-y-3 mb-4 max-h-64 overflow-y-auto">
              <div
                v-for="item in cartStore.items"
                :key="item.id"
                class="flex gap-3"
              >
                <img
                  :src="item.product.images?.[0]?.url"
                  class="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
                  @error="handleImageError"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">
                    {{ item.product.name }}
                  </p>
                  <p class="text-xs text-gray-500">x{{ item.quantity }}</p>
                  <p v-if="item.variant" class="text-xs text-gray-500">
                    {{ item.variant.size }} / {{ item.variant.color }}
                  </p>
                </div>
                <p class="text-sm font-medium flex-shrink-0">
                  ${{
                    (
                      (item.variant?.price || item.product.basePrice) *
                      item.quantity
                    ).toFixed(2)
                  }}
                </p>
              </div>
            </div>

            <hr class="my-4" />

            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>小计</span>
                <span>${{ cartStore.subtotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span>运费</span>
                <span>{{
                  shippingFee === 0 ? "免费" : `$${shippingFee.toFixed(2)}`
                }}</span>
              </div>
            </div>

            <hr class="my-4" />

            <div class="flex justify-between text-lg font-semibold">
              <span>总计</span>
              <span>${{ totalAmount.toFixed(2) }}</span>
            </div>

            <button
              @click="confirmOrder"
              class="w-full btn btn-primary mt-6"
              :disabled="!selectedAddress || isLoading"
            >
              {{ isLoading ? "处理中..." : "确认下单" }}
            </button>

            <p class="text-xs text-gray-500 text-center mt-3">
              点击"确认下单"即表示您同意我们的服务条款
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Add Address Modal -->
    <TransitionRoot :show="showAddressModal" as="template">
      <Dialog as="div" class="relative z-50" @close="showAddressModal = false">
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

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel
                class="w-full max-w-lg bg-white shadow-xl p-6 rounded-lg"
              >
                <DialogTitle class="text-lg font-semibold mb-4"
                  >添加新地址</DialogTitle
                >

                <form @submit.prevent="handleAddAddress" class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-1">姓 *</label>
                      <input
                        v-model="addrForm.lastName"
                        type="text"
                        class="input"
                        required
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1">名 *</label>
                      <input
                        v-model="addrForm.firstName"
                        type="text"
                        class="input"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">电话 *</label>
                    <input
                      v-model="addrForm.phone"
                      type="tel"
                      class="input"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1"
                      >街道地址 *</label
                    >
                    <input
                      v-model="addrForm.street"
                      type="text"
                      class="input"
                      required
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-1"
                        >城市 *</label
                      >
                      <input
                        v-model="addrForm.city"
                        type="text"
                        class="input"
                        required
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1"
                        >省/州 *</label
                      >
                      <input
                        v-model="addrForm.state"
                        type="text"
                        class="input"
                        required
                      />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-1"
                        >国家 *</label
                      >
                      <input
                        v-model="addrForm.country"
                        type="text"
                        class="input"
                        required
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1"
                        >邮编 *</label
                      >
                      <input
                        v-model="addrForm.postalCode"
                        type="text"
                        class="input"
                        required
                      />
                    </div>
                  </div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      v-model="addrForm.isDefault"
                      type="checkbox"
                      class="rounded"
                    />
                    <span class="text-sm">设为默认地址</span>
                  </label>
                  <div class="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      @click="showAddressModal = false"
                      class="btn btn-outline"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      class="btn btn-primary"
                      :disabled="isSavingAddr"
                    >
                      {{ isSavingAddr ? "保存中..." : "保存" }}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Order Confirmation Dialog -->
    <TransitionRoot :show="showConfirmDialog" as="template">
      <Dialog as="div" class="relative z-50" @close="showConfirmDialog = false">
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

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel
                class="w-full max-w-md bg-white shadow-xl p-6 rounded-lg"
              >
                <DialogTitle class="text-lg font-semibold mb-3"
                  >确认订单</DialogTitle
                >
                <p class="text-gray-600 mb-6">
                  您将支付
                  <span class="font-bold text-dark"
                    >${{ totalAmount.toFixed(2) }}</span
                  >，确认下单吗？
                </p>
                <div class="flex justify-end gap-3">
                  <button
                    @click="showConfirmDialog = false"
                    class="btn btn-outline"
                    :disabled="isLoading"
                  >
                    取消
                  </button>
                  <button
                    @click="placeOrder"
                    class="btn btn-primary"
                    :disabled="isLoading"
                  >
                    {{ isLoading ? "处理中..." : "确认" }}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useCartStore } from "@/stores/cart";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { ShoppingBagIcon } from "@heroicons/vue/24/outline";
import api from "@/api";

const router = useRouter();
const toast = useToast();
const cartStore = useCartStore();
const addresses = ref([]);
const selectedAddress = ref(null);
const isLoading = ref(false);
const isLoadingAddresses = ref(false);
const showConfirmDialog = ref(false);

// Address form
const showAddressModal = ref(false);
const isSavingAddr = ref(false);
const addrForm = reactive({
  firstName: "",
  lastName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  country: "中国",
  postalCode: "",
  isDefault: false,
});

const shippingFee = computed(() => {
  return cartStore.subtotal >= 100 ? 0 : 10;
});

const totalAmount = computed(() => {
  return cartStore.subtotal + shippingFee.value;
});

const openAddressForm = () => {
  Object.assign(addrForm, {
    firstName: "",
    lastName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "中国",
    postalCode: "",
    isDefault: false,
  });
  showAddressModal.value = true;
};

const handleAddAddress = async () => {
  isSavingAddr.value = true;
  try {
    const res = await api.users.addAddress({ ...addrForm });
    addresses.value.push(res.address);
    selectedAddress.value = res.address.id;
    showAddressModal.value = false;
    toast.success("地址已添加");
  } catch (e) {
    toast.error(e.message);
  } finally {
    isSavingAddr.value = false;
  }
};

const handleImageError = (e) => {
  e.target.src = "/placeholder.jpg";
};

const confirmOrder = () => {
  if (!selectedAddress.value) {
    toast.warning("请选择收货地址");
    return;
  }
  showConfirmDialog.value = true;
};

const placeOrder = async () => {
  isLoading.value = true;
  try {
    const res = await api.orders.create({ addressId: selectedAddress.value });
    cartStore.clearLocal();
    showConfirmDialog.value = false;
    toast.success("订单已提交");
    router.push(`/order-success/${res.order.orderNumber}`);
  } catch (e) {
    toast.error(e.message);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  isLoadingAddresses.value = true;
  try {
    addresses.value = await api.users.addresses();
    if (addresses.value.length) {
      selectedAddress.value =
        addresses.value.find((a) => a.isDefault)?.id || addresses.value[0].id;
    }
  } catch (e) {
    toast.error("加载地址失败: " + e.message);
  } finally {
    isLoadingAddresses.value = false;
  }
});
</script>
