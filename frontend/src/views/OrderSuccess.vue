<template>
  <div class="container-custom py-12 text-center">
    <div class="max-w-md mx-auto">
      <CheckCircleIcon class="w-20 h-20 text-green-500 mx-auto mb-6" />
      <h1 class="text-3xl font-serif font-bold mb-2">订单已确认!</h1>
      <p class="text-gray-500 mb-2">
        感谢您的购买，订单号: {{ route.params.orderNumber }}
      </p>

      <template v-if="order">
        <p v-if="order.paymentStatus === 'UNPAID'" class="text-gray-600 mb-4">
          请完成支付：<span class="font-bold text-dark"
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
          我们已发送确认邮件到您的邮箱，请注意查收。
        </p>
      </template>
      <p v-else-if="!orderError" class="text-gray-500 mb-6">加载订单中...</p>
      <p v-else class="text-red-500 mb-6">{{ orderError }}</p>

      <div class="flex gap-4 justify-center">
        <RouterLink to="/account/orders" class="btn btn-primary"
          >查看订单</RouterLink
        >
        <RouterLink to="/shop" class="btn btn-outline">继续购物</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import { CheckCircleIcon } from "@heroicons/vue/24/solid";
import PayPalButton from "@/components/payment/PayPalButton.vue";
import api from "@/api";

const route = useRoute();
const toast = useToast();
const order = ref(null);
const orderError = ref("");

onMounted(async () => {
  try {
    order.value = await api.orders.get(route.params.orderNumber);
  } catch (e) {
    orderError.value = e.message || "加载订单失败";
  }
});

function onPayPalSuccess(res) {
  toast.success(res.message || "支付成功");
  if (order.value) order.value.paymentStatus = "PAID";
}

function onPayPalError(err) {
  toast.error(err?.message || "支付失败，请重试");
}
</script>
