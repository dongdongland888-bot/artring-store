<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <RouterLink to="/" class="text-3xl font-serif font-bold">ArtRing</RouterLink>
        <h1 class="text-2xl font-semibold mt-6 mb-2">{{ t('auth.login') }}</h1>
        <p class="text-gray-500">{{ t('auth.welcomeBack') }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-2">{{ t('auth.email') }}</label>
          <input 
            v-model="form.email"
            type="email"
            required
            class="input"
            :class="{ 'border-red-500': errors.email }"
            :placeholder="t('auth.emailPlaceholder')"
            @blur="validateEmail"
          >
          <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">{{ t('auth.password') }}</label>
          <div class="relative">
            <input 
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="6"
              class="input pr-10"
            :class="{ 'border-red-500': errors.password }"
            :placeholder="t('auth.passwordPlaceholder')"
            @blur="validatePassword"
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
        </div>

        <div class="flex items-center justify-between text-sm">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.remember" type="checkbox" class="rounded">
            <span>{{ t('auth.rememberMe') }}</span>
          </label>
          <RouterLink to="/forgot-password" class="text-accent-600 hover:underline">
            {{ t('auth.forgotPassword') }}
          </RouterLink>
        </div>

        <button 
          type="submit"
          class="w-full btn btn-primary"
          :disabled="isLoading || !isFormValid"
        >
          {{ isLoading ? t('auth.loggingIn') : t('auth.login') }}
        </button>
      </form>

      <p class="text-center mt-8 text-gray-500">
        {{ t('auth.noAccount') }} 
        <RouterLink to="/register" class="text-accent-600 hover:underline">
          {{ t('auth.registerNow') }}
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()
const cartStore = useCartStore()

const isLoading = ref(false)
const showPassword = ref(false)
const form = reactive({
  email: '',
  password: '',
  remember: false
})
const errors = reactive({
  email: '',
  password: ''
})

const validateEmail = () => {
  if (!form.email) {
    errors.email = t('auth.errorEmailRequired')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = t('auth.errorEmailInvalid')
  } else {
    errors.email = ''
  }
}

const validatePassword = () => {
  if (!form.password) {
    errors.password = t('auth.errorPasswordRequired')
  } else if (form.password.length < 6) {
    errors.password = t('auth.errorPasswordMin')
  } else {
    errors.password = ''
  }
}

const isFormValid = computed(() => {
  return form.email && form.password && form.password.length >= 6 && !errors.email && !errors.password
})

const handleLogin = async () => {
  validateEmail()
  validatePassword()
  if (!isFormValid.value) return

  isLoading.value = true
  try {
    await authStore.login(form.email, form.password)
    await cartStore.fetchCart()
    toast.success(t('auth.loginSuccess'))
    
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    toast.error(error.message || t('common.error'))
  } finally {
    isLoading.value = false
  }
}
</script>
