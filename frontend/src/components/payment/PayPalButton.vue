<template>
  <div class="paypal-wrap">
    <p class="text-sm font-medium text-gray-700 mb-3">使用 PayPal 支付</p>
    <!-- 容器始终挂载，保证 paypalHostRef 存在以便 SDK 能渲染 -->
    <div ref="containerRef" class="paypal-button-container">
      <div v-show="loading" class="paypal-loading">
        <div
          class="w-8 h-8 border-2 border-gray-300 border-t-dark rounded-full animate-spin"
        />
      </div>
      <button
        v-show="!loading"
        type="button"
        class="paypal-trigger-btn"
        aria-label="确定支付"
        :disabled="disabled"
        @click="triggerPayPalClick"
      >
        确定支付
      </button>
      <!-- PayPal SDK 渲染在此，需有宽高 SDK 才渲染，用样式移出视口 -->
      <div ref="paypalHostRef" class="paypal-host" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { loadScript } from "@paypal/paypal-js";
import api from "@/api";

const PAYPAL_NOT_CONFIGURED_MSG =
  "未配置 PayPal Client ID，请在后端 .env 中设置 PAYPAL_CLIENT_ID";

const props = defineProps({
  /** 本系统订单 ID */
  orderId: { type: String, required: true },
  /** 金额（仅展示，实际以后端为准） */
  amount: { type: [String, Number], default: "0.00" },
  /** 是否禁用 */
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["success", "error"]);

const containerRef = ref(null);
const paypalHostRef = ref(null);
const loading = ref(true);

async function initButtons() {
  let clientId;
  try {
    const res = await api.payments.getPayPalClientId();
    clientId = res?.clientId;
  } catch {
    clientId = null;
  }
  if (!clientId) {
    loading.value = false;
    emit("error", new Error(PAYPAL_NOT_CONFIGURED_MSG));
    return;
  }
  const host = paypalHostRef.value;
  if (!host) {
    loading.value = false;
    return;
  }
  try {
    const paypal = await loadScript({
      clientId,
      currency: "USD",
      locale: "zh_CN",
    });
    if (!paypal.Buttons) return;
    paypal
      .Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
          height: 44,
        },
        createOrder: async () => {
          const { orderID } = await api.payments.createPayPalOrder(
            props.orderId
          );
          return orderID;
        },
        onApprove: async (data) => {
          try {
            const res = await api.payments.capturePayPal({
              orderId: props.orderId,
              paypalOrderId: data.orderID,
            });
            if (res.success) emit("success", res);
            else emit("error", new Error(res.message || "支付未完成"));
          } catch (e) {
            emit("error", e);
          }
        },
        onError: (err) => emit("error", err),
      })
      .render(host);
  } catch (e) {
    emit("error", e);
  } finally {
    loading.value = false;
  }
}

/** 点击「确定支付」时，程序触发 PayPal 渲染的按钮点击，从而调用 createOrder 并打开 PayPal */
function triggerPayPalClick() {
  if (props.disabled) return;
  const host = paypalHostRef.value;
  if (!host || !host.firstElementChild) return;
  const clickable =
    host.querySelector("a") ||
    host.querySelector('[role="button"]') ||
    host.firstElementChild;
  if (clickable && typeof clickable.click === "function") {
    clickable.click();
  }
}

function reinitPayPal() {
  const host = paypalHostRef.value;
  if (!host) return;
  host.innerHTML = "";
  loading.value = true;
  nextTick(() => initButtons());
}

onMounted(() => {
  nextTick(() => initButtons());
});

watch(
  () => props.orderId,
  () => reinitPayPal()
);

onUnmounted(() => {
  if (paypalHostRef.value) paypalHostRef.value.innerHTML = "";
});
</script>

<style scoped>
.paypal-wrap {
  width: 100%;
}
.paypal-button-container {
  position: relative;
  width: 100%;
  min-width: 200px;
  min-height: 48px;
}
/* 可见的「确定支付」按钮 */
.paypal-trigger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  color: #fff;
  background-color: var(--color-dark, #1a1a1a);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: opacity 0.2s;
}
.paypal-trigger-btn:hover {
  opacity: 0.9;
}
.paypal-trigger-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
/* 加载中遮罩 */
.paypal-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 2;
}
/* PayPal SDK 渲染区：需有宽高 SDK 才渲染，移出视口隐藏，点击由「确定支付」程序触发 */
.paypal-host {
  position: absolute;
  left: -9999px;
  top: 0;
  width: 200px;
  height: 48px;
  overflow: hidden;
  visibility: hidden;
}
</style>
