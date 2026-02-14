<template>
  <div class="review-list">
    <!-- 评价统计 -->
    <div class="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="text-center">
            <div class="text-3xl sm:text-4xl font-bold text-dark">{{ stats.average }}</div>
            <StarRating :model-value="Number(stats.average)" size="sm" />
            <p class="text-sm text-gray-500 mt-1">{{ stats.total }} {{ t('review.reviewsLabel') }}</p>
          </div>
          <!-- 星级分布 -->
          <div class="flex-1 max-w-xs hidden sm:block">
            <div v-for="i in 5" :key="i" class="flex items-center gap-2 mb-1">
              <span class="text-sm w-3">{{ 6 - i }}</span>
              <StarIcon class="w-4 h-4 text-yellow-400" />
              <div class="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  class="h-full bg-yellow-400 transition-all"
                  :style="{ width: getPercentage(6 - i) + '%' }"
                ></div>
              </div>
              <span class="text-sm text-gray-500 w-8">{{ stats[6 - i] || 0 }}</span>
            </div>
          </div>
        </div>
        <!-- 筛选和排序 -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- 星级筛选 -->
          <select
            v-model="filterRating"
            class="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-dark outline-none"
          >
            <option value="">{{ t('review.allRatings') }}</option>
            <option v-for="i in 5" :key="i" :value="i">{{ i }} {{ t('review.star') }}</option>
          </select>
          <!-- 排序 -->
          <select
            v-model="sortBy"
            class="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-dark outline-none"
          >
            <option value="newest">{{ t('review.sortNewest') }}</option>
            <option value="oldest">{{ t('review.sortOldest') }}</option>
            <option value="helpful">{{ t('review.sortHelpful') }}</option>
            <option value="rating_high">{{ t('review.sortRatingHigh') }}</option>
            <option value="rating_low">{{ t('review.sortRatingLow') }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 写评价按钮 -->
    <div v-if="canReview && !showForm" class="mb-6">
      <button type="button" class="btn btn-primary" @click="showForm = true">
        <PencilIcon class="w-5 h-5 mr-2" />
        {{ t('review.writeReview') }}
      </button>
    </div>

    <!-- 评价表单 -->
    <div v-if="showForm" class="mb-8 p-4 sm:p-6 border rounded-lg bg-white">
      <h3 class="text-lg font-medium mb-4">{{ editingReview ? t('review.editReview') : t('review.writeReview') }}</h3>
      <ReviewForm
        :product-id="productId"
        :review="editingReview"
        show-cancel
        @success="onReviewSuccess"
        @cancel="cancelForm"
      />
    </div>

    <!-- 评价列表 -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="flex gap-3 mb-3">
          <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div>
            <div class="h-4 bg-gray-200 w-24 mb-2 rounded"></div>
            <div class="h-3 bg-gray-200 w-32 rounded"></div>
          </div>
        </div>
        <div class="h-4 bg-gray-200 w-full mb-2 rounded"></div>
        <div class="h-4 bg-gray-200 w-3/4 rounded"></div>
      </div>
    </div>

    <div v-else-if="reviews.length === 0" class="text-center py-12">
      <ChatBubbleLeftIcon class="w-12 h-12 mx-auto text-gray-300 mb-4" />
      <p class="text-gray-500">{{ t('review.noReviews') }}</p>
      <p v-if="canReview" class="text-sm text-gray-400 mt-2">{{ t('review.beFirstToReview') }}</p>
    </div>

    <div v-else class="space-y-0">
      <ReviewCard
        v-for="review in reviews"
        :key="review.id"
        :review="review"
        @edit="startEdit"
        @delete="confirmDelete"
        @helpful="updateHelpful"
      />
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="text-center mt-6">
      <button
        type="button"
        class="btn btn-outline"
        :disabled="isLoadingMore"
        @click="loadMore"
      >
        <span v-if="isLoadingMore">{{ t('common.loading') }}...</span>
        <span v-else>{{ t('review.loadMore') }}</span>
      </button>
    </div>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <div
        v-if="deleteConfirm"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click="deleteConfirm = null"
      >
        <div class="bg-white rounded-lg p-6 max-w-sm w-full" @click.stop>
          <h3 class="text-lg font-medium mb-2">{{ t('review.deleteConfirmTitle') }}</h3>
          <p class="text-gray-600 mb-6">{{ t('review.deleteConfirmMessage') }}</p>
          <div class="flex justify-end gap-3">
            <button type="button" class="btn btn-outline" @click="deleteConfirm = null">
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="btn bg-red-600 text-white hover:bg-red-700"
              @click="doDelete"
            >
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { StarIcon, PencilIcon, ChatBubbleLeftIcon } from '@heroicons/vue/24/solid'
import StarRating from './StarRating.vue'
import ReviewCard from './ReviewCard.vue'
import ReviewForm from './ReviewForm.vue'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

const props = defineProps({
  productId: {
    type: String,
    required: true
  },
  canReview: {
    type: Boolean,
    default: false
  }
})

const isLoading = ref(true)
const isLoadingMore = ref(false)
const reviews = ref([])
const stats = reactive({
  1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  total: 0,
  average: 0
})
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0
})

const filterRating = ref('')
const sortBy = ref('newest')
const showForm = ref(false)
const editingReview = ref(null)
const deleteConfirm = ref(null)

const hasMore = ref(false)

// 计算星级百分比
const getPercentage = (rating) => {
  if (stats.total === 0) return 0
  return Math.round((stats[rating] / stats.total) * 100)
}

// 获取评价列表
const fetchReviews = async (loadMore = false) => {
  if (loadMore) {
    isLoadingMore.value = true
  } else {
    isLoading.value = true
    pagination.page = 1
  }

  try {
    const res = await api.reviews.list(props.productId, {
      page: pagination.page,
      limit: pagination.limit,
      sort: sortBy.value,
      rating: filterRating.value || undefined
    })

    if (loadMore) {
      reviews.value.push(...res.reviews)
    } else {
      reviews.value = res.reviews
      // 更新统计
      Object.assign(stats, res.stats)
    }

    pagination.total = res.pagination.total
    pagination.pages = res.pagination.pages
    hasMore.value = pagination.page < pagination.pages
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// 加载更多
const loadMore = () => {
  pagination.page++
  fetchReviews(true)
}

// 监听筛选和排序变化
watch([filterRating, sortBy], () => {
  fetchReviews()
})

// 评价成功回调
const onReviewSuccess = (result) => {
  showForm.value = false
  editingReview.value = null
  fetchReviews()
}

// 取消表单
const cancelForm = () => {
  showForm.value = false
  editingReview.value = null
}

// 开始编辑
const startEdit = (review) => {
  editingReview.value = review
  showForm.value = true
}

// 确认删除
const confirmDelete = (review) => {
  deleteConfirm.value = review
}

// 执行删除
const doDelete = async () => {
  if (!deleteConfirm.value) return

  try {
    await api.reviews.delete(deleteConfirm.value.id)
    toast.success(t('review.deleteSuccess'))
    deleteConfirm.value = null
    fetchReviews()
  } catch (error) {
    toast.error(error.message)
  }
}

// 更新有帮助计数
const updateHelpful = ({ id, count }) => {
  const review = reviews.value.find(r => r.id === id)
  if (review) {
    review.helpfulCount = count
  }
}

onMounted(() => {
  fetchReviews()
})
</script>
