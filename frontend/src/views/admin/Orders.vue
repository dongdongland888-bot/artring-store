<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">订单管理</h1>

    <!-- Filters -->
    <div
      class="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3"
    >
      <select
        v-model="filterStatus"
        class="input text-sm w-auto"
        @change="fetchOrders"
      >
        <option value="">全部状态</option>
        <option value="PENDING">待处理</option>
        <option value="CONFIRMED">已确认</option>
        <option value="PROCESSING">处理中</option>
        <option value="SHIPPED">已发货</option>
        <option value="DELIVERED">已送达</option>
        <option value="CANCELLED">已取消</option>
      </select>
      <select
        v-model="filterPayment"
        class="input text-sm w-auto"
        @change="fetchOrders"
      >
        <option value="">全部支付</option>
        <option value="UNPAID">未支付</option>
        <option value="PAID">已支付</option>
        <option value="REFUNDED">已退款</option>
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
      <p class="text-gray-400">加载中...</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-lg shadow-sm overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 font-medium text-gray-500">
              订单号
            </th>
            <th
              class="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell"
            >
              客户
            </th>
            <th class="text-left px-6 py-3 font-medium text-gray-500">金额</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500">状态</th>
            <th
              class="text-left px-6 py-3 font-medium text-gray-500 hidden sm:table-cell"
            >
              支付
            </th>
            <th
              class="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell"
            >
              时间
            </th>
            <th class="text-right px-6 py-3 font-medium text-gray-500">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50">
            <td class="px-6 py-3 font-mono text-xs">{{ order.orderNumber }}</td>
            <td class="px-6 py-3 hidden md:table-cell">
              {{ order.user?.firstName || order.user?.email }}
            </td>
            <td class="px-6 py-3 font-medium">
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
            <td class="px-6 py-3 hidden sm:table-cell">
              <span
                class="inline-flex px-2 py-0.5 text-xs rounded-full"
                :class="paymentClass(order.paymentStatus)"
              >
                {{ paymentLabel(order.paymentStatus) }}
              </span>
            </td>
            <td class="px-6 py-3 hidden lg:table-cell text-gray-500">
              {{ formatDate(order.createdAt) }}
            </td>
            <td class="px-6 py-3 text-right">
              <RouterLink
                :to="`/admin/orders/${order.id}`"
                class="text-blue-600 hover:underline text-sm"
                >详情</RouterLink
              >
            </td>
          </tr>
          <tr v-if="orders.length === 0">
            <td colspan="7" class="px-6 py-12 text-center text-gray-400">
              暂无订单
            </td>
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
import api from "@/api";

const orders = ref([]);
const isLoading = ref(false);
const filterStatus = ref("");
const filterPayment = ref("");
const page = ref(1);
const pagination = ref({ pages: 1 });

const statusMap = {
  PENDING: { label: "待处理", cls: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "已确认", cls: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "处理中", cls: "bg-indigo-100 text-indigo-700" },
  SHIPPED: { label: "已发货", cls: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "已送达", cls: "bg-green-100 text-green-700" },
  CANCELLED: { label: "已取消", cls: "bg-gray-100 text-gray-700" },
  REFUNDED: { label: "已退款", cls: "bg-red-100 text-red-700" },
};
const paymentMap = {
  UNPAID: { label: "未支付", cls: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "已支付", cls: "bg-green-100 text-green-700" },
  REFUNDED: { label: "已退款", cls: "bg-red-100 text-red-700" },
  FAILED: { label: "失败", cls: "bg-red-100 text-red-700" },
};

const statusLabel = (s) => statusMap[s]?.label || s;
const statusClass = (s) => statusMap[s]?.cls || "";
const paymentLabel = (s) => paymentMap[s]?.label || s;
const paymentClass = (s) => paymentMap[s]?.cls || "";
const formatDate = (d) =>
  new Date(d).toLocaleDateString("zh-CN", {
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
