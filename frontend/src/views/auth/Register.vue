<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <RouterLink to="/" class="text-3xl font-serif font-bold">ArtRing</RouterLink>
        <h1 class="text-2xl font-semibold mt-6 mb-2">创建账户</h1>
        <p class="text-gray-500">加入我们，发现独特风格</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">名</label>
            <input v-model="form.firstName" type="text" class="input" placeholder="名">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">姓</label>
            <input v-model="form.lastName" type="text" class="input" placeholder="姓">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">邮箱</label>
          <input v-model="form.email" type="email" required class="input" placeholder="your@email.com">
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">密码</label>
          <input v-model="form.password" type="password" required minlength="6" class="input" placeholder="至少6位字符">
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">确认密码</label>
          <input v-model="form.confirmPassword" type="password" required class="input" placeholder="再次输入密码">
        </div>

        <label class="flex items-start gap-2 text-sm">
          <input type="checkbox" required class="rounded mt-1">
          <span class="text-gray-600">
            我已阅读并同意 <a href="#" class="text-accent-600 hover:underline">服务条款</a> 和 
            <a href="#" class="text-accent-600 hover:underline">隐私政策</a>
          </span>
        </label>

        <button type="submit" class="w-full btn btn-primary" :disabled="isLoading">
          {{ isLoading ? '注册中...' : '创建账户' }}
        </button>
      </form>

      <p class="text-center mt-8 text-gray-500">
        已有账户? <RouterLink to="/login" class="text-accent-600 hover:underline">立即登录</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const isLoading = ref(false)
const form = reactive({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })

const handleRegister = async () => {
  if (form.password !== form.confirmPassword) {
    toast.error('两次密码不一致')
    return
  }
  isLoading.value = true
  try {
    await authStore.register(form)
    toast.success('注册成功')
    router.push('/')
  } catch (error) {
    toast.error(error.message)
  } finally {
    isLoading.value = false
  }
}
</script>
