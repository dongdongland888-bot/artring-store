<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
    :class="levelClass"
  >
    <component :is="levelIcon" class="w-3.5 h-3.5" />
    {{ levelName }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { StarIcon, SparklesIcon, CrownSimple, Medal } from 'lucide-vue-next'

const props = defineProps({
  level: {
    type: String,
    default: '普通会员'
  }
})

const { t } = useI18n()

const levelConfig = {
  '普通会员': {
    class: 'bg-gray-100 text-gray-700',
    icon: StarIcon
  },
  '银卡会员': {
    class: 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700',
    icon: SparklesIcon
  },
  '金卡会员': {
    class: 'bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-800',
    icon: SparklesIcon
  },
  '黑卡会员': {
    class: 'bg-gradient-to-r from-gray-800 to-black text-white',
    icon: SparklesIcon
  }
}

const levelClass = computed(() => levelConfig[props.level]?.class || levelConfig['普通会员'].class)
const levelIcon = computed(() => levelConfig[props.level]?.icon || StarIcon)
const levelName = computed(() => t(`points.level.${props.level}`, props.level))
</script>
