<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-6xl font-serif font-bold mb-4">404</h1>
      <p class="text-xl text-gray-500 mb-8">{{ t('notFound.title') }}</p>
      <RouterLink to="/" class="btn btn-primary">{{ t('notFound.backHome') }}</RouterLink>
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
