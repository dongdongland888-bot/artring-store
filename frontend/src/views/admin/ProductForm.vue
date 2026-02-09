<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <RouterLink to="/admin/products" class="text-gray-500 hover:text-dark"
        >&larr; 返回</RouterLink
      >
      <h1 class="text-2xl font-bold">{{ isEdit ? "编辑商品" : "添加商品" }}</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Info -->
      <div class="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 class="font-semibold text-lg mb-2">基本信息</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">商品名称 *</label>
            <input
              v-model="form.name"
              type="text"
              class="input"
              required
              @input="autoSlug"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Slug *</label>
            <input v-model="form.slug" type="text" class="input" required />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">简短描述</label>
          <input v-model="form.shortDesc" type="text" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">详细描述</label>
          <textarea
            v-model="form.description"
            rows="4"
            class="input"
          ></textarea>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">材质</label>
            <input v-model="form.material" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">风格</label>
            <input v-model="form.style" type="text" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">分类</label>
            <select v-model="form.categoryId" class="input">
              <option value="">无分类</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="flex items-end">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.isFeatured"
                type="checkbox"
                class="rounded"
              />
              <span class="text-sm">特色商品</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div class="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 class="font-semibold text-lg mb-2">价格</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">基础价 *</label>
            <input
              v-model.number="form.basePrice"
              type="number"
              step="0.01"
              class="input"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">原价 (划线价)</label>
            <input
              v-model.number="form.comparePrice"
              type="number"
              step="0.01"
              class="input"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">成本价</label>
            <input
              v-model.number="form.costPrice"
              type="number"
              step="0.01"
              class="input"
            />
          </div>
        </div>
      </div>

      <!-- Variants (only in edit mode or created inline for new) -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-lg">变体 (尺寸/颜色)</h2>
          <button
            type="button"
            @click="addVariant"
            class="text-sm text-blue-600 hover:underline"
          >
            + 添加变体
          </button>
        </div>
        <div
          v-if="form.variants.length === 0"
          class="text-gray-400 text-sm py-4 text-center"
        >
          暂无变体
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(v, i) in form.variants"
            :key="i"
            class="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end border-b pb-3"
          >
            <div>
              <label class="text-xs text-gray-500">SKU</label>
              <input v-model="v.sku" type="text" class="input text-sm py-2" />
            </div>
            <div>
              <label class="text-xs text-gray-500">尺寸</label>
              <input v-model="v.size" type="text" class="input text-sm py-2" />
            </div>
            <div>
              <label class="text-xs text-gray-500">颜色</label>
              <input v-model="v.color" type="text" class="input text-sm py-2" />
            </div>
            <div>
              <label class="text-xs text-gray-500">价格</label>
              <input
                v-model.number="v.price"
                type="number"
                step="0.01"
                class="input text-sm py-2"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500">库存</label>
              <input
                v-model.number="v.stock"
                type="number"
                class="input text-sm py-2"
              />
            </div>
            <div>
              <button
                type="button"
                @click="removeVariant(i)"
                class="text-red-500 hover:underline text-sm py-2"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Images -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-lg">商品图片</h2>
          <button
            type="button"
            @click="addImage"
            class="text-sm text-blue-600 hover:underline"
          >
            + 添加图片
          </button>
        </div>
        <div
          v-if="form.images.length === 0"
          class="text-gray-400 text-sm py-4 text-center"
        >
          暂无图片
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="(img, i) in form.images"
            :key="i"
            class="flex items-center gap-3 border rounded p-3"
          >
            <img
              v-if="img.url"
              :src="img.url"
              class="w-16 h-16 object-cover rounded flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <input
                v-model="img.url"
                type="text"
                placeholder="图片 URL"
                class="input text-sm py-1.5 mb-1"
              />
              <input
                v-model="img.alt"
                type="text"
                placeholder="Alt 文字"
                class="input text-sm py-1.5"
              />
            </div>
            <button
              type="button"
              @click="removeImage(i)"
              class="text-red-500 hover:underline text-sm flex-shrink-0"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex justify-end gap-3">
        <RouterLink to="/admin/products" class="btn btn-outline"
          >取消</RouterLink
        >
        <button type="submit" class="btn btn-primary" :disabled="isSaving">
          {{ isSaving ? "保存中..." : isEdit ? "保存修改" : "创建商品" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/api";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const isEdit = computed(() => !!route.params.id);
const isSaving = ref(false);
const categories = ref([]);

// Track original variants and images for comparison in edit mode
const originalVariants = ref([]);
const originalImages = ref([]);

const form = reactive({
  name: "",
  slug: "",
  description: "",
  shortDesc: "",
  material: "",
  style: "",
  basePrice: null,
  comparePrice: null,
  costPrice: null,
  categoryId: "",
  isFeatured: false,
  variants: [],
  images: [],
});

const autoSlug = () => {
  if (!isEdit.value) {
    form.slug = form.name
      .toLowerCase()
      .replace(/[\s]+/g, "-")
      .replace(/[^\w\-\u4e00-\u9fa5]+/g, "");
  }
};

const addVariant = () => {
  form.variants.push({
    sku: "",
    size: "",
    color: "",
    price: form.basePrice || 0,
    stock: 0,
  });
};

const removeVariant = (i) => form.variants.splice(i, 1);

const addImage = () => {
  form.images.push({ url: "", alt: "" });
};

const removeImage = (i) => form.images.splice(i, 1);

const handleSubmit = async () => {
  isSaving.value = true;
  try {
    const data = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      shortDesc: form.shortDesc,
      material: form.material || null,
      style: form.style || null,
      basePrice: parseFloat(form.basePrice),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
      costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
      categoryId: form.categoryId || null,
      isFeatured: form.isFeatured,
    };

    if (isEdit.value) {
      // Update product basic info
      await api.admin.updateProduct(route.params.id, data);

      // Update variants - delete removed, update existing, create new
      const existingVariantIds = new Set(
        form.variants.filter((v) => v.id).map((v) => v.id)
      );
      const originalVariantIds = new Set(originalVariants.map((v) => v.id));

      // Delete removed variants
      for (const id of originalVariantIds) {
        if (!existingVariantIds.has(id)) {
          await api.admin.deleteVariant(route.params.id, id);
        }
      }

      // Update or create variants
      for (const variant of form.variants) {
        if (!variant.sku) continue;

        const variantData = {
          sku: variant.sku,
          size: variant.size || null,
          color: variant.color || null,
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock) || 0,
        };

        if (variant.id) {
          // Update existing
          await api.admin.updateVariant(
            route.params.id,
            variant.id,
            variantData
          );
        } else {
          // Create new
          await api.admin.createVariant(route.params.id, variantData);
        }
      }

      // Update images - delete removed, create new
      const existingImageIds = new Set(
        form.images.filter((img) => img.id).map((img) => img.id)
      );
      const originalImageIds = new Set(originalImages.map((img) => img.id));

      // Delete removed images
      for (const id of originalImageIds) {
        if (!existingImageIds.has(id)) {
          await api.admin.deleteImage(route.params.id, id);
        }
      }

      // Create new images
      for (const img of form.images) {
        if (!img.url || img.id) continue;
        await api.admin.addImage(route.params.id, {
          url: img.url,
          alt: img.alt || form.name,
        });
      }

      toast.success("商品已更新");
    } else {
      // Create with variants and images inline
      data.variants = form.variants.filter((v) => v.sku);
      data.images = form.images.filter((img) => img.url);
      await api.admin.createProduct(data);
      toast.success("商品已创建");
    }
    router.push("/admin/products");
  } catch (e) {
    toast.error(e.message);
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  try {
    categories.value = await api.categories.list();
  } catch (e) {
    /* ignore */
  }

  if (isEdit.value) {
    try {
      const product = await api.admin.product(route.params.id);

      // Store original data for comparison
      originalVariants.value = product.variants.map((v) => ({ ...v }));
      originalImages.value = product.images.map((img) => ({ ...img }));

      Object.assign(form, {
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        shortDesc: product.shortDesc || "",
        material: product.material || "",
        style: product.style || "",
        basePrice: parseFloat(product.basePrice),
        comparePrice: product.comparePrice
          ? parseFloat(product.comparePrice)
          : null,
        costPrice: product.costPrice ? parseFloat(product.costPrice) : null,
        categoryId: product.categoryId || "",
        isFeatured: product.isFeatured,
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size || "",
          color: v.color || "",
          price: parseFloat(v.price),
          stock: v.stock,
        })),
        images: product.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt || "",
        })),
      });
    } catch (e) {
      toast.error("加载商品失败");
      router.push("/admin/products");
    }
  }
});
</script>
