<template><div><h1 class="text-2xl font-serif font-bold mb-6">账户设置</h1><form @submit.prevent="updateProfile" class="max-w-md space-y-6"><div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium mb-2">名</label><input v-model="form.firstName" class="input"></div><div><label class="block text-sm font-medium mb-2">姓</label><input v-model="form.lastName" class="input"></div></div><div><label class="block text-sm font-medium mb-2">邮箱</label><input :value="authStore.user?.email" class="input bg-gray-100" disabled></div><div><label class="block text-sm font-medium mb-2">手机号</label><input v-model="form.phone" class="input"></div><button type="submit" class="btn btn-primary">保存更改</button></form><hr class="my-8"><h2 class="text-lg font-semibold mb-4">修改密码</h2><form @submit.prevent="changePassword" class="max-w-md space-y-6"><div><label class="block text-sm font-medium mb-2">当前密码</label><input v-model="pwForm.current" type="password" class="input"></div><div><label class="block text-sm font-medium mb-2">新密码</label><input v-model="pwForm.new" type="password" class="input"></div><button type="submit" class="btn btn-outline">修改密码</button></form></div></template>
<script setup>
import { reactive, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
const toast = useToast()
const authStore = useAuthStore()
const form = reactive({ firstName: '', lastName: '', phone: '' })
const pwForm = reactive({ current: '', new: '' })
onMounted(() => { if(authStore.user) { form.firstName = authStore.user.firstName || ''; form.lastName = authStore.user.lastName || ''; form.phone = authStore.user.phone || '' } })
const updateProfile = async () => { try { await authStore.updateUser(form); toast.success('已更新') } catch(e) { toast.error(e.message) } }
const changePassword = async () => { try { await authStore.changePassword(pwForm.current, pwForm.new); pwForm.current = ''; pwForm.new = ''; toast.success('密码已修改') } catch(e) { toast.error(e.message) } }
</script>
