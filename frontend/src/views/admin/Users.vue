<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('admin.userManagement') }}</h1>

    <!-- Filters -->
    <div
      class="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3"
    >
      <input
        v-model="search"
        type="text"
        :placeholder="t('admin.searchUserPlaceholder')"
        class="input text-sm flex-1"
        @input="debouncedFetch"
      />
      <select
        v-model="filterRole"
        class="input text-sm w-auto"
        @change="fetchUsers"
      >
        <option value="">{{ t('admin.allRoles') }}</option>
        <option value="CUSTOMER">{{ t('admin.roleCustomer') }}</option>
        <option value="ADMIN">{{ t('admin.roleAdmin') }}</option>
        <option value="SUPER_ADMIN">{{ t('admin.roleSuperAdmin') }}</option>
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
      <p class="text-gray-400">{{ t('admin.loading') }}</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-lg shadow-sm overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.userColumn') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">{{ t('admin.roleColumn') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">{{ t('admin.orderCount') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.status') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">{{ t('admin.registeredAt') }}</th>
            <th class="text-right px-6 py-3 font-medium text-gray-500">{{ t('admin.actions') }}</th>
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
                {{ user.isActive ? t('admin.active') : t('admin.disabled') }}
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
                <option value="CUSTOMER">{{ t('admin.roleCustomer') }}</option>
                <option value="ADMIN">{{ t('admin.roleAdmin') }}</option>
              </select>
              <button
                @click="toggleActive(user)"
                class="hover:underline text-sm"
                :class="user.isActive ? 'text-red-600' : 'text-green-600'"
              >
                {{ user.isActive ? t('admin.disabled') : t('admin.enabled') }}
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-gray-400">{{ t('admin.noUsers') }}</td>
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
import { useI18n } from "vue-i18n";
import { useToast } from "vue-toastification";
import api from "@/api";

const { t } = useI18n();
const toast = useToast();
const users = ref([]);
const isLoading = ref(false);
const updatingIds = ref(new Set());
const search = ref("");
const filterRole = ref("");
const page = ref(1);
const pagination = ref({ pages: 1 });

const roleMap = {
  CUSTOMER: { key: "roleCustomer", cls: "bg-gray-100 text-gray-700" },
  ADMIN: { key: "roleAdmin", cls: "bg-blue-100 text-blue-700" },
  SUPER_ADMIN: { key: "roleSuperAdmin", cls: "bg-purple-100 text-purple-700" },
};
const roleLabel = (r) => (roleMap[r] ? t("admin." + roleMap[r].key) : r);
const roleClass = (r) => roleMap[r]?.cls || "";
const formatDate = (d) => new Date(d).toLocaleDateString(undefined);

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
  if (!confirm(t('admin.confirmRoleChange', { role: roleLabel(role) }))) {
    return;
  }

  updatingIds.value.add(user.id);
  try {
    await api.admin.updateUser(user.id, { role });
    user.role = role;
    toast.success(t('admin.roleUpdated'));
  } catch (e) {
    toast.error(e.message);
  } finally {
    updatingIds.value.delete(user.id);
  }
};

const toggleActive = async (user) => {
  const action = user.isActive ? t('admin.disabled') : t('admin.enabled');
  if (!confirm(t('admin.confirmToggleUser', { action }))) return;

  updatingIds.value.add(user.id);
  try {
    await api.admin.updateUser(user.id, { isActive: !user.isActive });
    user.isActive = !user.isActive;
    toast.success(user.isActive ? t('admin.userEnabled') : t('admin.userDisabled'));
  } catch (e) {
    toast.error(e.message);
  } finally {
    updatingIds.value.delete(user.id);
  }
};

onMounted(fetchUsers);
</script>
