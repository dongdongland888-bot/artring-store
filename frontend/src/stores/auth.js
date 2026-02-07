import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const token = ref(null)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN' || user.value?.role === 'SUPER_ADMIN')

  // 登录
  async function login(email, password) {
    const response = await api.auth.login({ email, password })
    token.value = response.token
    user.value = response.user
    api.setToken(response.token)
    return response
  }

  // 注册
  async function register(data) {
    const response = await api.auth.register(data)
    token.value = response.token
    user.value = response.user
    api.setToken(response.token)
    return response
  }

  // 登出
  function logout() {
    user.value = null
    token.value = null
    api.setToken(null)
  }

  // 获取当前用户信息
  async function fetchUser() {
    if (!token.value) return null
    
    try {
      api.setToken(token.value)
      const userData = await api.auth.me()
      user.value = userData
      return userData
    } catch (error) {
      logout()
      throw error
    }
  }

  // 更新用户信息
  async function updateUser(data) {
    const response = await api.auth.updateMe(data)
    user.value = response.user
    return response
  }

  // 修改密码
  async function changePassword(currentPassword, newPassword) {
    return await api.auth.changePassword({ currentPassword, newPassword })
  }

  return {
    user,
    token,
    isLoggedIn,
    isAdmin,
    login,
    register,
    logout,
    fetchUser,
    updateUser,
    changePassword
  }
}, {
  persist: {
    paths: ['token']
  }
})
