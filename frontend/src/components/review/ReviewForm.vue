<template>
  <form @submit.prevent="submitReview" class="space-y-6">
    <!-- 星级评分 -->
    <div>
      <label class="block text-sm font-medium mb-2">{{ t('review.rating') }} <span class="text-red-500">*</span></label>
      <div class="flex items-center gap-3">
        <StarRating v-model="form.rating" interactive />
        <span class="text-sm text-gray-500">
          {{ ratingText }}
        </span>
      </div>
      <p v-if="errors.rating" class="mt-1 text-sm text-red-500">{{ errors.rating }}</p>
    </div>

    <!-- 评价标题 -->
    <div>
      <label class="block text-sm font-medium mb-2">{{ t('review.title') }}</label>
      <input
        v-model="form.title"
        type="text"
        maxlength="100"
        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-dark focus:border-dark outline-none"
        :placeholder="t('review.titlePlaceholder')"
      />
    </div>

    <!-- 评价内容 -->
    <div>
      <label class="block text-sm font-medium mb-2">{{ t('review.content') }}</label>
      <textarea
        v-model="form.content"
        rows="4"
        maxlength="1000"
        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-dark focus:border-dark outline-none resize-none"
        :placeholder="t('review.contentPlaceholder')"
      ></textarea>
      <p class="mt-1 text-sm text-gray-500">{{ form.content?.length || 0 }}/1000</p>
    </div>

    <!-- 上传图片 -->
    <div>
      <label class="block text-sm font-medium mb-2">
        {{ t('review.uploadImages') }}
        <span class="text-gray-500 font-normal">({{ t('review.uploadImagesHint') }})</span>
      </label>
      <div class="flex flex-wrap gap-2">
        <!-- 已上传图片 -->
        <div
          v-for="(img, index) in form.images"
          :key="index"
          class="relative w-20 h-20 rounded overflow-hidden border group"
        >
          <img :src="img" alt="" class="w-full h-full object-cover" />
          <button
            type="button"
            class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            @click="removeImage(index)"
          >
            <XMarkIcon class="w-6 h-6 text-white" />
          </button>
        </div>
        <!-- 上传按钮 -->
        <label
          v-if="form.images.length < 5"
          class="w-20 h-20 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:border-dark transition-colors"
        >
          <PlusIcon class="w-6 h-6 text-gray-400" />
          <span class="text-xs text-gray-400 mt-1">{{ t('review.addImage') }}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="handleImageUpload"
          />
        </label>
      </div>
    </div>

    <!-- 积分提示 -->
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p class="text-sm text-yellow-800">
        <span class="font-medium">{{ t('review.pointsHint') }}:</span>
        {{ t('review.textReviewPoints') }}, {{ t('review.imageReviewPoints') }}
      </p>
    </div>

    <!-- 提交按钮 -->
    <div class="flex justify-end gap-3">
      <button
        v-if="showCancel"
        type="button"
        class="btn btn-outline"
        @click="$emit('cancel')"
      >
        {{ t('common.cancel') }}
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="isSubmitting || !form.rating"
      >
        <span v-if="isSubmitting">{{ t('common.submitting') }}...</span>
        <span v-else>{{ isEditing ? t('common.update') : t('review.submitReview') }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { XMarkIcon, PlusIcon } from '@heroicons/vue/24/outline'
import StarRating from './StarRating.vue'
import api from '@/api'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  productId: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    default: null
  },
  review: {
    type: Object,
    default: null // 编辑时传入现有评价
  },
  showCancel: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['success', 'cancel'])

const isSubmitting = ref(false)
const isEditing = computed(() => !!props.review)

const form = reactive({
  rating: props.review?.rating || 0,
  title: props.review?.title || '',
  content: props.review?.content || '',
  images: props.review?.images || []
})

const errors = reactive({
  rating: ''
})

// 监听review prop变化
watch(() => props.review, (newReview) => {
  if (newReview) {
    form.rating = newReview.rating || 0
    form.title = newReview.title || ''
    form.content = newReview.content || ''
    form.images = newReview.images || []
  }
}, { immediate: true })

// 评分文字
const ratingText = computed(() => {
  const texts = ['', t('review.rating1'), t('review.rating2'), t('review.rating3'), t('review.rating4'), t('review.rating5')]
  return texts[form.rating] || ''
})

// 处理图片上传
const handleImageUpload = async (event) => {
  const files = Array.from(event.target.files)
  const maxFiles = 5 - form.images.length

  if (files.length > maxFiles) {
    toast.warning(t('review.maxImagesWarning'))
    return
  }

  for (const file of files.slice(0, maxFiles)) {
    // 检查文件大小 (最大5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning(t('review.imageSizeWarning'))
      continue
    }

    try {
      // 创建 FormData 上传
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      form.images.push(data.url)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(t('review.uploadFailed'))
    }
  }

  // 清空input
  event.target.value = ''
}

// 移除图片
const removeImage = (index) => {
  form.images.splice(index, 1)
}

// 验证表单
const validate = () => {
  errors.rating = ''

  if (!form.rating || form.rating < 1 || form.rating > 5) {
    errors.rating = t('review.ratingRequired')
    return false
  }

  return true
}

// 提交评价
const submitReview = async () => {
  if (!validate()) return

  isSubmitting.value = true

  try {
    const data = {
      productId: props.productId,
      orderId: props.orderId,
      rating: form.rating,
      title: form.title || undefined,
      content: form.content || undefined,
      images: form.images.length > 0 ? form.images : undefined
    }

    let result
    if (isEditing.value) {
      result = await api.reviews.update(props.review.id, data)
      toast.success(t('review.updateSuccess'))
    } else {
      result = await api.reviews.create(data)
      toast.success(t('review.createSuccess'))

      // 显示积分奖励
      if (result.pointsEarned > 0) {
        toast.info(t('review.pointsEarned', { points: result.pointsEarned }))
      }
    }

    emit('success', result)

    // 重置表单
    if (!isEditing.value) {
      form.rating = 0
      form.title = ''
      form.content = ''
      form.images = []
    }
  } catch (error) {
    toast.error(error.message || t('review.submitFailed'))
  } finally {
    isSubmitting.value = false
  }
}
</script>
