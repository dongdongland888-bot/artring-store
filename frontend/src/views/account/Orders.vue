<template>
  <div>
    <h1 class="text-2xl font-serif font-bold mb-6">{{ t('account.orders') }}</h1>

    <div v-if="isLoading" class="space-y-4">
      <div
        v-for="i in 3"
        :key="i"
        class="animate-pulse h-24 bg-gray-100 rounded"
      ></div>
    </div>

    <div v-else-if="orders.length" class="space-y-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="p-4 border rounded-lg hover:border-dark transition-colors"
      >
        <RouterLink :to="`/account/orders/${order.orderNumber}`" class="block">
          <div class="flex justify-between items-start mb-2">
            <span class="font-medium">{{ order.orderNumber }}</span>
            <span
              class="text-sm px-2 py-1 rounded"
              :class="statusClass(order.status)"
            >
              {{ statusText(order.status) }}
            </span>
          </div>
          <p class="text-sm text-gray-500">
            {{ new Date(order.createdAt).toLocaleDateString() }} ·
            {{ t('account.itemsCount', { count: order.items.length }) }} · ${{ order.total }}
          </p>
          <p class="mt-1 flex items-center gap-2">
            <span
              v-if="order.paymentStatus === 'UNPAID'"
              class="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600"
            >
              {{ t('account.unpaid') }}
            </span>
            <span
              v-else
              class="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600"
            >
              {{ t('account.paid') }}
            </span>
          </p>
        </RouterLink>
        <div v-if="order.paymentStatus === 'UNPAID'" class="mt-3 pt-3 border-t">
          <button
            type="button"
            class="btn btn-primary text-sm"
            @click.stop.prevent="openPayModal(order)"
          >
            {{ t('account.payNow') }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <p class="text-gray-500 mb-4">{{ t('account.noOrders') }}</p>
      <RouterLink to="/shop" class="btn btn-primary">{{ t('cart.goShopping') }}</RouterLink>
    </div>

    <PaymentModal
      v-model="showPaymentModal"
      :order="payOrder"
      @success="onPaymentSuccess"
      @error="onPaymentError"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useToast } from "vue-toastification";
import api from "@/api";
import PaymentModal from "@/components/payment/PaymentModal.vue";

const { t } = useI18n();
const toast = useToast();
const isLoading = ref(true);
const orders = ref([]);
const showPaymentModal = ref(false);
const payOrder = ref(null);

function openPayModal(order) {
  payOrder.value = order;
  showPaymentModal.value = true;
}

function onPaymentSuccess(res) {
  toast.success(res?.message || t("checkout.paySuccess"));
  const orderNumber = res?.orderNumber;
  if (orderNumber) {
    const o = orders.value.find((x) => x.orderNumber === orderNumber);
    if (o) o.paymentStatus = "PAID";
  }
}

function onPaymentError(err) {
  toast.error(err?.message || t("checkout.payFailedRetry"));
}

onMounted(async () => {
  try {
    const res = await api.orders.list();
    orders.value = res.orders;
  } catch (e) {
    // ignore
  } finally {
    isLoading.value = false;
  }
});

const statusText = (s) =>
  ({
    PENDING: t("account.orderStatusPending"),
    CONFIRMED: t("account.orderStatusConfirmed"),
    PROCESSING: t("account.orderStatusProcessing"),
    SHIPPED: t("account.orderStatusShipped"),
    DELIVERED: t("account.orderStatusDelivered"),
    CANCELLED: t("account.orderStatusCancelled"),
  }[s] || s);

const statusClass = (s) =>
  ({
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  }[s] || "bg-gray-100");
</script>
