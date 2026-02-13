<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('admin.dashboard') }}</h1>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-20">
      <div
        class="w-10 h-10 border-3 border-gray-300 border-t-dark rounded-full animate-spin mx-auto mb-4"
      ></div>
      <p class="text-gray-400">{{ t('admin.loading') }}</p>
    </div>

    <!-- Stats -->
    <div v-else class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white rounded-lg p-5 shadow-sm"
      >
        <p class="text-sm text-gray-500 mb-1">{{ stat.label }}</p>
        <p class="text-2xl font-bold">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="bg-white rounded-lg shadow-sm">
      <div class="px-6 py-4 border-b">
        <h2 class="font-semibold">{{ t('admin.recentOrders') }}</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.orderNumber') }}</th>
              <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.customer') }}</th>
              <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.amount') }}</th>
              <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.status') }}</th>
              <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.time') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="order in recentOrders"
              :key="order.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-3 font-mono text-xs">{{ order.orderNumber }}</td>
              <td class="px-6 py-3">{{ order.user?.firstName || order.user?.email }}</td>
              <td class="px-6 py-3">${{ parseFloat(order.total).toFixed(2) }}</td>
              <td class="px-6 py-3">
                <span
                  class="inline-flex px-2 py-0.5 text-xs rounded-full"
                  :class="statusClass(order.status)"
                >
                  {{ statusLabel(order.status) }}
                </span>
              </td>
              <td class="px-6 py-3 text-gray-500">{{ formatDate(order.createdAt) }}</td>
            </tr>
            <tr v-if="recentOrders.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-gray-400">{{ t('admin.noOrders') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/api";

const { t } = useI18n();
const stats = ref([]);
const recentOrders = ref([]);
const isLoading = ref(true);

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
const statusClass = (s) => statusMap[s]?.cls || "bg-gray-100 text-gray-700";
const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

onMounted(async () => {
  try {
    const data = await api.admin.dashboard();
    const s = data.stats;
    stats.value = [
      { label: t("admin.totalProducts"), value: s.totalProducts },
      { label: t("admin.totalOrders"), value: s.totalOrders },
      { label: t("admin.totalUsers"), value: s.totalUsers },
      { label: t("admin.todayOrders"), value: s.todayOrders },
      { label: t("admin.totalRevenue"), value: "$" + parseFloat(s.totalRevenue).toFixed(2) },
      { label: t("admin.pendingOrders"), value: s.pendingOrders },
    ];
    recentOrders.value = data.recentOrders;
  } catch (e) {
    console.error("Failed to load dashboard:", e);
  } finally {
    isLoading.value = false;
  }
});
</script>
