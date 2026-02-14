<template>
  <div class="container-custom py-8 sm:py-12">
    <div v-if="cartStore.isEmpty && !isLoading" class="text-center py-20">
      <ShoppingBagIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">{{ t('checkout.emptyTitle') }}</h2>
      <p class="text-gray-500 mb-6">{{ t('checkout.emptyHint') }}</p>
      <RouterLink to="/shop" class="btn btn-primary">{{ t('cart.goShopping') }}</RouterLink>
    </div>

    <template v-else>
      <div v-if="createdOrder" class="max-w-lg mx-auto py-12">
        <h1 class="text-2xl font-serif font-bold mb-2">{{ t('checkout.completePayment') }}</h1>
        <p class="text-gray-500 mb-6">
          {{ t('checkout.orderNumberTotal', { number: createdOrder.orderNumber }) }}
          <span class="font-semibold text-dark"
            >${{ Number(createdOrder.total).toFixed(2) }}</span
          >
        </p>
        <div class="card">
          <StripePayment
            v-if="paymentMethod === 'stripe'"
            :order-id="createdOrder.id"
            :amount="createdOrder.total"
            @success="onPaymentSuccess"
            @error="onPaymentError"
          />
          <PayPalButton
            v-else
            :order-id="createdOrder.id"
            :amount="createdOrder.total"
            @success="onPaymentSuccess"
            @error="onPaymentError"
          />
        </div>
        <button
          type="button"
          class="btn btn-outline mt-4"
          @click="
            router.push('/order-success/' + createdOrder?.orderNumber);
            createdOrder = null;
          "
        >
          {{ t('checkout.payLater') }}
        </button>
      </div>

      <div v-else class="lg:flex gap-8 xl:gap-12">
        <div class="flex-1 space-y-6">
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold">{{ t('checkout.shippingAddress') }}</h2>
              <button
                @click="openAddressForm"
                class="text-sm text-blue-600 hover:underline"
              >
                {{ t('checkout.addAddress') }}
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
            <p v-else class="text-gray-500 py-4">{{ t('checkout.addAddressFirst') }}</p>
          </div>

          <div class="card">
            <h2 class="text-lg font-semibold mb-4">{{ t('checkout.paymentMethod') }}</h2>
            <div class="space-y-2">
              <label
                class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all"
                :class="
                  paymentMethod === 'stripe'
                    ? 'border-dark bg-gray-50 ring-2 ring-dark ring-opacity-20'
                    : 'border-gray-200 hover:border-gray-300'
                "
              >
                <input
                  v-model="paymentMethod"
                  type="radio"
                  name="payment"
                  value="stripe"
                  class="sr-only"
                />
                <svg
                  class="w-8 h-8 text-blue-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 4v8h16V8H4z"
                  />
                </svg>
                <div>
                  <p class="font-medium">{{ t('checkout.stripeTitle') }}</p>
                  <p class="text-sm text-gray-500">{{ t('checkout.stripeDesc') }}</p>
                </div>
              </label>
              <label
                class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all"
                :class="
                  paymentMethod === 'paypal'
                    ? 'border-dark bg-gray-50 ring-2 ring-dark ring-opacity-20'
                    : 'border-gray-200 hover:border-gray-300'
                "
              >
                <input
                  v-model="paymentMethod"
                  type="radio"
                  name="payment"
                  value="paypal"
                  class="sr-only"
                />
                <svg
                  class="w-8 h-8 text-[#003087] flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="#003087"
                >
                  <path
                    d="M7.076 21.337H2.47a.641.641 0 0 1-.641-.641V3.318c0-.354.287-.641.641-.641h4.606c3.504 0 5.805 1.302 6.932 3.711.859 1.831.963 4.259-.565 6.716-1.364 2.18-3.544 2.746-5.937 2.746h-1.313v2.649a.641.641 0 0 1-.641.641zm.641-4.268h1.313c1.882 0 3.464-.548 4.597-1.727 1.152-1.2 1.385-2.994.77-4.507-.732-1.806-2.436-2.54-4.597-2.54H7.717v8.774zm12.247-9.809c-.131-.261-.524-.641-1.383-.641h-4.12v12.5h2.907v-5.136h1.313c1.201 0 2.18-.333 2.907-1.005.73-.673 1.092-1.612 1.092-2.816 0-1.204-.363-2.143-1.092-2.816-.727-.672-1.706-1.005-2.907-1.005h-1.313V7.336h2.907c.524 0 .916.131 1.201.393.284.261.524.719.655 1.179l1.774 6.393h3.023l-1.969-7.179z"
                  />
                </svg>
                <div>
                  <p class="font-medium">PayPal</p>
                  <p class="text-sm text-gray-500">{{ t('checkout.paypalDesc') }}</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Right: Order Summary -->
        <div class="lg:w-96 mt-6 lg:mt-0">
          <div class="bg-gray-50 p-5 sm:p-6 rounded-lg sticky top-24">
            <h2 class="text-lg font-semibold mb-4">{{ t('cart.orderSummary') }}</h2>

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
                <span>{{ t('cart.subtotal') }}</span>
                <span>${{ cartStore.subtotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span>{{ t('cart.shipping') }}</span>
                <span>{{
                  shippingFee === 0 ? t('cart.free') : `$${shippingFee.toFixed(2)}`
                }}</span>
              </div>
            </div>

            <hr class="my-4" />

            <div class="flex justify-between text-lg font-semibold">
              <span>{{ t('cart.total') }}</span>
              <span>${{ totalAmount.toFixed(2) }}</span>
            </div>

            <!-- Points Preview -->
            <div v-if="pointsPreview.points > 0" class="mt-4 p-3 bg-orange-50 rounded-lg">
              <div class="flex items-center gap-2 text-sm">
                <svg class="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span class="text-orange-700">
                  {{ t('points.earnOnOrder', { points: pointsPreview.points }) }}
                </span>
                <span v-if="pointsPreview.isBirthday" class="px-1.5 py-0.5 bg-orange-200 text-orange-800 text-xs rounded-full">
                  {{ t('points.birthdayDouble') }}
                </span>
              </div>
            </div>

            <button
              @click="confirmOrder"
              class="w-full btn btn-primary mt-6"
              :disabled="!selectedAddress || isLoading"
            >
              {{ isLoading ? t('checkout.placing') : t('checkout.placeOrder') }}
            </button>

            <p class="text-xs text-gray-500 text-center mt-3">
              {{ t('checkout.agreeTermsHint') }}
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
                <DialogTitle class="text-lg font-semibold mb-4">
                  {{ t('checkout.addAddressTitle') }}
                </DialogTitle>

                <form @submit.prevent="handleAddAddress" class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-1">{{ t('checkout.lastName') }} *</label>
                      <input
                        v-model="addrForm.lastName"
                        type="text"
                        class="input"
                        required
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1">{{ t('checkout.firstName') }} *</label>
                      <input
                        v-model="addrForm.firstName"
                        type="text"
                        class="input"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">{{ t('checkout.phone') }} *</label>
                    <input
                      v-model="addrForm.phone"
                      type="tel"
                      class="input"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">{{ t('checkout.street') }} *</label>
                    <input
                      v-model="addrForm.street"
                      type="text"
                      class="input"
                      required
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-1">{{ t('checkout.city') }} *</label>
                      <input
                        v-model="addrForm.city"
                        type="text"
                        class="input"
                        required
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1">{{ t('checkout.state') }} *</label>
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
                      <label class="block text-sm font-medium mb-1">{{ t('checkout.country') }} *</label>
                      <input
                        v-model="addrForm.country"
                        type="text"
                        class="input"
                        required
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1">{{ t('checkout.postalCode') }} *</label>
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
                    <span class="text-sm">{{ t('checkout.setDefaultAddress') }}</span>
                  </label>
                  <div class="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      @click="showAddressModal = false"
                      class="btn btn-outline"
                    >
                      {{ t('common.cancel') }}
                    </button>
                    <button
                      type="submit"
                      class="btn btn-primary"
                      :disabled="isSavingAddr"
                    >
                      {{ isSavingAddr ? t('common.loading') : t('common.save') }}
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
      <Dialog as="div" class="relative z-50" @close="closeConfirmDialog">
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
                <template v-if="!createdOrderInDialog">
                  <DialogTitle class="text-lg font-semibold mb-3">
                    {{ t('checkout.confirmOrderTitle') }}
                  </DialogTitle>
                  <p class="text-gray-600 mb-6">
                    {{ t('checkout.youWillPay') }}
                    <span class="font-bold text-dark">{{ totalAmount.toFixed(2) }}</span>
                    {{ t('checkout.confirmOrderQuestion') }}
                  </p>
                  <div class="flex justify-end gap-3">
                    <button
                      @click="showConfirmDialog = false"
                      class="btn btn-outline"
                      :disabled="isLoading"
                    >
                      {{ t('common.cancel') }}
                    </button>
                    <button
                      @click="placeOrderThenPayInDialog"
                      class="btn btn-primary"
                      :disabled="isLoading"
                    >
                      {{ isLoading ? t('checkout.creatingOrder') : t('common.confirm') }}
                    </button>
                  </div>
                </template>

                <template v-else>
                  <DialogTitle class="text-lg font-semibold mb-2">
                    {{ t('payment.pleaseComplete') }}
                  </DialogTitle>
                  <p class="text-sm text-gray-500 mb-4">
                    {{ t('payment.orderNumberAmount', { number: createdOrderInDialog.orderNumber }) }}
                    <span class="font-semibold text-dark"
                      >${{ Number(createdOrderInDialog.total).toFixed(2) }}</span
                    >
                  </p>
                  <div class="min-h-[120px]">
                    <StripePayment
                      v-if="paymentMethod === 'stripe'"
                      :key="'stripe-' + createdOrderInDialog.id"
                      :order-id="createdOrderInDialog.id"
                      :amount="createdOrderInDialog.total"
                      @success="onPaymentSuccessInDialog"
                      @error="onPaymentError"
                    />
                    <PayPalButton
                      v-else
                      :key="'paypal-' + createdOrderInDialog.id"
                      :order-id="createdOrderInDialog.id"
                      :amount="createdOrderInDialog.total"
                      @success="onPaymentSuccessInDialog"
                      @error="onPaymentError"
                    />
                  </div>
                  <button
                    type="button"
                    class="btn btn-outline w-full mt-4"
                    @click="closeDialogAndGoPayLater"
                  >
                    {{ t('checkout.payLater') }}
                  </button>
                </template>
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
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useCartStore } from "@/stores/cart";

const { t } = useI18n();
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { ShoppingBagIcon } from "@heroicons/vue/24/outline";
import api from "@/api";
import StripePayment from "@/components/payment/StripePayment.vue";
import PayPalButton from "@/components/payment/PayPalButton.vue";

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
  country: "",
  postalCode: "",
  isDefault: false,
});

