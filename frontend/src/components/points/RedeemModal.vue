<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="fixed inset-0 bg-black/50" />
        <div class="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-lg font-semibold">{{ t('points.redeemTitle') }}</h3>
            <button @click="$emit('close')" class="p-1 hover:bg-gray-100 rounded-full">
              <XIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-4 overflow-y-auto max-h-[60vh]">
            <!-- Coupon Info -->
            <div class="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 mb-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-2xl font-bold text-primary-600">
                  <template v-if="coupon.type === 'PERCENTAGE'">{{ coupon.value }}%</template>
                  <template v-else-if="coupon.type === 'FIXED'">${{ coupon.value }}</template>
                  <template v-else>{{ t('points.freeShipping') }}</template>
                </span>
                <span class="text-sm text-gray-500">{{ coupon.code }}</span>
              </div>
              <p class="text-sm text-gray-600">
                <template v-if="coupon.minPurchase">
                  {{ t('points.minPurchase', { amount: coupon.minPurchase }) }}
                </template>
                <template v-else>{{ t('points.noMinPurchase') }}</template>
              </p>
              <p class="text-xs text-gray-400 mt-1">
                {{ t('points.validUntil') }}: {{ formatDate(coupon.endDate) }}
              </p>
            </div>

            <!-- Points Cost -->
            <div class="flex items-center justify-between py-3 border-t border-b">
              <span class="text-gray-600">{{ t('points.costLabel') }}</span>
              <span class="text-xl font-bold text-orange-500">
                {{ coupon.pointsCost }} {{ t('points.unit') }}
              </span>
            </div>

            <!-- Current Balance -->
            <div class="flex items-center justify-between py-3">
              <span class="text-gray-600">{{ t('points.currentBalance') }}</span>
              <span class="font-medium">{{ currentBalance }} {{ t('points.unit') }}</span>
            </div>

            <!-- After Redeem -->
            <div class="flex items-center justify-between py-3 border-t">
              <span class="text-gray-600">{{ t('points.afterRedeem') }}</span>
              <span class="font-medium" :class="canRedeem ? 'text-green-600' : 'text-red-500'">
                {{ currentBalance - coupon.pointsCost }} {{ t('points.unit') }}
              </span>
            </div>

            <!-- Insufficient Points Warning -->
            <div v-if="!canRedeem" class="mt-4 p-3 bg-red-50 rounded-lg text-red-600 text-sm">
              {{ t('points.insufficientPoints', { needed: coupon.pointsCost - currentBalance }) }}
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t bg-gray-50">
            <button
              @click="handleRedeem"
              :disabled="!canRedeem || redeeming"
              class="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <template v-if="redeeming">{{ t('common.loading') }}</template>
              <template v-else>{{ t('points.confirmRedeem') }}</template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { XIcon } from 'lucide-vue-next'
import api from '@/api'

const props = defineProps({
  show: Boolean,
  coupon: {
    type: Object,
    required: true
  },
  currentBalance: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'success'])

const { t } = useI18n()
const redeeming = ref(false)

const canRedeem = computed(() => props.currentBalance >= props.coupon.pointsCost)

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const handleRedeem = async () => {
  if (!canRedeem.value || redeeming.value) return
  
  redeeming.value = true
  try {
    const result = await api.points.redeem(props.coupon.id)
    emit('success', result)
    emit('close')
  } catch (error) {
    alert(error.message)
  } finally {
    redeeming.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
