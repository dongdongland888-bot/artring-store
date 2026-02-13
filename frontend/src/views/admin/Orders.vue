<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('admin.orderManagement') }}</h1>

    <!-- Filters -->
    <div
      class="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3"
    >
      <select
        v-model="filterStatus"
        class="input text-sm w-auto"
        @change="fetchOrders"
      >
        <option value="">{{ t('admin.allStatus') }}</option>
        <option value="PENDING">{{ t('admin.pending') }}</option>
        <option value="CONFIRMED">{{ t('admin.confirmed') }}</option>
        <option value="PROCESSING">{{ t('admin.processing') }}</option>
        <option value="SHIPPED">{{ t('admin.shipped') }}</option>
        <option value="DELIVERED">{{ t('admin.delivered') }}</option>
        <option value="CANCELLED">{{ t('admin.cancelled') }}</option>
      </select>
      <select
        v-model="filterPayment"
        class="input text-sm w-auto"
        @change="fetchOrders"
      >
        <option value="">{{ t('admin.allPayment') }}</option>
        <option value="UNPAID">{{ t('admin.unpaid') }}</option>
        <option value="PAID">{{ t('admin.paid') }}</option>
        <option value="REFUNDED">{{ t('admin.refunded') }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div
      v-if="isLoading && orders.length === 0"
      class="bg-white rounded-lg shadow-sm p-12 text-center"
    >
      <div
        class="w-10 h-10 border-3 border-gray-300 border-t-dark rounded-full animate-spin mx-auto mb-4"
      ></div>
      <p class="text-gray-400">{{ t('admin.loading') }}</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-lg shadow-sm overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.orderNumber') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">{{ t('admin.customer') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.amount') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.status') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">{{ t('admin.payment') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">{{ t('admin.time') }}</th>
            <th class="text-right px-6 py-3 font-medium text-gray-500">{{ t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50">
            <td class="px-6 py-3 font-mono text-xs">{{ order.orderNumber }}</td>
            <td class="px-6 py-3 hidden md:table-cell">{{ order.user?.firstName || order.user?.email }}</td>
            <td class="px-6 py-3 font-medium">${{ parseFloat(order.total).toFixed(2) }}</td>
            <td class="px-6 py-3">
              <span
                class="inline-flex px-2 py-0.5 text-xs rounded-full"
                :class="statusClass(order.status)"
              >
                {{ statusLabel(order.status) }}
              </span>
            </td>
            <td class="px-6 py-3 hidden sm:table-cell">
              <span
                class="inline-flex px-2 py-0.5 text-xs rounded-full"
                :class="paymentClass(order.paymentStatus)"
              >
                {{ paymentLabel(order.paymentStatus) }}
              </span>
            </td>
            <td class="px-6 py-3 hidden lg:table-cell text-gray-500">{{ formatDate(order.createdAt) }}</td>
            <td class="px-6 py-3 text-right">
              <RouterLink
                :to="`/admin/orders/${order.orderNumber}`"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-dark border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {{ t('admin.viewDetail') }}
              </RouterLink>
            </td>
          </tr>
          <tr v-if="orders.length === 0">
            <td colspan="7" class="px-6 py-12 text-center text-gray-400">{{ t('admin.noOrders') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.pages > 1" class="mt-6 flex justify-center gap-2">
      <button
        v-for="p in pagination.pages"
        :key="p"
        @click="
          page = p;
          fetchOrders();
        "
        class="w-9 h-9 text-sm flex items-center justify-center border rounded transition-colors"
        :class="page === p ? 'bg-dark text-white' : 'hover:bg-gray-100'"
      >
        {{ p }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/api";

const { t } = useI18n();
const orders = ref([]);
const isLoading = ref(false);
const filterStatus = ref("");
const filterPayment = ref("");
const page = ref(1);
const pagination = ref({ pages: 1 });

const statusMap = {
  PENDING: { key: "pending", cls: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { key: "confirmed", cls: "bg-blue-100 text-blue-700" },
  PROCESSING: { key: "processing", cls: "bg-indigo-100 text-indigo-700" },
  SHIPPED: { key: "shipped", cls: "bg-purple-100 text-purple-700" },
  DELIVERED: { key: "delivered", cls: "bg-green-100 text-green-700" },
  CANCELLED: { key: "cancelled", cls: "bg-gray-100 text-gray-700" },
  REFUNDED: { key: "refunded", cls: "bg-red-100 text-red-700" },
};
const paymentMap = {
  UNPAID: { key: "unpaid", cls: "bg-yellow-100 text-yellow-700" },
  PAID: { key: "paid", cls: "bg-green-100 text-green-700" },
  REFUNDED: { key: "refunded", cls: "bg-red-100 text-red-700" },
  FAILED: { key: "failed", cls: "bg-red-100 text-red-700" },
};
const statusLabel = (s) => (statusMap[s] ? t("admin." + statusMap[s].key) : s);
const statusClass = (s) => statusMap[s]?.cls || "";
const paymentLabel = (s) => (paymentMap[s] ? t("admin." + paymentMap[s].key) : s);
const paymentClass = (s) => paymentMap[s]?.cls || "";
const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fetchOrders = async () => {
  isLoading.value = true;
  try {
    const params = { page: page.value, limit: 20 };
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterPayment.value) params.paymentStatus = filterPayment.value;
    const data = await api.admin.orders(params);
    orders.value = data.orders;
    pagination.value = data.pagination;
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchOrders);
</script>
