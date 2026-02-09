<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">用户管理</h1>

    <!-- Filters -->
    <div
      class="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3"
    >
      <input
        v-model="search"
        type="text"
        placeholder="搜索邮箱或姓名..."
        class="input text-sm flex-1"
        @input="debouncedFetch"
      />
      <select
        v-model="filterRole"
        class="input text-sm w-auto"
        @change="fetchUsers"
      >
        <option value="">全部角色</option>
        <option value="CUSTOMER">客户</option>
        <option value="ADMIN">管理员</option>
        <option value="SUPER_ADMIN">超级管理员</option>
      </select>
    </div>

    <!-- Loading -->
    <div
      v-if="isLoading && users.length === 0"
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
            <th class="text-left px-6 py-3 font-medium text-gray-500">用户</th>
            <th
              class="text-left px-6 py-3 font-medium text-gray-500 hidden sm:table-cell"
            >
              角色
            </th>
            <th
              class="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell"
            >
              订单数
            </th>
            <th class="text-left px-6 py-3 font-medium text-gray-500">状态</th>
            <th
              class="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell"
            >
              注册时间
            </th>
            <th class="text-right px-6 py-3 font-medium text-gray-500">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr
            v-for="user in users"
            :key="user.id"
            class="hover:bg-gray-50"
            :class="{ 'opacity-50': updatingIds.has(user.id) }"
          >
            <td class="px-6 py-3">
              <p class="font-medium">
                {{ user.firstName || "" }} {{ user.lastName || "" }}
              </p>
              <p class="text-xs text-gray-400">{{ user.email }}</p>
            </td>
            <td class="px-6 py-3 hidden sm:table-cell">
              <span
                class="inline-flex px-2 py-0.5 text-xs rounded-full"
                :class="roleClass(user.role)"
              >
                {{ roleLabel(user.role) }}
              </span>
            </td>
            <td class="px-6 py-3 hidden md:table-cell text-gray-500">
              {{ user._count?.orders || 0 }}
            </td>
            <td class="px-6 py-3">
              <span
                class="inline-flex px-2 py-0.5 text-xs rounded-full"
                :class="
                  user.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                "
              >
                {{ user.isActive ? "活跃" : "禁用" }}
              </span>
            </td>
            <td class="px-6 py-3 hidden lg:table-cell text-gray-500">
              {{ formatDate(user.createdAt) }}
            </td>
            <td class="px-6 py-3 text-right space-x-2">
              <select
                :value="user.role"
                @change="updateRole(user, $event.target.value)"
                class="text-xs border rounded px-1 py-0.5"
              >
                <option value="CUSTOMER">客户</option>
                <option value="ADMIN">管理员</option>
              </select>
              <button
                @click="toggleActive(user)"
                class="hover:underline text-sm"
                :class="user.isActive ? 'text-red-600' : 'text-green-600'"
              >
                {{ user.isActive ? "禁用" : "启用" }}
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-gray-400">
              暂无用户
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
          fetchUsers();
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
import { useToast } from "vue-toastification";
import api from "@/api";

const toast = useToast();
const users = ref([]);
const isLoading = ref(false);
const updatingIds = ref(new Set());
const search = ref("");
const filterRole = ref("");
const page = ref(1);
const pagination = ref({ pages: 1 });

const roleMap = {
  CUSTOMER: { label: "客户", cls: "bg-gray-100 text-gray-700" },
  ADMIN: { label: "管理员", cls: "bg-blue-100 text-blue-700" },
  SUPER_ADMIN: { label: "超级管理员", cls: "bg-purple-100 text-purple-700" },
};
const roleLabel = (r) => roleMap[r]?.label || r;
const roleClass = (r) => roleMap[r]?.cls || "";
const formatDate = (d) => new Date(d).toLocaleDateString("zh-CN");

let debounceTimer = null;
const debouncedFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    fetchUsers();
  }, 300);
};

const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const params = { page: page.value, limit: 20 };
    if (search.value) params.search = search.value;
    if (filterRole.value) params.role = filterRole.value;
    const data = await api.admin.users(params);
    users.value = data.users;
    pagination.value = data.pagination;
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

const updateRole = async (user, role) => {
  if (!confirm(`确定要将该用户角色改为"${roleLabel(role)}"吗？`)) {
    return;
  }

  updatingIds.value.add(user.id);
  try {
    await api.admin.updateUser(user.id, { role });
    user.role = role;
    toast.success("角色已更新");
  } catch (e) {
    toast.error(e.message);
  } finally {
    updatingIds.value.delete(user.id);
  }
};

const toggleActive = async (user) => {
  const action = user.isActive ? "禁用" : "启用";
  if (!confirm(`确定要${action}该用户吗？`)) return;

  updatingIds.value.add(user.id);
  try {
    await api.admin.updateUser(user.id, { isActive: !user.isActive });
    user.isActive = !user.isActive;
    toast.success(user.isActive ? "已启用" : "已禁用");
  } catch (e) {
    toast.error(e.message);
  } finally {
    updatingIds.value.delete(user.id);
  }
};

onMounted(fetchUsers);
</script>
