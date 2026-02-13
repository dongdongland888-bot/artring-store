<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-20">
      <div
        class="w-10 h-10 border-3 border-gray-300 border-t-dark rounded-full animate-spin mx-auto mb-4"
      ></div>
      <p class="text-gray-400">{{ t('admin.loading') }}</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <RouterLink to="/admin/orders" class="btn btn-outline">{{ t('admin.backToOrders') }}</RouterLink>
    </div>

    <!-- Order detail -->
    <div v-else-if="order">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <RouterLink to="/admin/orders" class="hover:text-dark transition-colors">{{ t('admin.orderManagement') }}</RouterLink>
        <span>/</span>
        <span class="text-gray-700 font-medium">{{ t('admin.order') }} {{ order.orderNumber }}</span>
      </nav>
      <div class="flex flex-wrap items-center gap-4 mb-6">
        <RouterLink
          to="/admin/orders"
          class="text-gray-500 hover:text-dark transition-colors"
          >&larr; {{ t('admin.backToList') }}</RouterLink>
        <h1 class="text-2xl font-bold">{{ t('admin.order') }} {{ order.orderNumber }}</h1>
        <span
          class="inline-flex px-3 py-1 text-sm rounded-full"
          :class="statusClass(order.status)"
        >
          {{ statusLabel(order.status) }}
        </span>
        <span v-if="order.trackingNumber" class="text-sm text-gray-600">
          {{ t('admin.trackingNumber') }}: <span class="font-mono">{{ order.trackingNumber }}</span>
        </span>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Left: Order Items -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Items -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="font-semibold mb-4">{{ t('admin.orderItems') }}</h2>
            <div class="divide-y">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex gap-4 py-3"
              >
                <img
                  :src="
                    item.product?.images?.[0]?.url ||
                    'https://via.placeholder.com/60'
                  "
                  class="w-14 h-14 object-cover rounded flex-shrink-0"
                  @error="handleImageError"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-medium">{{ item.productName }}</p>
                  <p v-if="item.variantInfo" class="text-sm text-gray-500">
                    {{ item.variantInfo }}
                  </p>
                </div>
                <div class="text-right text-sm flex-shrink-0">
                  <p>
                    ${{ parseFloat(item.price).toFixed(2) }} x
                    {{ item.quantity }}
                  </p>
                  <p class="font-medium">
                    ${{ parseFloat(item.total).toFixed(2) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Address -->
          <div
            v-if="order.shippingAddress"
            class="bg-white rounded-lg shadow-sm p-6"
          >
            <h2 class="font-semibold mb-3">{{ t('admin.shippingAddress') }}</h2>
            <p>
              {{ order.shippingAddress.firstName }}
              {{ order.shippingAddress.lastName }}
            </p>
            <p class="text-gray-600 text-sm">
              {{ order.shippingAddress.street }},
              {{ order.shippingAddress.city }},
              {{ order.shippingAddress.state }}
              {{ order.shippingAddress.postalCode }}
            </p>
            <p class="text-gray-600 text-sm">
              {{ order.shippingAddress.phone }}
            </p>
          </div>
        </div>

        <!-- Right: Status & Actions -->
        <div class="space-y-6">
          <!-- Summary -->
          <div class="bg-white rounded-lg shadow-sm p-6 space-y-3">
            <h2 class="font-semibold mb-2">{{ t('admin.orderInfo') }}</h2>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">{{ t('admin.subtotal') }}</span>
              <span>${{ parseFloat(order.subtotal).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">{{ t('admin.shipping') }}</span>
              <span>${{ parseFloat(order.shippingFee).toFixed(2) }}</span>
            </div>
            <div
              v-if="parseFloat(order.discount) > 0"
              class="flex justify-between text-sm"
            >
              <span class="text-gray-500">{{ t('admin.discount') }}</span>
              <span class="text-red-500"
                >-${{ parseFloat(order.discount).toFixed(2) }}</span
              >
            </div>
            <hr />
            <div class="flex justify-between font-semibold">
              <span>{{ t('admin.total') }}</span>
              <span>${{ parseFloat(order.total).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm pt-2">
              <span class="text-gray-500">{{ t('admin.paymentStatus') }}</span>
              <span
                class="inline-flex px-2 py-0.5 text-xs rounded-full"
                :class="paymentClass(order.paymentStatus)"
              >
                {{ paymentLabel(order.paymentStatus) }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">{{ t('admin.orderTime') }}</span>
              <span>{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">{{ t('admin.customer') }}</span>
              <span>{{ order.user?.email }}</span>
            </div>
          </div>

          <!-- Status Update -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="font-semibold mb-3">{{ t('admin.updateStatus') }}</h2>
            <select v-model="newStatus" class="input text-sm mb-3">
              <option value="PENDING">{{ t('admin.pending') }}</option>
              <option value="CONFIRMED">{{ t('admin.confirmed') }}</option>
              <option value="PROCESSING">{{ t('admin.processing') }}</option>
              <option value="SHIPPED">{{ t('admin.shipped') }}</option>
              <option value="DELIVERED">{{ t('admin.delivered') }}</option>
              <option value="CANCELLED">{{ t('admin.cancelled') }}</option>
            </select>
            <div v-if="newStatus === 'SHIPPED'" class="mb-3">
              <label class="block text-sm font-medium mb-1">{{ t('admin.trackingNumber') }}</label>
              <input
                v-model="trackingNumber"
                type="text"
                class="input text-sm"
                :placeholder="t('admin.trackingPlaceholder')"
              />
            </div>
            <button
              @click="updateStatus"
              class="w-full btn btn-primary text-sm"
              :disabled="isUpdating || newStatus === order.status"
            >
              {{ isUpdating ? t('admin.updating') : t('admin.updateStatus') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useToast } from "vue-toastification";
import api from "@/api";

const route = useRoute();
const { t } = useI18n();
const toast = useToast();

const order = ref(null);
const newStatus = ref("PENDING");
const trackingNumber = ref("");
const isUpdating = ref(false);
const isLoading = ref(true);
const error = ref(null);

const statusMap = {
  PENDING: { key: "pending", cls: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { key: "confirmed", cls: "bg-blue-100 text-blue-700" },
  PROCESSING: { key: "processing", cls: "bg-indigo-100 text-indigo-700" },
  SHIPPED: { key: "shipped", cls: "bg-purple-100 text-purple-700" },
  DELIVERED: { key: "delivered", cls: "bg-green-100 text-green-700" },
  CANCELLED: { key: "cancelled", cls: "bg-gray-100 text-gray-700" },
  REFUNDED: { key: "refunded", cls: "bg-red-100 text-red-700" },
};
const statusLabel = (s) => (statusMap[s] ? t("admin." + statusMap[s].key) : s);
const statusClass = (s) => statusMap[s]?.cls || "";

const paymentMap = {
  UNPAID: { key: "unpaid", cls: "bg-yellow-100 text-yellow-700" },
  PAID: { key: "paid", cls: "bg-green-100 text-green-700" },
  REFUNDED: { key: "refunded", cls: "bg-red-100 text-red-700" },
  FAILED: { key: "failed", cls: "bg-red-100 text-red-700" },
};
const paymentLabel = (s) => (paymentMap[s] ? t("admin." + paymentMap[s].key) : s);
const paymentClass = (s) => paymentMap[s]?.cls || "";
const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const handleImageError = (e) => {
  e.target.src = "https://via.placeholder.com/60";
};

const updateStatus = async () => {
  isUpdating.value = true;
  try {
    const data = { status: newStatus.value };
    if (newStatus.value === "SHIPPED" && trackingNumber.value) {
      data.trackingNumber = trackingNumber.value;
    }
    await api.admin.updateOrderStatus(order.value.id, data);
    order.value.status = newStatus.value;
    if (data.trackingNumber) order.value.trackingNumber = data.trackingNumber;
    toast.success(t("admin.statusUpdated"));
  } catch (e) {
    toast.error(e.message);
  } finally {
    isUpdating.value = false;
  }
};

onMounted(async () => {
  try {
    order.value = await api.admin.order(route.params.id);
    newStatus.value = order.value.status;
    trackingNumber.value = order.value.trackingNumber || "";
  } catch (e) {
    error.value = e.message || t("admin.loadOrderFailed");
    toast.error(error.value);
  } finally {
    isLoading.value = false;
  }
});
</script>
