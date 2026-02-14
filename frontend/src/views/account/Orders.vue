<template>
  <div>
    <h1 class="text-2xl font-serif font-bold mb-6">{{ t('account.orders') }}</h1>

    <!-- 待评价提示 -->
    <div v-if="pendingReviews.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <StarIcon class="w-5 h-5 text-yellow-500" />
          <span class="font-medium">{{ t('review.pendingReviews') }}</span>
          <span class="text-sm text-gray-500">({{ pendingReviews.length }})</span>
        </div>
        <button 
          type="button" 
          class="text-sm text-yellow-700 hover:text-yellow-800 underline"
          @click="showPendingReviews = !showPendingReviews"
        >
          {{ showPendingReviews ? t('common.close') : t('common.view') }}
        </button>
      </div>
      <!-- 待评价商品列表 -->
      <div v-if="showPendingReviews" class="mt-4 space-y-3">
        <div
          v-for="item in pendingReviews"
          :key="`${item.orderId}-${item.productId}`"
          class="flex items-center gap-3 bg-white p-3 rounded"
        >
          <img
            :src="item.product?.images?.[0]?.url || '/placeholder.jpg'"
            :alt="item.productName"
            class="w-12 h-12 object-cover rounded"
          />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ item.productName }}</p>
            <p class="text-sm text-gray-500">{{ item.orderNumber }}</p>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-primary"
            @click="openReviewModal(item)"
          >
            {{ t('review.goReview') }}
          </button>
        </div>
      </div>
    </div>

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
        <div class="mt-3 pt-3 border-t flex items-center gap-3">
          <button
            v-if="order.paymentStatus === 'UNPAID'"
            type="button"
            class="btn btn-primary text-sm"
            @click.stop.prevent="openPayModal(order)"
          >
            {{ t('account.payNow') }}
          </button>
          <!-- 显示待评价商品 -->
          <template v-if="hasUnreviewedItems(order)">
            <button
              type="button"
              class="btn btn-outline text-sm"
              @click.stop.prevent="showOrderReviews(order)"
            >
              <StarIcon class="w-4 h-4 mr-1" />
              {{ t('review.goReview') }}
            </button>
          </template>
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

    <!-- 评价弹窗 -->
    <Teleport to="body">
      <div
        v-if="reviewModalItem"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click="reviewModalItem = null"
      >
        <div class="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto" @click.stop>
          <div class="p-4 border-b flex items-center justify-between">
            <h3 class="text-lg font-medium">{{ t('review.writeReview') }}</h3>
            <button type="button" class="text-gray-400 hover:text-gray-600" @click="reviewModalItem = null">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>
          <div class="p-4">
            <!-- 商品信息 -->
            <div class="flex items-center gap-3 mb-6 pb-4 border-b">
              <img
                :src="reviewModalItem.product?.images?.[0]?.url || '/placeholder.jpg'"
                :alt="reviewModalItem.productName"
                class="w-16 h-16 object-cover rounded"
              />
              <div>
                <p class="font-medium">{{ reviewModalItem.productName }}</p>
                <p v-if="reviewModalItem.variantInfo" class="text-sm text-gray-500">{{ reviewModalItem.variantInfo }}</p>
              </div>
            </div>
            <!-- 评价表单 -->
            <ReviewForm
              :product-id="reviewModalItem.productId"
              :order-id="reviewModalItem.orderId"
              show-cancel
              @success="onReviewSuccess"
              @cancel="reviewModalItem = null"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useToast } from "vue-toastification";
import { StarIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import api from "@/api";
import PaymentModal from "@/components/payment/PaymentModal.vue";
import ReviewForm from "@/components/review/ReviewForm.vue";

const { t } = useI18n();
const toast = useToast();
const isLoading = ref(true);
const orders = ref([]);
const showPaymentModal = ref(false);
const payOrder = ref(null);
const pendingReviews = ref([]);
const showPendingReviews = ref(false);
const reviewModalItem = ref(null);

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

// 检查订单是否有未评价的商品
function hasUnreviewedItems(order) {
  if (!['DELIVERED', 'CONFIRMED', 'SHIPPED'].includes(order.status)) return false;
  return pendingReviews.value.some(item => item.orderId === order.id);
}

// 显示订单的待评价商品
function showOrderReviews(order) {
  const items = pendingReviews.value.filter(item => item.orderId === order.id);
  if (items.length > 0) {
    openReviewModal(items[0]);
  }
}

// 打开评价弹窗
function openReviewModal(item) {
  reviewModalItem.value = item;
}

// 评价成功回调
function onReviewSuccess() {
  reviewModalItem.value = null;
  toast.success(t('review.createSuccess'));
  // 刷新待评价列表
  fetchPendingReviews();
}

// 获取待评价商品
async function fetchPendingReviews() {
  try {
    const res = await api.reviews.pending();
    pendingReviews.value = res.pendingItems || [];
  } catch (e) {
    // 忽略错误
  }
}

onMounted(async () => {
  try {
    const [ordersRes] = await Promise.all([
      api.orders.list(),
      fetchPendingReviews()
    ]);
    orders.value = ordersRes.orders;
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
