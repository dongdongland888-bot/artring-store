<template>
  <div class="container-custom py-12">
    <h1 class="text-3xl font-serif font-bold mb-2">{{ t('about.pageTitle') }}</h1>
    <p class="text-gray-500 mb-12">{{ t('about.tagline') }}</p>
    <div class="grid lg:grid-cols-2 gap-12 mb-20">
      <div>
        <img src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800" class="w-full aspect-[4/3] object-cover" alt="">
      </div>
      <div class="flex flex-col justify-center">
        <h2 class="text-2xl font-serif font-bold mb-4">{{ t('about.ourStory') }}</h2>
        <p class="text-gray-600 leading-relaxed mb-4">{{ t('about.story1') }}</p>
        <p class="text-gray-600 leading-relaxed">{{ t('about.story2') }}</p>
      </div>
    </div>
    <div class="grid md:grid-cols-3 gap-8 mb-20">
      <div class="text-center p-8 bg-primary-100">
        <h3 class="text-4xl font-serif font-bold text-accent-500 mb-2">50+</h3>
        <p class="text-gray-600">{{ t('about.artists') }}</p>
      </div>
      <div class="text-center p-8 bg-primary-100">
        <h3 class="text-4xl font-serif font-bold text-accent-500 mb-2">10K+</h3>
        <p class="text-gray-600">{{ t('about.customers') }}</p>
      </div>
      <div class="text-center p-8 bg-primary-100">
        <h3 class="text-4xl font-serif font-bold text-accent-500 mb-2">30+</h3>
        <p class="text-gray-600">{{ t('about.countries') }}</p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
