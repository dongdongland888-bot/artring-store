import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
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
      // 401 等认证错误不需要提示，已由拦截器处理
      if (error.message !== '登录已过期，请重新登录') {
        console.error('Failed to fetch cart:', error)
      }
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
      isOpen.value = true
    } catch (error) {
      const toast = useToast()
      toast.error(error.message || '添加失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 更新数量
  async function updateQuantity(itemId, quantity) {
    if (quantity < 1) {
      return removeItem(itemId)
    }
    
    // 乐观更新
    const item = items.value.find(i => i.id === itemId)
    const oldQty = item?.quantity
    if (item) item.quantity = quantity

    try {
      await api.cart.update(itemId, { quantity })
      await fetchCart()
    } catch (error) {
      // 回滚
      if (item) item.quantity = oldQty
      const toast = useToast()
      toast.error(error.message || '更新失败')
    }
  }

  // 删除商品
  async function removeItem(itemId) {
    // 乐观更新
    const oldItems = [...items.value]
    items.value = items.value.filter(i => i.id !== itemId)

    try {
      await api.cart.remove(itemId)
    } catch (error) {
      // 回滚
      items.value = oldItems
      const toast = useToast()
      toast.error(error.message || '删除失败')
    }
  }

  // 清空购物车
  async function clearCart() {
    isLoading.value = true
    try {
      await api.cart.clear()
      items.value = []
    } catch (error) {
      const toast = useToast()
      toast.error(error.message || '清空失败')
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
