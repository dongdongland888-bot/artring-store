<template>
  <div>
    <h1 class="text-2xl font-serif font-bold mb-6">{{ t('account.orderDetail') }}</h1>

    <div v-if="isLoading" class="animate-pulse space-y-4">
      <div class="h-8 bg-gray-200 w-1/2"></div>
      <div class="h-40 bg-gray-200"></div>
    </div>

    <div v-else-if="order">
      <div class="mb-6">
        <p class="text-gray-500">{{ t('account.orderNumber') }}: {{ order.orderNumber }}</p>
        <p class="text-gray-500">
          {{ t('account.orderTime') }}: {{ new Date(order.createdAt).toLocaleString() }}
        </p>
        <p class="mt-2 flex items-center gap-3">
          <span class="px-2 py-1 text-sm" :class="statusClass">
            {{ statusText }}
          </span>
          <span
            v-if="order.paymentStatus === 'UNPAID'"
            class="text-xs px-2 py-1 rounded bg-red-50 text-red-600"
          >
            {{ t('account.unpaid') }}
          </span>
          <span
            v-else
            class="text-xs px-2 py-1 rounded bg-green-50 text-green-600"
          >
            {{ t('account.paid') }}
          </span>
        </p>
      </div>

      <div class="border p-4 mb-6">
        <h2 class="font-semibold mb-3">{{ t('account.orderItems') }}</h2>
        <div
          v-for="item in order.items"
          :key="item.id"
          class="flex gap-4 py-3 border-b last:border-0"
        >
          <img
            :src="item.product?.images?.[0]?.url"
            class="w-16 h-16 object-cover"
            alt=""
          />
          <div class="flex-1">
            <p class="font-medium">{{ item.productName }}</p>
            <p class="text-sm text-gray-500">
              {{ item.variantInfo }} x{{ item.quantity }}
            </p>
          </div>
          <p class="font-medium">${{ item.total }}</p>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="border p-4">
          <h2 class="font-semibold mb-3">{{ t('account.shippingAddress') }}</h2>
          <p>
            {{ order.shippingAddress?.firstName }}
            {{ order.shippingAddress?.lastName }}
          </p>
          <p class="text-sm text-gray-600">
            {{ order.shippingAddress?.street }},
            {{ order.shippingAddress?.city }}
          </p>
          <p class="text-sm text-gray-600">
            {{ order.shippingAddress?.phone }}
          </p>
        </div>

        <div class="border p-4">
          <h2 class="font-semibold mb-3">{{ t('account.paymentInfo') }}</h2>
          <p>{{ t('cart.subtotal') }}: ${{ order.subtotal }}</p>
          <p>{{ t('cart.shipping') }}: ${{ order.shippingFee }}</p>
          <p>{{ t('admin.discount') }}: -${{ order.discount }}</p>
          <p class="font-semibold mt-2">{{ t('cart.total') }}: ${{ order.total }}</p>

          <div
            v-if="order.paymentStatus === 'UNPAID'"
            class="mt-4 space-y-3 border-t pt-4"
          >
            <p class="text-sm text-red-500 mb-3">
              {{ t('account.unpaidHint') }}
            </p>
            <button
              type="button"
              class="btn btn-primary"
              @click="showPaymentModal = true"
            >
              {{ t('account.payNow') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <PaymentModal
      v-model="showPaymentModal"
      :order="order"
      @success="onPaymentSuccess"
      @error="onPaymentError"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/api";
import PaymentModal from "@/components/payment/PaymentModal.vue";

const { t } = useI18n();
const route = useRoute();
const toast = useToast();
const isLoading = ref(true);
const order = ref(null);
const showPaymentModal = ref(false);

onMounted(async () => {
  try {
    order.value = await api.orders.get(route.params.orderNumber);
  } catch (e) {
    toast.error(e?.message || t("account.loadOrderFailed"));
  } finally {
    isLoading.value = false;
  }
});

const statusText = computed(() => {
  const map = {
    PENDING: t("account.orderStatusPending"),
    CONFIRMED: t("account.orderStatusConfirmed"),
    PROCESSING: t("account.orderStatusProcessing"),
    SHIPPED: t("account.orderStatusShipped"),
    DELIVERED: t("account.orderStatusDelivered"),
    CANCELLED: t("account.orderStatusCancelled"),
  };
  return map[order.value?.status] || "";
});

const statusClass = computed(() => {
  const map = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };
  return map[order.value?.status] || "bg-gray-100";
});

function onPaymentSuccess(res) {
  toast.success(res?.message || t("checkout.paySuccess"));
  if (order.value) {
    order.value.paymentStatus = "PAID";
  }
}

function onPaymentError(err) {
  toast.error(err?.message || t("checkout.payFailedRetry"));
}
</script>
