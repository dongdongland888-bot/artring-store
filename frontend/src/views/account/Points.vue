<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('points.title') }}</h1>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
    </div>

    <template v-else>
      <!-- Points Overview Card -->
      <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <p class="text-primary-100 text-sm">{{ t('points.currentBalance') }}</p>
            <p class="text-4xl font-bold mt-1">
              {{ pointsInfo.balance }}
              <span class="text-lg font-normal">{{ t('points.unit') }}</span>
            </p>
          </div>
          <PointsBadge :level="pointsInfo.level?.name" class="!bg-white/20 !text-white" />
        </div>

        <!-- Level Progress -->
        <div v-if="pointsInfo.nextLevel" class="mt-4">
          <div class="flex items-center justify-between text-sm mb-2">
            <span>{{ pointsInfo.level?.name }}</span>
            <span>{{ pointsInfo.nextLevel.name }}</span>
          </div>
          <div class="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              class="h-full bg-white rounded-full transition-all duration-500"
              :style="{ width: `${pointsInfo.nextLevel.progress}%` }"
            />
          </div>
          <p class="text-primary-100 text-xs mt-2">
            {{ t('points.needMorePoints', { points: pointsInfo.nextLevel.pointsNeeded }) }}
          </p>
        </div>
        <div v-else class="mt-4 text-primary-100 text-sm">
          {{ t('points.maxLevelReached') }}
        </div>
      </div>

      <!-- Level Benefits -->
      <div class="bg-white rounded-xl border p-4 mb-6">
        <h3 class="font-semibold mb-3">{{ t('points.currentBenefits') }}</h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="benefit in pointsInfo.level?.benefits"
            :key="benefit"
            class="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm"
          >
            {{ benefit }}
          </span>
          <span v-if="!pointsInfo.level?.benefits?.length" class="text-gray-400 text-sm">
            {{ t('points.noBenefits') }}
          </span>
        </div>
        <div v-if="pointsInfo.level?.discount < 1" class="mt-3 text-sm text-gray-600">
          {{ t('points.discountInfo', { discount: Math.round((1 - pointsInfo.level?.discount) * 100) }) }}
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-white rounded-xl border p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ pointsInfo.totalEarned }}</p>
          <p class="text-gray-500 text-sm">{{ t('points.totalEarned') }}</p>
        </div>
        <div class="bg-white rounded-xl border p-4 text-center">
          <p class="text-2xl font-bold text-orange-500">{{ pointsInfo.totalSpent }}</p>
          <p class="text-gray-500 text-sm">{{ t('points.totalSpent') }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b mb-4">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition"
          :class="activeTab === tab.id
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          {{ t(tab.label) }}
        </button>
      </div>

      <!-- Points History -->
      <div v-if="activeTab === 'history'">
        <div v-if="transactions.length === 0" class="text-center py-8 text-gray-400">
          {{ t('points.noHistory') }}
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="tx in transactions"
            :key="tx.id"
            class="flex items-center justify-between p-4 bg-white rounded-xl border"
          >
            <div>
              <p class="font-medium">{{ tx.description || getTypeLabel(tx.type) }}</p>
              <p class="text-gray-400 text-xs mt-1">{{ formatDate(tx.createdAt) }}</p>
            </div>
            <span
              class="font-bold"
              :class="tx.amount > 0 ? 'text-green-600' : 'text-red-500'"
            >
              {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }}
            </span>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="flex justify-center gap-2 mt-6">
          <button
            v-for="page in pagination.totalPages"
            :key="page"
            @click="loadHistory(page)"
            class="w-8 h-8 rounded-full text-sm"
            :class="pagination.page === page
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'"
          >
            {{ page }}
          </button>
        </div>
      </div>

      <!-- Redeemable Coupons -->
      <div v-if="activeTab === 'redeem'">
        <div v-if="coupons.length === 0" class="text-center py-8 text-gray-400">
          {{ t('points.noCouponsAvailable') }}
        </div>
        <div v-else class="grid gap-4 sm:grid-cols-2">
          <div
            v-for="coupon in coupons"
            :key="coupon.id"
            class="bg-white rounded-xl border overflow-hidden"
            :class="{ 'opacity-60': !coupon.canRedeem }"
          >
            <div class="bg-gradient-to-r from-orange-50 to-orange-100 p-4">
              <div class="text-2xl font-bold text-orange-600">
                <template v-if="coupon.type === 'PERCENTAGE'">{{ coupon.value }}% OFF</template>
                <template v-else-if="coupon.type === 'FIXED'">${{ coupon.value }} OFF</template>
                <template v-else>{{ t('points.freeShipping') }}</template>
              </div>
              <p class="text-sm text-gray-500 mt-1">{{ coupon.code }}</p>
            </div>
            <div class="p-4">
              <p class="text-sm text-gray-600 mb-3">
                <template v-if="coupon.minPurchase">
                  {{ t('points.minPurchase', { amount: coupon.minPurchase }) }}
                </template>
                <template v-else>{{ t('points.noMinPurchase') }}</template>
              </p>
              <div class="flex items-center justify-between">
                <span class="font-medium text-orange-500">
                  {{ coupon.pointsCost }} {{ t('points.unit') }}
                </span>
                <button
                  @click="openRedeemModal(coupon)"
                  :disabled="!coupon.canRedeem"
                  class="px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ coupon.canRedeem ? t('points.redeem') : t('points.insufficientShort') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Points Rules -->
      <div v-if="activeTab === 'rules'" class="bg-white rounded-xl border p-4">
        <h3 class="font-semibold mb-4">{{ t('points.earnRules') }}</h3>
        <ul class="space-y-3 text-sm text-gray-600">
          <li class="flex items-center gap-2">
            <span class="w-2 h-2 bg-primary-500 rounded-full" />
            {{ t('points.rulePurchase') }}
          </li>
          <li class="flex items-center gap-2">
            <span class="w-2 h-2 bg-primary-500 rounded-full" />
            {{ t('points.ruleReviewText') }}
          </li>
          <li class="flex items-center gap-2">
            <span class="w-2 h-2 bg-primary-500 rounded-full" />
            {{ t('points.ruleReviewImage') }}
          </li>
          <li class="flex items-center gap-2">
            <span class="w-2 h-2 bg-primary-500 rounded-full" />
            {{ t('points.ruleRegister') }}
          </li>
          <li class="flex items-center gap-2">
            <span class="w-2 h-2 bg-primary-500 rounded-full" />
            {{ t('points.ruleInvite') }}
          </li>
          <li class="flex items-center gap-2">
            <span class="w-2 h-2 bg-yellow-500 rounded-full" />
            {{ t('points.ruleBirthday') }}
          </li>
        </ul>

        <h3 class="font-semibold mt-6 mb-4">{{ t('points.levelRules') }}</h3>
        <div class="space-y-2">
          <div
            v-for="level in MEMBER_LEVELS"
            :key="level.name"
            class="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div>
              <span class="font-medium">{{ level.name }}</span>
              <span class="text-gray-400 text-sm ml-2">{{ level.minPoints }}+</span>
            </div>
            <span class="text-primary-600">
              {{ level.discount < 1 ? `${Math.round((1 - level.discount) * 100)}% OFF` : '-' }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Redeem Modal -->
    <RedeemModal
      :show="showRedeemModal"
      :coupon="selectedCoupon"
      :currentBalance="pointsInfo.balance"
      @close="showRedeemModal = false"
      @success="handleRedeemSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api'
import PointsBadge from '@/components/points/PointsBadge.vue'
import RedeemModal from '@/components/points/RedeemModal.vue'

const { t } = useI18n()

const loading = ref(true)
const activeTab = ref('history')
const pointsInfo = ref({
  balance: 0,
  totalEarned: 0,
  totalSpent: 0,
  level: { name: '普通会员', discount: 1, benefits: [] },
  nextLevel: null
})
const transactions = ref([])
const coupons = ref([])
const pagination = ref({ page: 1, totalPages: 1 })
const showRedeemModal = ref(false)
const selectedCoupon = ref({})

const tabs = [
  { id: 'history', label: 'points.historyTab' },
  { id: 'redeem', label: 'points.redeemTab' },
  { id: 'rules', label: 'points.rulesTab' }
]

const MEMBER_LEVELS = [
  { name: '普通会员', minPoints: 0, discount: 1.00 },
  { name: '银卡会员', minPoints: 1000, discount: 0.95 },
  { name: '金卡会员', minPoints: 5000, discount: 0.90 },
  { name: '黑卡会员', minPoints: 20000, discount: 0.85 }
]

const getTypeLabel = (type) => {
  const labels = {
    PURCHASE: t('points.typePurchase'),
    REVIEW_TEXT: t('points.typeReviewText'),
    REVIEW_IMAGE: t('points.typeReviewImage'),
    REGISTER: t('points.typeRegister'),
    BIRTHDAY: t('points.typeBirthday'),
    INVITE: t('points.typeInvite'),
    REDEEM: t('points.typeRedeem'),
    ADMIN_ADJUST: t('points.typeAdminAdjust'),
    EXPIRED: t('points.typeExpired')
  }
  return labels[type] || type
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const loadBalance = async () => {
  try {
    const data = await api.points.balance()
    pointsInfo.value = data
  } catch (error) {
    console.error('Load points balance failed:', error)
  }
}

const loadHistory = async (page = 1) => {
  try {
    const data = await api.points.history({ page, limit: 10 })
    transactions.value = data.transactions
    pagination.value = data.pagination
  } catch (error) {
    console.error('Load points history failed:', error)
  }
}

const loadCoupons = async () => {
  try {
    const data = await api.points.coupons()
    coupons.value = data
  } catch (error) {
    console.error('Load coupons failed:', error)
  }
}

const openRedeemModal = (coupon) => {
  selectedCoupon.value = coupon
  showRedeemModal.value = true
}

const handleRedeemSuccess = async (result) => {
  alert(result.message)
  await loadBalance()
  await loadCoupons()
}

onMounted(async () => {
  await Promise.all([loadBalance(), loadHistory(), loadCoupons()])
  loading.value = false
})
</script>
