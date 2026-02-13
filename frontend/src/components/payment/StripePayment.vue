<template>
  <div class="stripe-payment">
    <div v-if="loading" class="flex justify-center py-4">
      <div
        class="w-8 h-8 border-2 border-gray-300 border-t-dark rounded-full animate-spin"
      />
    </div>
    <template v-else>
      <div ref="cardRef" class="p-4 border rounded-lg bg-gray-50" />
      <p class="text-xs text-gray-500 mt-2">{{ t('payment.stripeSupport') }}</p>
      <button
        v-if="!hideSubmitButton"
        type="button"
        class="btn btn-primary w-full mt-4"
        :disabled="paying"
        @click="submit"
      >
        {{ paying ? t('payment.paying') : t('payment.payAmount', { amount }) }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { loadStripe } from "@stripe/stripe-js";
import api from "@/api";

const { t } = useI18n();

const props = defineProps({
  orderId: { type: String, required: true },
  amount: { type: [String, Number], default: "0.00" },
  /** 为 true 时不显示内部支付按钮，由父组件触发 submit */
  hideSubmitButton: { type: Boolean, default: false },
});

const emit = defineEmits(["success", "error"]);

const cardRef = ref(null);
const loading = ref(true);
const paying = ref(false);
// 使用 ref 保存 Stripe 实例，便于卸载时清理，避免多实例共享
const stripeRef = ref(null);
const elementsRef = ref(null);
const cardElementRef = ref(null);
const clientSecretRef = ref(null);

async function init() {
  try {
    const { publishableKey } = await api.payments.getStripePublishableKey();
    if (!publishableKey) throw new Error(t("payment.stripeNotConfigured"));
    const stripe = await loadStripe(publishableKey);
    if (!stripe) throw new Error(t("payment.stripeLoadFailed"));
    const res = await api.payments.createIntent(props.orderId);
    clientSecretRef.value = res.clientSecret;
    stripeRef.value = stripe;
    const elements = stripe.elements();
    elementsRef.value = elements;
    const cardElement = elements.create("card", {
      style: { base: { fontSize: "16px" } },
    });
    cardElementRef.value = cardElement;
  } catch (e) {
    emit("error", e);
  } finally {
    loading.value = false;
    // 等 DOM 更新出 card 容器后再挂载
    nextTick(() => {
      if (cardRef.value && cardElementRef.value) {
        cardElementRef.value.mount(cardRef.value);
      }
    });
  }
}

function cleanup() {
  const card = cardElementRef.value;
  if (card && cardRef.value) {
    try {
      card.unmount();
    } catch (_) {
      // 可能已卸载
    }
    cardElementRef.value = null;
  }
  elementsRef.value = null;
  stripeRef.value = null;
  clientSecretRef.value = null;
}

async function submit() {
  const stripe = stripeRef.value;
  const cardElement = cardElementRef.value;
  const clientSecret = clientSecretRef.value;
  if (!stripe || !cardElement || !clientSecret) return;
  paying.value = true;
  try {
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card: cardElement } }
    );
    if (error) {
      emit("error", new Error(error.message || t("payment.payFailed")));
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      const res = await api.payments.confirm({
        orderId: props.orderId,
        paymentIntentId: paymentIntent.id,
      });
      emit("success", res);
    } else {
      emit("error", new Error(t("payment.payIncomplete")));
    }
  } catch (e) {
    emit("error", e);
  } finally {
    paying.value = false;
  }
}

onMounted(init);

watch(
  () => props.orderId,
  () => {
    cleanup();
    loading.value = true;
    init();
  }
);

onUnmounted(cleanup);

defineExpose({ submit });
</script>
