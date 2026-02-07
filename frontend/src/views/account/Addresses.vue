<template><div><h1 class="text-2xl font-serif font-bold mb-6">收货地址</h1><div class="space-y-4"><div v-for="addr in addresses" :key="addr.id" class="p-4 border"><div class="flex justify-between"><div><p class="font-medium">{{ addr.firstName }} {{ addr.lastName }} <span v-if="addr.isDefault" class="text-xs bg-accent-100 text-accent-600 px-2 py-0.5 ml-2">默认</span></p><p class="text-sm text-gray-600 mt-1">{{ addr.street }}, {{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}</p><p class="text-sm text-gray-600">{{ addr.phone }}</p></div><button @click="deleteAddress(addr.id)" class="text-sm text-red-500 hover:underline">删除</button></div></div></div><button class="btn btn-outline mt-6">+ 添加新地址</button></div></template>
<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/api'
const toast = useToast()
const addresses = ref([])
onMounted(async () => { try { addresses.value = await api.users.addresses() } catch(e){} })
const deleteAddress = async (id) => { try { await api.users.deleteAddress(id); addresses.value = addresses.value.filter(a => a.id !== id); toast.success('已删除') } catch(e) { toast.error(e.message) } }
</script>
