<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Mobile header -->
    <div class="lg:hidden bg-white border-b sticky top-0 z-40 flex items-center justify-between px-4 h-14">
      <RouterLink to="/admin" class="font-serif font-bold text-lg">ArtRing Admin</RouterLink>
      <button @click="sidebarOpen = !sidebarOpen" class="p-2 hover:bg-gray-100 rounded">
        <Bars3Icon class="w-6 h-6" />
      </button>
    </div>

    <div class="flex">
      <!-- Sidebar overlay (mobile) -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden"
        @click="sidebarOpen = false"
      ></div>

      <!-- Sidebar -->
      <aside
        class="fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-64 bg-white border-r flex-shrink-0 transform transition-transform lg:translate-x-0"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="flex flex-col h-full">
          <!-- Logo -->
          <div class="h-16 flex items-center px-6 border-b">
            <RouterLink to="/admin" class="font-serif font-bold text-xl">ArtRing Admin</RouterLink>
          </div>

          <!-- Nav -->
          <nav class="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
            <RouterLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              :class="isActive(item.path) ? 'bg-dark text-white' : 'text-gray-600 hover:bg-gray-100'"
              @click="sidebarOpen = false"
            >
              <component :is="item.icon" class="w-5 h-5" />
              {{ item.label }}
            </RouterLink>
          </nav>

          <!-- Bottom -->
          <div class="border-t p-4 space-y-2">
            <RouterLink
              to="/"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeftIcon class="w-5 h-5" />
              {{ t('admin.backToStore') }}
            </RouterLink>
            <div class="px-3 py-2 text-xs text-gray-400">
              {{ authStore.user?.email }}
            </div>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 min-w-0">
        <div class="p-4 lg:p-8">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import {
  Bars3Icon,
  HomeIcon,
  CubeIcon,
  ShoppingCartIcon,
  UsersIcon,
  TagIcon,
  ArrowLeftIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()
const sidebarOpen = ref(false)

const navItems = computed(() => [
  { path: '/admin', label: t('admin.dashboard'), icon: HomeIcon },
  { path: '/admin/products', label: t('admin.productManagement'), icon: CubeIcon },
  { path: '/admin/orders', label: t('admin.orderManagement'), icon: ShoppingCartIcon },
  { path: '/admin/users', label: t('admin.userManagement'), icon: UsersIcon },
  { path: '/admin/categories', label: t('admin.categoryManagement'), icon: TagIcon }
])

const isActive = (path) => {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}
</script>
