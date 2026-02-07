<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <RouterLink to="/" class="text-3xl font-serif font-bold">ArtRing</RouterLink>
        <h1 class="text-2xl font-semibold mt-6 mb-2">登录</h1>
        <p class="text-gray-500">欢迎回来</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-2">邮箱</label>
          <input 
            v-model="form.email"
            type="email"
            required
            class="input"
            placeholder="your@email.com"
          >
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">密码</label>
          <input 
            v-model="form.password"
            type="password"
            required
            class="input"
            placeholder="••••••••"
          >
        </div>

        <div class="flex items-center justify-between text-sm">
          <label class="flex items-center gap-2">
            <input type="checkbox" class="rounded">
            <span>记住我</span>
          </label>
          <a href="#" class="text-accent-600 hover:underline">忘记密码?</a>
        </div>

        <button 
          type="submit"
          class="w-full btn btn-primary"
          :disabled="isLoading"
        >
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </form>

      <p class="text-center mt-8 text-gray-500">
        还没有账户? 
        <RouterLink to="/register" class="text-accent-600 hover:underline">
          立即注册
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()
const cartStore = useCartStore()

const isLoading = ref(false)
const form = reactive({
  email: '',
  password: ''
})

const handleLogin = async () => {
  isLoading.value = true
  try {
    await authStore.login(form.email, form.password)
    await cartStore.fetchCart()
    toast.success('登录成功')
    
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    toast.error(error.message)
  } finally {
    isLoading.value = false
  }
}
</script>
