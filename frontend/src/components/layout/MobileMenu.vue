<template>
  <TransitionRoot :show="show" as="template">
    <Dialog as="div" class="relative z-50" @close="$emit('close')">
      <!-- 背景遮罩 -->
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50" />
      </TransitionChild>

      <!-- 侧边栏 -->
      <div class="fixed inset-0 overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div
            class="pointer-events-none fixed inset-y-0 left-0 flex max-w-full"
          >
            <TransitionChild
              as="template"
              enter="transform transition ease-in-out duration-300"
              enter-from="-translate-x-full"
              enter-to="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leave-from="translate-x-0"
              leave-to="-translate-x-full"
            >
              <DialogPanel class="pointer-events-auto w-screen max-w-sm">
                <div class="flex h-full flex-col bg-white shadow-xl">
                  <!-- 头部 -->
                  <div
                    class="flex items-center justify-between px-6 py-4 border-b"
                  >
                    <span class="text-xl font-serif font-bold">ArtRing</span>
                    <button
                      @click="$emit('close')"
                      class="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <XMarkIcon class="w-6 h-6" />
                    </button>
                  </div>

                  <!-- 导航链接 -->
                  <div class="flex-1 overflow-y-auto py-6">
                    <nav class="space-y-2 px-4">
                      <RouterLink
                        to="/shop"
                        class="block px-4 py-3 hover:bg-gray-50 transition-colors"
                        @click="$emit('close')"
                      >
                        {{ t('nav.shop') }}
                      </RouterLink>

                      <!-- 分类 -->
                      <div>
                        <button
                          @click="showCategories = !showCategories"
                          class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <span>{{ t('nav.categories') }}</span>
                          <ChevronDownIcon
                            class="w-5 h-5 transition-transform"
                            :class="{ 'rotate-180': showCategories }"
                          />
                        </button>
                        <transition name="slide">
                          <div v-if="showCategories" class="pl-4">
                            <RouterLink
                              v-for="category in categories"
                              :key="category.id"
                              :to="`/category/${category.slug}`"
                              class="block px-4 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                              @click="$emit('close')"
                            >
                              {{ category.name }}
                            </RouterLink>
                          </div>
                        </transition>
                      </div>

                      <RouterLink
                        to="/about"
                        class="block px-4 py-3 hover:bg-gray-50 transition-colors"
                        @click="$emit('close')"
                      >
                        {{ t('nav.about') }}
                      </RouterLink>
                      <RouterLink
                        to="/contact"
                        class="block px-4 py-3 hover:bg-gray-50 transition-colors"
                        @click="$emit('close')"
                      >
                        {{ t('nav.contact') }}
                      </RouterLink>
                    </nav>
                  </div>

                  <!-- 底部链接 -->
                  <div class="border-t px-6 py-4 space-y-2">
                    <RouterLink
                      v-if="!authStore.isLoggedIn"
                      to="/login"
                      class="block w-full btn btn-primary text-center"
                      @click="$emit('close')"
                    >
                      {{ t('auth.login') }}
                    </RouterLink>
                    <RouterLink
                      v-else
                      to="/account"
                      class="block w-full btn btn-outline text-center"
                      @click="$emit('close')"
                    >
                      {{ t('nav.myAccount') }}
                    </RouterLink>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { XMarkIcon, ChevronDownIcon } from "@heroicons/vue/24/outline";
import { useAuthStore } from "@/stores/auth";
import { useBodyScrollLock } from "@/composables/useBodyScrollLock";

const { t } = useI18n();

const props = defineProps({
  show: Boolean,
  categories: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["close"]);

const authStore = useAuthStore();
const showCategories = ref(false);

// Lock body scroll when menu is open
useBodyScrollLock(toRef(props, "show"));
</script>
