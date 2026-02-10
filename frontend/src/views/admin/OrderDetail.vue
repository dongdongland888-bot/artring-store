<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-20">
      <div
        class="w-10 h-10 border-3 border-gray-300 border-t-dark rounded-full animate-spin mx-auto mb-4"
      ></div>
      <p class="text-gray-400">加载中...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <RouterLink to="/admin/orders" class="btn btn-outline"
        >返回订单列表</RouterLink
      >
    </div>

    <!-- Order detail -->
    <div v-else-if="order">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <RouterLink to="/admin/orders" class="hover:text-dark transition-colors"
          >订单管理</RouterLink
        >
        <span>/</span>
        <span class="text-gray-700 font-medium"
          >订单 {{ order.orderNumber }}</span
        >
      </nav>
      <div class="flex flex-wrap items-center gap-4 mb-6">
        <RouterLink
          to="/admin/orders"
          class="text-gray-500 hover:text-dark transition-colors"
          >&larr; 返回列表</RouterLink
        >
        <h1 class="text-2xl font-bold">订单 {{ order.orderNumber }}</h1>
        <span
          class="inline-flex px-3 py-1 text-sm rounded-full"
          :class="statusClass(order.status)"
        >
          {{ statusLabel(order.status) }}
        </span>
        <span v-if="order.trackingNumber" class="text-sm text-gray-600">
          物流单号：<span class="font-mono">{{ order.trackingNumber }}</span>
        </span>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Left: Order Items -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Items -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="font-semibold mb-4">订单商品</h2>
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
            <h2 class="font-semibold mb-3">收货地址</h2>
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
            <h2 class="font-semibold mb-2">订单信息</h2>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">小计</span>
              <span>${{ parseFloat(order.subtotal).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">运费</span>
              <span>${{ parseFloat(order.shippingFee).toFixed(2) }}</span>
            </div>
            <div
              v-if="parseFloat(order.discount) > 0"
              class="flex justify-between text-sm"
            >
              <span class="text-gray-500">折扣</span>
              <span class="text-red-500"
                >-${{ parseFloat(order.discount).toFixed(2) }}</span
              >
            </div>
            <hr />
            <div class="flex justify-between font-semibold">
              <span>总计</span>
              <span>${{ parseFloat(order.total).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm pt-2">
              <span class="text-gray-500">支付状态</span>
              <span
                class="inline-flex px-2 py-0.5 text-xs rounded-full"
                :class="paymentClass(order.paymentStatus)"
              >
                {{ paymentLabel(order.paymentStatus) }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">下单时间</span>
              <span>{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">客户</span>
              <span>{{ order.user?.email }}</span>
            </div>
          </div>

          <!-- Status Update -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="font-semibold mb-3">更新状态</h2>
            <select v-model="newStatus" class="input text-sm mb-3">
              <option value="PENDING">待处理</option>
              <option value="CONFIRMED">已确认</option>
              <option value="PROCESSING">处理中</option>
              <option value="SHIPPED">已发货</option>
              <option value="DELIVERED">已送达</option>
              <option value="CANCELLED">已取消</option>
            </select>
            <div v-if="newStatus === 'SHIPPED'" class="mb-3">
              <label class="block text-sm font-medium mb-1">物流单号</label>
              <input
                v-model="trackingNumber"
                type="text"
                class="input text-sm"
                placeholder="输入物流单号"
              />
            </div>
            <button
              @click="updateStatus"
              class="w-full btn btn-primary text-sm"
              :disabled="isUpdating || newStatus === order.status"
            >
              {{ isUpdating ? "更新中..." : "更新状态" }}
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
import { useToast } from "vue-toastification";
import api from "@/api";

const route = useRoute();
const toast = useToast();

const order = ref(null);
const newStatus = ref("PENDING");
const trackingNumber = ref("");
const isUpdating = ref(false);
const isLoading = ref(true);
const error = ref(null);

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
const statusClass = (s) => statusMap[s]?.cls || "";

const paymentMap = {
  UNPAID: { label: "未支付", cls: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "已支付", cls: "bg-green-100 text-green-700" },
  REFUNDED: { label: "已退款", cls: "bg-red-100 text-red-700" },
  FAILED: { label: "失败", cls: "bg-red-100 text-red-700" },
};
const paymentLabel = (s) => paymentMap[s]?.label || s;
const paymentClass = (s) => paymentMap[s]?.cls || "";
const formatDate = (d) =>
  new Date(d).toLocaleDateString("zh-CN", {
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
    toast.success("状态已更新");
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
    error.value = e.message || "加载订单失败";
    toast.error(error.value);
  } finally {
    isLoading.value = false;
  }
});
</script>
