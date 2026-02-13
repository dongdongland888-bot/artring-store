<template>
  <div>
    <h1 class="text-2xl font-serif font-bold mb-6">{{ t('account.addressesTitle') }}</h1>

    <!-- Address List -->
    <div class="space-y-4">
      <div v-for="addr in addresses" :key="addr.id" class="p-4 border rounded-lg">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-medium">
              {{ addr.firstName }} {{ addr.lastName }}
              <span v-if="addr.isDefault" class="text-xs bg-accent-100 text-accent-600 px-2 py-0.5 ml-2 rounded">{{ t('account.default') }}</span>
            </p>
            <p class="text-sm text-gray-600 mt-1">{{ addr.street }}, {{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}</p>
            <p class="text-sm text-gray-600">{{ addr.country }}</p>
            <p class="text-sm text-gray-600">{{ addr.phone }}</p>
          </div>
          <div class="flex gap-3 flex-shrink-0">
            <button @click="openEdit(addr)" class="text-sm text-blue-600 hover:underline">{{ t('common.edit') }}</button>
            <button @click="deleteAddress(addr.id)" class="text-sm text-red-500 hover:underline">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
      <div v-if="addresses.length === 0" class="text-gray-400 text-center py-8">{{ t('account.noAddresses') }}</div>
    </div>

    <button @click="openAdd" class="btn btn-outline mt-6">+ {{ t('account.addNewAddress') }}</button>

    <!-- Address Modal -->
    <TransitionRoot :show="showModal" as="template">
      <Dialog as="div" class="relative z-50" @close="showModal = false">
        <TransitionChild
          as="template"
          enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
          leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as="template"
              enter="ease-out duration-300" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100"
              leave="ease-in duration-200" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-lg bg-white shadow-xl p-6">
                <DialogTitle class="text-lg font-semibold mb-4">
                  {{ editingId ? t('account.editAddress') : t('account.addAddress') }}
                </DialogTitle>

                <form @submit.prevent="handleSubmit" class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-1">{{ t('checkout.lastName') }}</label>
                      <input v-model="form.firstName" type="text" class="input" required />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1">{{ t('checkout.firstName') }}</label>
                      <input v-model="form.lastName" type="text" class="input" required />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">{{ t('checkout.phone') }}</label>
                    <input v-model="form.phone" type="tel" class="input" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">{{ t('checkout.street') }}</label>
                    <input v-model="form.street" type="text" class="input" required />
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-1">{{ t('checkout.city') }}</label>
                      <input v-model="form.city" type="text" class="input" required />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1">{{ t('checkout.state') }}</label>
                      <input v-model="form.state" type="text" class="input" required />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-1">{{ t('checkout.country') }}</label>
                      <input v-model="form.country" type="text" class="input" required />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1">{{ t('checkout.postalCode') }}</label>
                      <input v-model="form.postalCode" type="text" class="input" required />
                    </div>
                  </div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="form.isDefault" type="checkbox" class="rounded" />
                    <span class="text-sm">{{ t('checkout.setDefaultAddress') }}</span>
                  </label>
                  <div class="flex justify-end gap-3 pt-2">
                    <button type="button" @click="showModal = false" class="btn btn-outline">{{ t('common.cancel') }}</button>
                    <button type="submit" class="btn btn-primary" :disabled="isSaving">
                      {{ isSaving ? t('account.saving') : t('common.save') }}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useToast } from 'vue-toastification'
import api from '@/api'

const { t } = useI18n()
const toast = useToast()
const addresses = ref([])
const showModal = ref(false)
const editingId = ref(null)
const isSaving = ref(false)

const defaultForm = () => ({ firstName: '', lastName: '', phone: '', street: '', city: '', state: '', country: t('checkout.defaultCountry'), postalCode: '', isDefault: false })
const form = reactive(defaultForm())

const resetForm = () => Object.assign(form, defaultForm())

const openAdd = () => {
  resetForm()
  editingId.value = null
  showModal.value = true
}

const openEdit = (addr) => {
  editingId.value = addr.id
  Object.assign(form, {
    firstName: addr.firstName,
    lastName: addr.lastName,
    phone: addr.phone,
    street: addr.street,
    city: addr.city,
    state: addr.state,
    country: addr.country,
    postalCode: addr.postalCode,
    isDefault: addr.isDefault
  })
  showModal.value = true
}

const handleSubmit = async () => {
  isSaving.value = true
  try {
    if (editingId.value) {
      const res = await api.users.updateAddress(editingId.value, { ...form })
      const idx = addresses.value.findIndex(a => a.id === editingId.value)
      if (idx >= 0) addresses.value[idx] = res.address
    } else {
      const res = await api.users.addAddress({ ...form })
      addresses.value.push(res.address)
    }
    // If this was set as default, unset others locally
    if (form.isDefault) {
      addresses.value.forEach(a => {
        if (a.id !== (editingId.value || addresses.value[addresses.value.length - 1]?.id)) {
          a.isDefault = false
        }
      })
    }
    showModal.value = false
    toast.success(editingId.value ? t('account.addressUpdated') : t('account.addressAdded'))
  } catch (e) {
    toast.error(e.message)
  } finally {
    isSaving.value = false
  }
}

const deleteAddress = async (id) => {
  try {
    await api.users.deleteAddress(id)
    addresses.value = addresses.value.filter(a => a.id !== id)
    toast.success(t('account.deleted'))
  } catch (e) {
    toast.error(e.message)
  }
}

onMounted(async () => {
  try {
    addresses.value = await api.users.addresses()
  } catch (e) { /* ignore */ }
})
</script>
