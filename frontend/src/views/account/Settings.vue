<template>
  <div>
    <h1 class="text-2xl font-serif font-bold mb-6">{{ t('account.settingsTitle') }}</h1>
    <form @submit.prevent="updateProfile" class="max-w-md space-y-6">
      <div class="grid grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium mb-2">{{ t('checkout.firstName') }}</label><input v-model="form.firstName" class="input"></div>
        <div><label class="block text-sm font-medium mb-2">{{ t('checkout.lastName') }}</label><input v-model="form.lastName" class="input"></div>
      </div>
      <div><label class="block text-sm font-medium mb-2">{{ t('account.email') }}</label><input :value="authStore.user?.email" class="input bg-gray-100" disabled></div>
      <div><label class="block text-sm font-medium mb-2">{{ t('account.phone') }}</label><input v-model="form.phone" class="input"></div>
      <button type="submit" class="btn btn-primary">{{ t('account.saveChanges') }}</button>
    </form>
    <hr class="my-8">
    <h2 class="text-lg font-semibold mb-4">{{ t('account.changePassword') }}</h2>
    <form @submit.prevent="changePassword" class="max-w-md space-y-6">
      <div><label class="block text-sm font-medium mb-2">{{ t('account.currentPassword') }}</label><input v-model="pwForm.current" type="password" class="input"></div>
      <div><label class="block text-sm font-medium mb-2">{{ t('account.newPassword') }}</label><input v-model="pwForm.new" type="password" class="input"></div>
      <button type="submit" class="btn btn-outline">{{ t('account.updatePassword') }}</button>
    </form>
  </div>
</template>
<script setup>
import { reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()
const form = reactive({ firstName: '', lastName: '', phone: '' })
const pwForm = reactive({ current: '', new: '' })
onMounted(() => { if(authStore.user) { form.firstName = authStore.user.firstName || ''; form.lastName = authStore.user.lastName || ''; form.phone = authStore.user.phone || '' } })
const updateProfile = async () => { try { await authStore.updateUser(form); toast.success(t('account.profileUpdated')) } catch(e) { toast.error(e.message) } }
const changePassword = async () => { try { await authStore.changePassword(pwForm.current, pwForm.new); pwForm.current = ''; pwForm.new = ''; toast.success(t('account.passwordChanged')) } catch(e) { toast.error(e.message) } }
</script>
