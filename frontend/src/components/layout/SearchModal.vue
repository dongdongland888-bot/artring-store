<template>
  <TransitionRoot :show="show" as="template">
    <Dialog as="div" class="relative z-50" @close="$emit('close')">
      <!-- 背景遮罩 -->
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50" />
      </TransitionChild>

      <!-- 搜索弹窗 -->
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-start justify-center p-4 pt-20">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-2xl transform bg-white shadow-xl transition-all">
              <!-- 搜索输入 -->
              <div class="flex items-center border-b">
                <MagnifyingGlassIcon class="w-5 h-5 ml-6 text-gray-400" />
                <input
                  ref="searchInput"
                  v-model="query"
                  type="text"
                  placeholder="搜索商品..."
                  class="flex-1 px-4 py-5 text-lg focus:outline-none"
                  @keyup.enter="search"
                />
                <button 
                  @click="$emit('close')"
                  class="p-4 hover:bg-gray-100"
                >
                  <XMarkIcon class="w-5 h-5" />
                </button>
              </div>

              <!-- 搜索结果 -->
              <div v-if="results.length > 0" class="max-h-96 overflow-y-auto">
                <RouterLink
                  v-for="product in results"
                  :key="product.id"
                  :to="`/product/${product.slug}`"
                  class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  @click="$emit('close')"
                >
                  <img 
                    :src="product.images?.[0]?.url || '/placeholder.jpg'"
                    :alt="product.name"
                    class="w-16 h-16 object-cover"
                  >
                  <div>
                    <p class="font-medium">{{ product.name }}</p>
                    <p class="text-accent-500">${{ product.basePrice }}</p>
                  </div>
                </RouterLink>
              </div>

              <!-- 无结果 -->
              <div v-else-if="query && !isLoading" class="p-8 text-center text-gray-500">
                未找到相关商品
              </div>

              <!-- 热门搜索 -->
              <div v-else class="p-6">
                <p class="text-sm text-gray-500 mb-3">热门搜索</p>
                <div class="flex flex-wrap gap-2">
                  <button 
                    v-for="tag in hotTags"
                    :key="tag"
                    @click="query = tag; search()"
                    class="px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                  >
                    {{ tag }}
                  </button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import api from '@/api'

const props = defineProps({
  show: Boolean
})

defineEmits(['close'])

const searchInput = ref(null)
const query = ref('')
const results = ref([])
const isLoading = ref(false)
const hotTags = ['简约戒指', '金色', '925银', '复古风']

// 搜索
let debounceTimer = null
const search = async () => {
  if (!query.value.trim()) {
    results.value = []
    return
  }

  isLoading.value = true
  try {
    const response = await api.products.list({ search: query.value, limit: 5 })
    results.value = response.products
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    isLoading.value = false
  }
}

// 输入时防抖搜索
watch(query, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(search, 300)
})

// 打开时聚焦
watch(() => props.show, async (val) => {
  if (val) {
    await nextTick()
    searchInput.value?.focus()
  } else {
    query.value = ''
    results.value = []
  }
})
</script>
