<template>
  <div class="container-custom py-6 sm:py-12">
    <nav class="mb-4 sm:mb-8 text-sm hidden sm:block">
      <RouterLink to="/" class="text-gray-500 hover:text-dark">{{ t('shop.home') }}</RouterLink>
      <span class="mx-2 text-gray-400">/</span>
      <RouterLink to="/shop" class="text-gray-500 hover:text-dark">{{ t('product.productLabel') }}</RouterLink>
      <span class="mx-2 text-gray-400">/</span>
      <span>{{ product?.name }}</span>
    </nav>

    <!-- 加载中 -->
    <div v-if="isLoading" class="animate-pulse">
      <div class="lg:flex gap-12">
        <div class="lg:w-1/2">
          <div class="aspect-square bg-gray-200"></div>
        </div>
        <div class="lg:w-1/2 py-8">
          <div class="h-8 bg-gray-200 w-3/4 mb-4"></div>
          <div class="h-6 bg-gray-200 w-1/4 mb-6"></div>
          <div class="h-4 bg-gray-200 w-full mb-2"></div>
          <div class="h-4 bg-gray-200 w-2/3"></div>
        </div>
      </div>
    </div>

    <!-- 商品详情 -->
    <div v-else-if="product" class="lg:flex gap-8 xl:gap-12">
      <!-- 图片区 -->
      <div class="lg:w-1/2">
        <!-- 主图 -->
        <div class="aspect-square bg-gray-100 mb-3 sm:mb-4">
          <img
            :src="
              selectedImage?.url ||
              product.images?.[0]?.url ||
              '/placeholder.jpg'
            "
            :alt="product.name"
            class="w-full h-full object-cover"
            @error="
              (e) => {
                e.target.src = '/placeholder.jpg';
              }
            "
          />
        </div>
        <!-- 缩略图 -->
        <div v-if="product.images?.length > 1" class="flex gap-2">
          <button
            v-for="(img, index) in product.images"
            :key="img.id"
            @click="selectedImage = img"
            class="w-20 h-20 border-2 transition-colors"
            :class="
              selectedImage?.id === img.id
                ? 'border-dark'
                : 'border-transparent'
            "
          >
            <img
              :src="img.url"
              :alt="`${product.name} ${index + 1}`"
              class="w-full h-full object-cover"
              @error="
                (e) => {
                  e.target.src = '/placeholder.jpg';
                  handleImageError(img.id);
                }
              "
            />
          </button>
        </div>
      </div>

      <!-- 信息区 -->
      <div class="lg:w-1/2 pt-4 sm:pt-6 lg:pt-0">
        <h1 class="text-2xl sm:text-3xl font-serif font-bold mb-2">
          {{ product.name }}
        </h1>

        <!-- 评分 -->
        <div
          v-if="product.reviewCount > 0"
          class="flex items-center gap-2 mb-4"
        >
          <div class="flex text-accent-400">
            <StarIcon
              v-for="i in 5"
              :key="i"
              class="w-4 h-4"
              :class="i <= Math.round(product.avgRating) ? 'fill-current' : ''"
            />
          </div>
          <span class="text-sm text-gray-500">
            {{ t('product.reviewsCount', { count: product.reviewCount }) }}
          </span>
        </div>

        <!-- 价格 -->
        <div class="flex items-center gap-3 mb-6">
          <span class="text-2xl font-semibold text-accent-600">
            ${{ selectedVariant?.price || product.basePrice }}
          </span>
          <span
            v-if="product.comparePrice"
            class="text-lg text-gray-400 line-through"
          >
            ${{ product.comparePrice }}
          </span>
          <span
            v-if="product.comparePrice"
            class="bg-red-100 text-red-600 text-sm px-2 py-1"
          >
            省 ${{ (product.comparePrice - product.basePrice).toFixed(0) }}
          </span>
        </div>

        <!-- 描述 -->
        <p class="text-gray-600 leading-relaxed mb-8">
          {{ product.shortDesc || product.description }}
        </p>

        <div v-if="sizes.length > 0" class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <span class="font-medium">{{ t('product.size') }}</span>
            <button class="text-sm text-gray-500 underline">{{ t('product.sizeGuide') }}</button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="size in sizes"
              :key="size"
              @click="selectedSize = size"
              class="w-12 h-12 flex items-center justify-center border transition-colors"
              :class="[
                selectedSize === size
                  ? 'border-dark bg-dark text-white'
                  : 'hover:border-dark',
                !isSizeAvailable(size) &&
                  'opacity-50 cursor-not-allowed line-through',
              ]"
              :disabled="!isSizeAvailable(size)"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <div v-if="colors.length > 0" class="mb-8">
          <span class="font-medium block mb-3">{{ t('product.color') }}: {{ selectedColor }}</span>
          <div class="flex gap-2">
            <button
              v-for="color in colors"
              :key="color"
              @click="selectedColor = color"
              class="w-10 h-10 rounded-full border-2 transition-colors"
              :class="
                selectedColor === color ? 'border-dark' : 'border-transparent'
              "
              :style="{ backgroundColor: getColorHex(color) }"
              :title="color"
            ></button>
          </div>
        </div>

        <div class="flex items-center gap-4 mb-8">
          <span class="font-medium">{{ t('product.quantity') }}</span>
          <div class="flex items-center border rounded">
            <button
              @click="quantity = Math.max(1, quantity - 1)"
              class="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="quantity <= 1"
              aria-label="减少数量"
            >
              -
            </button>
            <input
              v-model.number="quantity"
              type="number"
              min="1"
              :max="maxQuantity"
              class="w-16 text-center border-x outline-none"
              @input="validateQuantity"
            />
            <button
              @click="increaseQuantity"
              class="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="quantity >= maxQuantity"
              aria-label="增加数量"
            >
              +
            </button>
          </div>
          <span v-if="selectedVariant" class="text-sm" :class="stockClass">
            {{ stockText }}
          </span>
        </div>

        <!-- 购买按钮 -->
        <div class="flex gap-4 mb-8">
          <button
            @click="addToCart"
            class="flex-1 btn btn-primary"
            :disabled="!canAddToCart"
          >
            {{ canAddToCart ? t('product.addToCart') : t('product.selectOption') }}
          </button>
          <button @click="toggleWishlist" class="btn btn-outline px-4">
            <HeartIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="border-t pt-6 space-y-3">
          <div class="flex items-center gap-3 text-sm text-gray-600">
            <TruckIcon class="w-5 h-5" />
            <span>{{ t('home.freeShipping') }} {{ t('home.freeShippingDesc') }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-gray-600">
            <ArrowPathIcon class="w-5 h-5" />
            <span>{{ t('home.returns30') }} {{ t('home.returns30Desc') }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-gray-600">
            <ShieldCheckIcon class="w-5 h-5" />
            <span>{{ t('home.quality') }} {{ t('home.qualityDesc') }}</span>
          </div>
        </div>
      </div>
    </div>

    <section v-if="product?.description" class="mt-10 sm:mt-20">
      <h2 class="text-xl sm:text-2xl font-serif font-bold mb-4 sm:mb-6">
        {{ t('product.detailTitle') }}
      </h2>
      <div class="prose max-w-none" v-html="product.description"></div>
    </section>

    <section v-if="relatedProducts.length > 0" class="mt-10 sm:mt-20">
      <h2 class="text-xl sm:text-2xl font-serif font-bold mb-4 sm:mb-8">
        {{ t('product.youMayLike') }}
      </h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <ProductCard v-for="p in relatedProducts" :key="p.id" :product="p" />
      </div>
    </section>

    <!-- 评价模块 -->
    <section v-if="product" class="mt-10 sm:mt-20">
      <h2 class="text-xl sm:text-2xl font-serif font-bold mb-4 sm:mb-8">
        {{ t('product.reviewsCount', { count: product.reviewCount || 0 }) }}
      </h2>
      <ReviewList :product-id="product.id" :can-review="canReview" />
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";

const { t } = useI18n();
import {
  StarIcon,
  HeartIcon,
  TruckIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from "@heroicons/vue/24/outline";
import ProductCard from "@/components/product/ProductCard.vue";
import ReviewList from "@/components/review/ReviewList.vue";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import api from "@/api";

const route = useRoute();
const toast = useToast();
const cartStore = useCartStore();
const authStore = useAuthStore();

const isLoading = ref(true);
const product = ref(null);
const relatedProducts = ref([]);
const selectedImage = ref(null);
const selectedSize = ref(null);
const selectedColor = ref(null);
const quantity = ref(1);
const imageError = ref(new Set());
const canReview = ref(false);

// 获取商品详情
const fetchProduct = async () => {
  isLoading.value = true;
  try {
    const slug = route.params.slug;
    product.value = await api.products.get(slug);
    selectedImage.value = product.value.images?.[0];

    // 默认选择第一个有库存的规格
    const availableVariant = product.value.variants?.find((v) => v.stock > 0);
    if (availableVariant) {
      selectedSize.value = availableVariant.size;
      selectedColor.value = availableVariant.color;
    }

    // 获取相关商品
    if (product.value.id) {
      relatedProducts.value = await api.products.related(product.value.id, 4);
      
      // 检查用户是否可以评价(已购买且已登录)
      if (authStore.isLoggedIn) {
        try {
          const pending = await api.reviews.pending();
          canReview.value = pending.pendingItems?.some(
            item => item.productId === product.value.id
          ) || false;
        } catch (e) {
          // 忽略错误
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch product:", error);
  } finally {
    isLoading.value = false;
  }
};

// 提取尺寸和颜色选项
const sizes = computed(() => {
  if (!product.value?.variants) return [];
  const sizeSet = new Set(
    product.value.variants.map((v) => v.size).filter(Boolean)
  );
  return Array.from(sizeSet).sort((a, b) => parseFloat(a) - parseFloat(b));
});

const colors = computed(() => {
  if (!product.value?.variants) return [];
  const colorSet = new Set(
    product.value.variants.map((v) => v.color).filter(Boolean)
  );
  return Array.from(colorSet);
});

// 选中的变体
const selectedVariant = computed(() => {
  if (!product.value?.variants) return null;
  return product.value.variants.find(
    (v) => v.size === selectedSize.value && v.color === selectedColor.value
  );
});

// 检查尺寸是否有库存
const isSizeAvailable = (size) => {
  const variant = product.value.variants?.find(
    (v) =>
      v.size === size &&
      (!selectedColor.value || v.color === selectedColor.value)
  );
  return variant && variant.stock > 0;
};

// 最大购买数量
const maxQuantity = computed(() => {
  if (!product.value) return 1;
  if (selectedVariant.value) {
    return Math.max(1, selectedVariant.value.stock);
  }
  return 999;
});

// 库存状态
const stockClass = computed(() => {
  const stock = selectedVariant.value?.stock || 0;
  if (stock === 0) return "text-red-500";
  if (stock < 10) return "text-orange-500";
  return "text-green-600";
});

const stockText = computed(() => {
  const stock = selectedVariant.value?.stock || 0;
  if (stock === 0) return "缺货";
  if (stock < 10) return `仅剩 ${stock} 件`;
  return `库存充足`;
});

// 验证数量
const validateQuantity = () => {
  if (quantity.value < 1) quantity.value = 1;
  if (quantity.value > maxQuantity.value) quantity.value = maxQuantity.value;
};

const increaseQuantity = () => {
  if (quantity.value < maxQuantity.value) {
    quantity.value++;
  } else {
    toast.warning(`最多只能购买 ${maxQuantity.value} 件`);
  }
};

// 是否可以加入购物车
const canAddToCart = computed(() => {
  if (!product.value) return false;
  if (product.value.variants?.length > 0) {
    return (
      selectedVariant.value &&
      selectedVariant.value.stock > 0 &&
      quantity.value <= selectedVariant.value.stock
    );
  }
  return true;
});

// 颜色名转hex
const colorMap = {
  金色: "#c9a050",
  银色: "#c0c0c0",
  玫瑰金: "#b76e79",
  黑色: "#1a1a1a",
  白色: "#ffffff",
};
const getColorHex = (color) => colorMap[color] || "#cccccc";

// 图片加载错误处理
const handleImageError = (imageId) => {
  imageError.value.add(imageId);
};

// 加入购物车
const addToCart = async () => {
  if (!authStore.isLoggedIn) {
    toast.warning("请先登录");
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }

  if (!canAddToCart.value) {
    if (product.value.variants?.length > 0 && !selectedVariant.value) {
      toast.warning("请选择商品规格");
    } else if (selectedVariant.value?.stock === 0) {
      toast.warning("该商品已售罄");
    } else if (quantity.value > selectedVariant.value?.stock) {
      toast.warning(`库存不足，最多可购买 ${selectedVariant.value?.stock} 件`);
    }
    return;
  }

  try {
    await cartStore.addItem(
      product.value.id,
      selectedVariant.value?.id,
      quantity.value
    );
    toast.success("已加入购物车");
    quantity.value = 1; // Reset quantity
  } catch (error) {
    toast.error(error.message);
  }
};

// 收藏
const toggleWishlist = async () => {
  if (!authStore.isLoggedIn) {
    toast.warning("请先登录");
    return;
  }
  toast.success("已添加到收藏");
};

// 监听路由变化
watch(() => route.params.slug, fetchProduct, { immediate: true });
</script>
