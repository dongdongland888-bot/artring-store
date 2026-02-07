import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useCartStore = defineStore('cart', () => {
  // 状态
  const items = ref([])
  const isOpen = ref(false)
  const isLoading = ref(false)

  // 计算属性
  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  
  const subtotal = computed(() => 
    items.value.reduce((sum, item) => {
      const price = parseFloat(item.variant?.price || item.product.basePrice)
      return sum + price * item.quantity
    }, 0)
  )

  const isEmpty = computed(() => items.value.length === 0)

  // 获取购物车
  async function fetchCart() {
    isLoading.value = true
    try {
      const response = await api.cart.get()
      items.value = response.items
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 添加到购物车
  async function addItem(productId, variantId = null, quantity = 1) {
    isLoading.value = true
    try {
      await api.cart.add({ productId, variantId, quantity })
      await fetchCart()
      isOpen.value = true // 打开购物车抽屉
    } finally {
      isLoading.value = false
    }
  }

  // 更新数量
  async function updateQuantity(itemId, quantity) {
    if (quantity < 1) {
      return removeItem(itemId)
    }
    
    isLoading.value = true
    try {
      await api.cart.update(itemId, { quantity })
      await fetchCart()
    } finally {
      isLoading.value = false
    }
  }

  // 删除商品
  async function removeItem(itemId) {
    isLoading.value = true
    try {
      await api.cart.remove(itemId)
      await fetchCart()
    } finally {
      isLoading.value = false
    }
  }

  // 清空购物车
  async function clearCart() {
    isLoading.value = true
    try {
      await api.cart.clear()
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  // 本地清空 (结算后)
  function clearLocal() {
    items.value = []
  }

  // 打开/关闭购物车
  function toggleCart() {
    isOpen.value = !isOpen.value
  }

  function openCart() {
    isOpen.value = true
  }

  function closeCart() {
    isOpen.value = false
  }

  return {
    items,
    isOpen,
    isLoading,
    itemCount,
    subtotal,
    isEmpty,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    clearLocal,
    toggleCart,
    openCart,
    closeCart
  }
})
