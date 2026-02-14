<template>
  <div class="flex items-center gap-1">
    <!-- 可交互模式 -->
    <template v-if="interactive">
      <button
        v-for="i in 5"
        :key="i"
        type="button"
        class="focus:outline-none transition-transform hover:scale-110"
        @click="setRating(i)"
        @mouseenter="hoverRating = i"
        @mouseleave="hoverRating = 0"
      >
        <StarIcon
          class="w-6 h-6 transition-colors"
          :class="getStarClass(i)"
        />
      </button>
    </template>
    <!-- 只读模式 -->
    <template v-else>
      <StarIcon
        v-for="i in 5"
        :key="i"
        :class="[
          sizeClass,
          i <= Math.round(modelValue) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        ]"
      />
    </template>
    <!-- 显示评分数值 -->
    <span v-if="showValue" class="ml-1 text-sm text-gray-600">
      {{ modelValue.toFixed(1) }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { StarIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  interactive: {
    type: Boolean,
    default: false
  },
  showValue: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
    validator: v => ['sm', 'md', 'lg'].includes(v)
  }
})

const emit = defineEmits(['update:modelValue'])

const hoverRating = ref(0)

const sizeClass = computed(() => ({
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
}[props.size]))

const getStarClass = (index) => {
  const rating = hoverRating.value || props.modelValue
  if (index <= rating) {
    return 'text-yellow-400 fill-current'
  }
  return 'text-gray-300'
}

const setRating = (rating) => {
  emit('update:modelValue', rating)
}
</script>
