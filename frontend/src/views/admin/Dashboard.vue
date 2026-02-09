<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">仪表盘</h1>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-20">
      <div
        class="w-10 h-10 border-3 border-gray-300 border-t-dark rounded-full animate-spin mx-auto mb-4"
      ></div>
      <p class="text-gray-400">加载中...</p>
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
        <h2 class="font-semibold">最近订单</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 font-medium text-gray-500">
                订单号
              </th>
              <th class="text-left px-6 py-3 font-medium text-gray-500">
                客户
              </th>
              <th class="text-left px-6 py-3 font-medium text-gray-500">
                金额
              </th>
              <th class="text-left px-6 py-3 font-medium text-gray-500">
                状态
              </th>
              <th class="text-left px-6 py-3 font-medium text-gray-500">
                时间
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="order in recentOrders"
              :key="order.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-3 font-mono text-xs">
                {{ order.orderNumber }}
              </td>
              <td class="px-6 py-3">
                {{ order.user?.firstName || order.user?.email }}
              </td>
              <td class="px-6 py-3">
                ${{ parseFloat(order.total).toFixed(2) }}
              </td>
              <td class="px-6 py-3">
                <span
                  class="inline-flex px-2 py-0.5 text-xs rounded-full"
                  :class="statusClass(order.status)"
                >
                  {{ statusLabel(order.status) }}
                </span>
              </td>
              <td class="px-6 py-3 text-gray-500">
                {{ formatDate(order.createdAt) }}
              </td>
            </tr>
            <tr v-if="recentOrders.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-gray-400">
                暂无订单
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/api";

const stats = ref([]);
const recentOrders = ref([]);
const isLoading = ref(true);

const statusMap = {
  PENDING: { label: "待处理", cls: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "已确认", cls: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "处理中", cls: "bg-indigo-100 text-indigo-700" },
  SHIPPED: { label: "已发货", cls: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "已送达", cls: "bg-green-100 text-green-700" },
  CANCELLED: { label: "已取消", cls: "bg-gray-100 text-gray-700" },
  REFUNDED: { label: "已退款", cls: "bg-red-100 text-red-700" },
};

const statusLabel = (s) => statusMap[s]?.label || s;
const statusClass = (s) => statusMap[s]?.cls || "bg-gray-100 text-gray-700";
const formatDate = (d) =>
  new Date(d).toLocaleDateString("zh-CN", {
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
      { label: "商品总数", value: s.totalProducts },
      { label: "订单总数", value: s.totalOrders },
      { label: "用户总数", value: s.totalUsers },
      { label: "今日订单", value: s.todayOrders },
      { label: "总收入", value: "$" + parseFloat(s.totalRevenue).toFixed(2) },
      { label: "待处理订单", value: s.pendingOrders },
    ];
    recentOrders.value = data.recentOrders;
  } catch (e) {
    console.error("Failed to load dashboard:", e);
  } finally {
    isLoading.value = false;
  }
});
</script>
