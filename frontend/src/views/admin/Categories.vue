<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">分类管理</h1>

    <!-- Add/Edit Form -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="font-semibold mb-4">
        {{ editingId ? "编辑分类" : "添加分类" }}
      </h2>
      <form
        @submit.prevent="handleSubmit"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label class="block text-sm font-medium mb-1">名称 *</label>
          <input
            v-model="form.name"
            type="text"
            class="input text-sm"
            required
            @input="autoSlug"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Slug *</label>
          <input
            v-model="form.slug"
            type="text"
            class="input text-sm"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">描述</label>
          <input v-model="form.description" type="text" class="input text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">排序</label>
          <input
            v-model.number="form.sortOrder"
            type="number"
            class="input text-sm"
          />
        </div>
        <div class="flex gap-2">
          <button
            type="submit"
            class="btn btn-primary text-sm flex-1"
            :disabled="isSaving"
          >
            {{ editingId ? "保存" : "添加" }}
          </button>
          <button
            v-if="editingId"
            type="button"
            @click="cancelEdit"
            class="btn btn-outline text-sm"
          >
            取消
          </button>
        </div>
      </form>
    </div>

    <!-- List -->
    <div class="bg-white rounded-lg shadow-sm overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 font-medium text-gray-500">名称</th>
            <th
              class="text-left px-6 py-3 font-medium text-gray-500 hidden sm:table-cell"
            >
              Slug
            </th>
            <th
              class="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell"
            >
              描述
            </th>
            <th class="text-left px-6 py-3 font-medium text-gray-500">排序</th>
            <th class="text-left px-6 py-3 font-medium text-gray-500">状态</th>
            <th class="text-right px-6 py-3 font-medium text-gray-500">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="cat in categories" :key="cat.id" class="hover:bg-gray-50">
            <td class="px-6 py-3 font-medium">{{ cat.name }}</td>
            <td class="px-6 py-3 hidden sm:table-cell text-gray-500">
              {{ cat.slug }}
            </td>
            <td
              class="px-6 py-3 hidden md:table-cell text-gray-500 max-w-[200px] truncate"
            >
              {{ cat.description || "-" }}
            </td>
            <td class="px-6 py-3">{{ cat.sortOrder }}</td>
            <td class="px-6 py-3">
              <span
                class="inline-flex px-2 py-0.5 text-xs rounded-full"
                :class="
                  cat.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                "
              >
                {{ cat.isActive ? "启用" : "禁用" }}
              </span>
            </td>
            <td class="px-6 py-3 text-right space-x-2">
              <button
                @click="startEdit(cat)"
                class="text-blue-600 hover:underline"
              >
                编辑
              </button>
              <button
                @click="toggleActive(cat)"
                class="hover:underline"
                :class="cat.isActive ? 'text-orange-600' : 'text-green-600'"
              >
                {{ cat.isActive ? "禁用" : "启用" }}
              </button>
            </td>
          </tr>
          <tr v-if="categories.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-gray-400">
              暂无分类
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useToast } from "vue-toastification";
import api from "@/api";

const toast = useToast();
const categories = ref([]);
const editingId = ref(null);
const isSaving = ref(false);

const form = reactive({
  name: "",
  slug: "",
  description: "",
  sortOrder: 0,
});

const autoSlug = () => {
  if (!editingId.value) {
    form.slug = form.name
      .toLowerCase()
      .replace(/[\s]+/g, "-")
      .replace(/[^\w\-\u4e00-\u9fa5]+/g, "");
  }
};

const resetForm = () => {
  form.name = "";
  form.slug = "";
  form.description = "";
  form.sortOrder = 0;
  editingId.value = null;
};

const startEdit = (cat) => {
  editingId.value = cat.id;
  form.name = cat.name;
  form.slug = cat.slug;
  form.description = cat.description || "";
  form.sortOrder = cat.sortOrder;
};

const cancelEdit = () => resetForm();

const handleSubmit = async () => {
  isSaving.value = true;
  try {
    const data = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      sortOrder: form.sortOrder,
    };
    if (editingId.value) {
      await api.admin.updateCategory(editingId.value, data);
      toast.success("分类已更新");
    } else {
      await api.admin.createCategory(data);
      toast.success("分类已创建");
    }
    resetForm();
    await fetchCategories();
  } catch (e) {
    toast.error(e.message);
  } finally {
    isSaving.value = false;
  }
};

const toggleActive = async (cat) => {
  const action = cat.isActive ? "禁用" : "启用";
  if (!confirm(`确定要${action}该分类吗？`)) return;

  try {
    await api.admin.updateCategory(cat.id, { isActive: !cat.isActive });
    cat.isActive = !cat.isActive;
    toast.success(cat.isActive ? "已启用" : "已禁用");
  } catch (e) {
    toast.error(e.message);
  }
};

const fetchCategories = async () => {
  try {
    categories.value = await api.categories.list();
  } catch (e) {
    console.error(e);
  }
};

onMounted(fetchCategories);
</script>
