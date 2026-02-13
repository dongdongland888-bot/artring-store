<template>
  <div class="container-custom py-12 text-center">
    <div class="max-w-md mx-auto">
      <CheckCircleIcon class="w-20 h-20 text-green-500 mx-auto mb-6" />
      <h1 class="text-3xl font-serif font-bold mb-2">{{ t('orderSuccess.orderConfirmed') }}</h1>
      <p class="text-gray-500 mb-2">
        {{ t('orderSuccess.thankYouOrder') }} {{ route.params.orderNumber }}
      </p>

      <template v-if="order">
        <p v-if="order.paymentStatus === 'UNPAID'" class="text-gray-600 mb-4">
          {{ t('orderSuccess.completePayBelow') }}<span class="font-bold text-dark"
            >${{ Number(order.total).toFixed(2) }}</span
          >
        </p>
        <div
          v-if="order.paymentStatus === 'UNPAID'"
          class="flex justify-center mb-6"
        >
          <PayPalButton
            :order-id="order.id"
            :amount="order.total"
            @success="onPayPalSuccess"
            @error="onPayPalError"
          />
        </div>
        <p v-else class="text-gray-600 mb-6">
          {{ t('orderSuccess.confirmationEmail') }}
        </p>
      </template>
      <p v-else-if="!orderError" class="text-gray-500 mb-6">{{ t('orderSuccess.loadingOrder') }}</p>
      <p v-else class="text-red-500 mb-6">{{ orderError }}</p>

      <div class="flex gap-4 justify-center">
        <RouterLink to="/account/orders" class="btn btn-primary">
          {{ t('orderSuccess.viewOrder') }}
        </RouterLink>
        <RouterLink to="/shop" class="btn btn-outline">{{ t('cart.continueShopping') }}</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import { CheckCircleIcon } from "@heroicons/vue/24/solid";
import PayPalButton from "@/components/payment/PayPalButton.vue";
import api from "@/api";

const { t } = useI18n();
const route = useRoute();
const toast = useToast();
const order = ref(null);
const orderError = ref("");

onMounted(async () => {
  try {
    order.value = await api.orders.get(route.params.orderNumber);
  } catch (e) {
    orderError.value = e.message || t("orderSuccess.loadOrderFailed");
  }
});

function onPayPalSuccess(res) {
  toast.success(res.message || t("checkout.paySuccess"));
  if (order.value) order.value.paymentStatus = "PAID";
}

function onPayPalError(err) {
  toast.error(err?.message || t("checkout.payFailedRetry"));
}
</script>
