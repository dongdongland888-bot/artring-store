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
            <label class="block text-sm font-medium mb-2">姓</label>
            <input v-model="form.lastName" type="text" class="input" placeholder="姓">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">名</label>
            <input v-model="form.firstName" type="text" class="input" placeholder="名">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">邮箱 *</label>
          <input 
            v-model="form.email" 
            type="email" 
            required 
            class="input" 
            :class="{ 'border-red-500': errors.email }"
            placeholder="your@email.com"
            @blur="validateEmail"
          >
          <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">密码 *</label>
          <div class="relative">
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'"
              required 
              minlength="6" 
              class="input pr-10" 
              :class="{ 'border-red-500': errors.password }"
              placeholder="至少6位字符"
              @input="validatePassword"
            >
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabindex="-1"
            >
              <EyeIcon v-if="!showPassword" class="w-5 h-5" />
              <EyeSlashIcon v-else class="w-5 h-5" />
            </button>
          </div>
          <p v-if="errors.password" class="text-red-500 text-sm mt-1">{{ errors.password }}</p>
          <!-- Password strength indicator -->
          <div v-if="form.password" class="mt-2">
            <div class="flex gap-1 mb-1">
              <div 
                v-for="i in 3" 
                :key="i" 
                class="h-1 flex-1 rounded transition-colors"
                :class="passwordStrength >= i ? getStrengthColor(passwordStrength) : 'bg-gray-200'"
              ></div>
            </div>
            <p class="text-xs" :class="getStrengthTextColor(passwordStrength)">
              {{ getStrengthText(passwordStrength) }}
            </p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">确认密码 *</label>
          <div class="relative">
            <input 
              v-model="form.confirmPassword" 
              :type="showConfirmPassword ? 'text' : 'password'"
              required 
              class="input pr-10" 
              :class="{ 'border-red-500': errors.confirmPassword }"
              placeholder="再次输入密码"
              @input="validateConfirmPassword"
            >
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabindex="-1"
            >
              <EyeIcon v-if="!showConfirmPassword" class="w-5 h-5" />
              <EyeSlashIcon v-else class="w-5 h-5" />
            </button>
          </div>
          <p v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1">{{ errors.confirmPassword }}</p>
        </div>

        <label class="flex items-start gap-2 text-sm">
          <input v-model="form.agreeTerms" type="checkbox" required class="rounded mt-1">
          <span class="text-gray-600">
            我已阅读并同意 
            <RouterLink to="/terms" class="text-accent-600 hover:underline">服务条款</RouterLink> 和 
            <RouterLink to="/privacy" class="text-accent-600 hover:underline">隐私政策</RouterLink>
          </span>
        </label>

        <button 
          type="submit" 
          class="w-full btn btn-primary" 
          :disabled="isLoading || !isFormValid"
        >
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const form = reactive({ 
  firstName: '', 
  lastName: '', 
  email: '', 
  password: '', 
  confirmPassword: '',
  agreeTerms: false
})
const errors = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

const validateEmail = () => {
  if (!form.email) {
    errors.email = '请输入邮箱'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '邮箱格式不正确'
  } else {
    errors.email = ''
  }
}

const validatePassword = () => {
  if (!form.password) {
    errors.password = '请输入密码'
  } else if (form.password.length < 6) {
    errors.password = '密码至少6位'
  } else if (form.password.length < 8) {
    errors.password = '建议密码至少8位，包含字母和数字'
  } else {
    errors.password = ''
  }
  // Re-validate confirm if it has value
  if (form.confirmPassword) validateConfirmPassword()
}

const validateConfirmPassword = () => {
  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认密码'
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次密码不一致'
  } else {
    errors.confirmPassword = ''
  }
}

const passwordStrength = computed(() => {
  const pwd = form.password
  if (!pwd) return 0
  let strength = 0
  if (pwd.length >= 8) strength++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
  if (/\d/.test(pwd)) strength++
  if (/[^a-zA-Z\d]/.test(pwd)) strength++
  return Math.min(3, Math.max(1, strength))
})

const getStrengthColor = (s) => {
  if (s === 1) return 'bg-red-500'
  if (s === 2) return 'bg-yellow-500'
  return 'bg-green-500'
}

const getStrengthTextColor = (s) => {
  if (s === 1) return 'text-red-500'
  if (s === 2) return 'text-yellow-600'
  return 'text-green-600'
}

const getStrengthText = (s) => {
  if (s === 1) return '弱'
  if (s === 2) return '中等'
  return '强'
}

const isFormValid = computed(() => {
  return form.email && 
         form.password && 
         form.confirmPassword &&
         form.password === form.confirmPassword && 
         form.password.length >= 6 &&
         form.agreeTerms &&
         !errors.email && 
         !errors.password && 
         !errors.confirmPassword
})

const handleRegister = async () => {
  validateEmail()
  validatePassword()
  validateConfirmPassword()
  
  if (!isFormValid.value) return

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
