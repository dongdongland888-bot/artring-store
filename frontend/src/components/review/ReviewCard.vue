<template>
  <div class="border-b pb-6 mb-6 last:border-b-0">
    <!-- 头部信息 -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-3">
        <!-- 用户头像 -->
        <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          <img v-if="review.userAvatar" :src="review.userAvatar" alt="" class="w-full h-full object-cover" />
          <UserIcon v-else class="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ review.userName || '匿名用户' }}</span>
            <span v-if="review.isVerified" class="inline-flex items-center text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
              <CheckBadgeIcon class="w-3 h-3 mr-1" />
              {{ t('review.verifiedPurchase') }}
            </span>
            <span v-if="review.isPinned" class="inline-flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {{ t('review.pinnedReview') }}
            </span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <StarRating :model-value="review.rating" size="sm" />
            <span>{{ formatDate(review.createdAt) }}</span>
          </div>
        </div>
      </div>
      <!-- 操作菜单(自己的评价) -->
      <div v-if="isOwner" class="relative">
        <button
          type="button"
          class="p-1 hover:bg-gray-100 rounded"
          @click="showMenu = !showMenu"
        >
          <EllipsisVerticalIcon class="w-5 h-5 text-gray-400" />
        </button>
        <div
          v-if="showMenu"
          class="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[100px]"
          @click.stop="showMenu = false"
        >
          <button
            v-if="canEdit"
            type="button"
            class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
            @click="$emit('edit', review)"
          >
            {{ t('common.edit') }}
          </button>
          <button
            type="button"
            class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            @click="$emit('delete', review)"
          >
            {{ t('common.delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 评价标题 -->
    <h4 v-if="review.title" class="font-medium mb-2">{{ review.title }}</h4>

    <!-- 评价内容 -->
    <p class="text-gray-600 whitespace-pre-wrap">{{ review.content }}</p>

    <!-- 评价图片 -->
    <div v-if="review.images?.length" class="flex flex-wrap gap-2 mt-3">
      <button
        v-for="(img, index) in review.images"
        :key="index"
        type="button"
        class="w-20 h-20 rounded overflow-hidden border hover:border-dark transition-colors"
        @click="openImagePreview(index)"
      >
        <img :src="img" alt="" class="w-full h-full object-cover" />
      </button>
    </div>

    <!-- 底部操作 -->
    <div class="flex items-center justify-between mt-4 pt-3 border-t">
      <button
        type="button"
        class="inline-flex items-center gap-1 text-sm transition-colors"
        :class="helpfulMarked ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'"
        @click="toggleHelpful"
      >
        <HandThumbUpIcon class="w-4 h-4" />
        <span>{{ t('review.helpful') }} ({{ review.helpfulCount || 0 }})</span>
      </button>
    </div>

    <!-- 图片预览弹窗 -->
    <Teleport to="body">
      <div
        v-if="previewIndex !== null"
        class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
        @click="previewIndex = null"
      >
        <button
          type="button"
          class="absolute top-4 right-4 text-white hover:text-gray-300"
          @click="previewIndex = null"
        >
          <XMarkIcon class="w-8 h-8" />
        </button>
        <button
          v-if="previewIndex > 0"
          type="button"
          class="absolute left-4 text-white hover:text-gray-300"
          @click.stop="previewIndex--"
        >
          <ChevronLeftIcon class="w-10 h-10" />
        </button>
        <img
          :src="review.images[previewIndex]"
          alt=""
          class="max-w-[90vw] max-h-[90vh] object-contain"
          @click.stop
        />
        <button
          v-if="previewIndex < review.images.length - 1"
          type="button"
          class="absolute right-4 text-white hover:text-gray-300"
          @click.stop="previewIndex++"
        >
          <ChevronRightIcon class="w-10 h-10" />
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  UserIcon,
  CheckBadgeIcon,
  EllipsisVerticalIcon,
  HandThumbUpIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import StarRating from './StarRating.vue'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()

const props = defineProps({
  review: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete', 'helpful'])

const showMenu = ref(false)
const previewIndex = ref(null)
const helpfulMarked = ref(false)

// 是否是自己的评价
const isOwner = computed(() => {
  return authStore.user?.id === props.review.user?.id
})

// 是否可以编辑(7天内)
const canEdit = computed(() => {
  if (!props.review.createdAt) return false
  const daysSinceCreation = (Date.now() - new Date(props.review.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceCreation <= 7
})

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 打开图片预览
const openImagePreview = (index) => {
  previewIndex.value = index
}

// 切换有帮助
const toggleHelpful = async () => {
  try {
    // 生成访客ID
    let visitorId = localStorage.getItem('visitorId')
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('visitorId', visitorId)
    }

    const res = await api.reviews.helpful(props.review.id, visitorId)
    helpfulMarked.value = res.marked
    emit('helpful', { id: props.review.id, count: res.helpfulCount })
  } catch (error) {
    console.error('Failed to mark helpful:', error)
  }
}
</script>
