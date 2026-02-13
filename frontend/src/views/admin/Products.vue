<template>
  <div>
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
    >
      <h1 class="text-2xl font-bold">{{ t('admin.productManagement') }}</h1>
      <RouterLink to="/admin/products/new" class="btn btn-primary text-sm">+ {{ t('admin.addProduct') }}</RouterLink>
    </div>

    <!-- Filters -->
    <div
      class="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3"
    >
      <input
        v-model="search"
        type="text"
        :placeholder="t('admin.searchProductPlaceholder')"
        class="input text-sm flex-1"
        @input="debouncedFetch"
      />
      <select
        v-model="filterActive"
        class="input text-sm w-auto"
        @change="fetchProducts"
      >
        <option value="">{{ t('admin.allStatus') }}</option>
        <option value="true">{{ t('admin.onSale') }}</option>
        <option value="false">{{ t('admin.offSale') }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div
      v-if="isLoading && products.length === 0"
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
            <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.product') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">{{ t('admin.category') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.price') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">{{ t('admin.variants') }}</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500">{{ t('admin.status') }}</th>
            <th class="text-right px-6 py-3 font-medium text-gray-500">{{ t('admin.operation') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr
            v-for="product in products"
            :key="product.id"
            class="hover:bg-gray-50"
            :class="{ 'opacity-50': updatingIds.has(product.id) }"
          >
            <td class="px-6 py-3">
              <div class="flex items-center gap-3">
                <img
                  :src="
                    product.images?.[0]?.url || 'https://via.placeholder.com/40'
                  "
                  class="w-10 h-10 object-cover rounded"
                />
                <div class="min-w-0">
                  <p class="font-medium truncate max-w-[200px]">
                    {{ product.name }}
                  </p>
                  <p class="text-xs text-gray-400">{{ product.slug }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-3 hidden md:table-cell text-gray-500">
              {{ product.category?.name || "-" }}
            </td>
            <td class="px-6 py-3">
              ${{ parseFloat(product.basePrice).toFixed(2) }}
            </td>
            <td class="px-6 py-3 hidden sm:table-cell text-gray-500">
              {{ product._count?.variants || 0 }}
            </td>
            <td class="px-6 py-3">
              <span
                class="inline-flex px-2 py-0.5 text-xs rounded-full"
                :class="
                  product.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                "
              >
                {{ product.isActive ? t('admin.productOnSale') : t('admin.productOffSale') }}
              </span>
            </td>
            <td class="px-6 py-3 text-right space-x-2">
              <RouterLink
                :to="`/admin/products/${product.id}/edit`"
                class="text-blue-600 hover:underline"
              >{{ t('admin.edit') }}</RouterLink>
              <button
                @click="toggleActive(product)"
                class="hover:underline"
                :class="product.isActive ? 'text-orange-600' : 'text-green-600'"
              >
                {{ product.isActive ? t('admin.productOffSale') : t('admin.productOnSale') }}
              </button>
            </td>
          </tr>
          <tr v-if="products.length === 0 && !isLoading">
            <td colspan="6" class="px-6 py-12 text-center text-gray-400">{{ t('admin.noProducts') }}</td>
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
          fetchProducts();
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
const products = ref([]);
const isLoading = ref(false);
const updatingIds = ref(new Set());
const search = ref("");
const filterActive = ref("");
const page = ref(1);
const pagination = ref({ pages: 1 });

let debounceTimer = null;
const debouncedFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    fetchProducts();
  }, 300);
};

const fetchProducts = async () => {
  isLoading.value = true;
  try {
    const params = { page: page.value, limit: 20 };
    if (search.value) params.search = search.value;
    if (filterActive.value) params.isActive = filterActive.value;
    const data = await api.admin.products(params);
    products.value = data.products;
    pagination.value = data.pagination;
  } catch (e) {
    toast.error(e.message);
  } finally {
    isLoading.value = false;
  }
};

const toggleActive = async (product) => {
  const action = product.isActive ? t('admin.productOffSale') : t('admin.productOnSale');
  if (!confirm(t('admin.confirmToggle', { action }))) return;

  updatingIds.value.add(product.id);
  try {
    await api.admin.updateProduct(product.id, { isActive: !product.isActive });
    product.isActive = !product.isActive;
    toast.success(product.isActive ? t('admin.productOnSale') : t('admin.productOffSale'));
  } catch (e) {
    toast.error(e.message);
  } finally {
    updatingIds.value.delete(product.id);
  }
};

onMounted(fetchProducts);
</script>
