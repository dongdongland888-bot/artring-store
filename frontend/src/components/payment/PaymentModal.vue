<template>
  <TransitionRoot :show="modelValue" as="template">
    <Dialog as="div" class="relative z-50" @close="close">
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
              class="w-full max-w-md bg-white shadow-xl rounded-lg p-6"
            >
              <DialogTitle class="text-lg font-semibold mb-2">
                请完成支付
              </DialogTitle>
              <p class="text-sm text-gray-500 mb-4">
                订单号 {{ order?.orderNumber }} · 应付
                <span class="font-semibold text-dark">
                  ${{ order ? Number(order.total).toFixed(2) : "0.00" }}
                </span>
              </p>

              <!-- 支付方式选择 -->
              <p class="text-sm font-medium text-gray-700 mb-2">选择支付方式</p>
              <div class="grid grid-cols-2 gap-2 mb-4">
                <label
                  class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all"
                  :class="
                    paymentMethod === METHOD_STRIPE
                      ? 'border-dark bg-gray-50 ring-2 ring-dark ring-opacity-20'
                      : 'border-gray-200 hover:border-gray-300'
                  "
                >
                  <input
                    v-model="paymentMethod"
                    type="radio"
                    name="payMethod"
                    :value="METHOD_STRIPE"
                    class="sr-only"
                  />
                  <svg
                    class="w-6 h-6 text-blue-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 4v8h16V8H4z"
                    />
                  </svg>
                  <span class="text-sm font-medium">Stripe</span>
                </label>
                <label
                  class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all"
                  :class="
                    paymentMethod === METHOD_PAYPAL
                      ? 'border-dark bg-gray-50 ring-2 ring-dark ring-opacity-20'
                      : 'border-gray-200 hover:border-gray-300'
                  "
                >
                  <input
                    v-model="paymentMethod"
                    type="radio"
                    name="payMethod"
                    :value="METHOD_PAYPAL"
                    class="sr-only"
                  />
                  <svg
                    class="w-6 h-6 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="#003087"
                  >
                    <path
                      d="M7.076 21.337H2.47a.641.641 0 0 1-.641-.641V3.318c0-.354.287-.641.641-.641h4.606c3.504 0 5.805 1.302 6.932 3.711.859 1.831.963 4.259-.565 6.716-1.364 2.18-3.544 2.746-5.937 2.746h-1.313v2.649a.641.641 0 0 1-.641.641zm.641-4.268h1.313c1.882 0 3.464-.548 4.597-1.727 1.152-1.2 1.385-2.994.77-4.507-.732-1.806-2.436-2.54-4.597-2.54H7.717v8.774zm12.247-9.809c-.131-.261-.524-.641-1.383-.641h-4.12v12.5h2.907v-5.136h1.313c1.201 0 2.18-.333 2.907-1.005.73-.673 1.092-1.612 1.092-2.816 0-1.204-.363-2.143-1.092-2.816-.727-.672-1.706-1.005-2.907-1.005h-1.313V7.336h2.907c.524 0 .916.131 1.201.393.284.261.524.719.655 1.179l1.774 6.393h3.023l-1.969-7.179z"
                    />
                  </svg>
                  <span class="text-sm font-medium">PayPal</span>
                </label>
              </div>

              <!-- 支付组件（切换方式仅切换展示，不调用支付接口） -->
              <div v-if="order" class="min-h-[100px]">
                <StripePayment
                  v-if="paymentMethod === METHOD_STRIPE"
                  ref="stripePaymentRef"
                  :key="'stripe-' + order.id"
                  :order-id="order.id"
                  :amount="order.total"
                  :hide-submit-button="true"
                  @success="onPaymentSuccess"
                  @error="onPaymentError"
                />
                <PayPalButton
                  v-else
                  :key="'paypal-' + order.id"
                  :order-id="order.id"
                  :amount="order.total"
                  @success="onPaymentSuccess"
                  @error="onPaymentError"
                />
              </div>

              <!-- 确定支付：Stripe 由此按钮触发，PayPal 使用上方按钮 -->
              <div class="mt-4 space-y-2">
                <button
                  v-if="paymentMethod === METHOD_STRIPE"
                  type="button"
                  class="btn btn-primary w-full"
                  @click="confirmPay"
                >
                  确定支付
                </button>
                <p v-else class="text-sm text-gray-500 text-center">
                  请点击上方 PayPal 按钮完成支付
                </p>
                <button
                  type="button"
                  class="btn btn-outline w-full"
                  @click="close"
                >
                  关闭
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, watch } from "vue";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import StripePayment from "./StripePayment.vue";
import PayPalButton from "./PayPalButton.vue";

const METHOD_STRIPE = "stripe";
const METHOD_PAYPAL = "paypal";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 订单 { id, orderNumber, total } */
  order: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue", "success", "close", "error"]);

const paymentMethod = ref(METHOD_PAYPAL);
const stripePaymentRef = ref(null);

watch(
  () => props.modelValue,
  (open) => {
    if (open) paymentMethod.value = METHOD_PAYPAL;
  }
);

function close() {
  emit("update:modelValue", false);
  emit("close");
}

/** 确定支付：仅 Stripe 由此触发，PayPal 使用上方 SDK 按钮 */
function confirmPay() {
  if (paymentMethod.value === METHOD_STRIPE && stripePaymentRef.value?.submit) {
    stripePaymentRef.value.submit();
  }
}

function onPaymentSuccess(res) {
  emit("success", res);
  close();
}

function onPaymentError(err) {
  emit("error", err);
}
</script>