const shippingFee = computed(() => {
  return cartStore.subtotal >= 100 ? 0 : 10;
});

const totalAmount = computed(() => {
  return cartStore.subtotal + shippingFee.value;
});

// Points preview
const pointsPreview = ref({ points: 0, isBirthday: false, multiplier: 1 });

const loadPointsPreview = async () => {
  try {
    const data = await api.points.calculate(totalAmount.value);
    pointsPreview.value = data;
  } catch (error) {
    console.error('Failed to load points preview:', error);
  }
};

const openAddressForm = () => {
  Object.assign(addrForm, {
    firstName: "",
    lastName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: t("checkout.defaultCountry"),
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
    toast.success(t("checkout.addressAdded"));
  } catch (e) {
    toast.error(e.message);
  } finally {
    isSavingAddr.value = false;
  }
};

const handleImageError = (e) => {
  e.target.src = "/placeholder.jpg";
};

const paymentMethod = ref("paypal");
const createdOrder = ref(null);
/** 弹窗内创建好的订单，用于在弹窗里直接展示支付 */
const createdOrderInDialog = ref(null);

const confirmOrder = () => {
  if (!selectedAddress.value) {
    toast.warning(t("checkout.selectAddressFirst"));
    return;
  }
  createdOrderInDialog.value = null;
  showConfirmDialog.value = true;
};

/** 弹窗内点击「确认」：创建订单后不关弹窗，直接在弹窗内展示支付 */
const placeOrderThenPayInDialog = async () => {
  isLoading.value = true;
  try {
    const res = await api.orders.create({ addressId: selectedAddress.value });
    cartStore.clearLocal();
    createdOrderInDialog.value = res.order;
    toast.success(t("checkout.orderCreatedPayNow"));
  } catch (e) {
    toast.error(e.message);
  } finally {
    isLoading.value = false;
  }
};

const onPaymentSuccessInDialog = (res) => {
  const orderNumber = res?.orderNumber;
  toast.success(res?.message || t("checkout.paySuccess"));
  showConfirmDialog.value = false;
  createdOrderInDialog.value = null;
  if (orderNumber) router.push(`/order-success/${orderNumber}`);
};

const closeDialogAndGoPayLater = () => {
  const orderNumber = createdOrderInDialog.value?.orderNumber;
  showConfirmDialog.value = false;
  createdOrderInDialog.value = null;
  if (orderNumber) router.push(`/order-success/${orderNumber}`);
};

/** 关闭弹窗（点击遮罩或 Esc）：若已创建订单则跳转订单成功页 */
const closeConfirmDialog = () => {
  if (createdOrderInDialog.value) {
    router.push(`/order-success/${createdOrderInDialog.value.orderNumber}`);
    createdOrderInDialog.value = null;
  }
  showConfirmDialog.value = false;
};

const onPaymentSuccess = (res) => {
  toast.success(res?.message || t("checkout.paySuccess"));
  router.push(
    `/order-success/${res?.orderNumber || createdOrder.value?.orderNumber}`
  );
};

const onPaymentError = (err) => {
  toast.error(err?.message || t("checkout.payFailedRetry"));
};

onMounted(async () => {
  isLoadingAddresses.value = true;
  try {
    addresses.value = await api.users.addresses();
    if (addresses.value.length) {
      selectedAddress.value =
        addresses.value.find((a) => a.isDefault)?.id || addresses.value[0].id;
    }
    // Load points preview
    await loadPointsPreview();
  } catch (e) {
    toast.error(t("checkout.loadAddressFailed") + ": " + e.message);
  } finally {
    isLoadingAddresses.value = false;
  }
});
</script>
