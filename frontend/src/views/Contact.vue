<template>
  <div class="container-custom py-12">
    <h1 class="text-3xl font-serif font-bold mb-2">{{ t('contact.pageTitle') }}</h1>
    <p class="text-gray-500 mb-12">{{ t('contact.intro') }}</p>
    <div class="grid lg:grid-cols-2 gap-12">
      <div>
        <h2 class="text-xl font-semibold mb-6">{{ t('contact.sendMessage') }}</h2>
        <form class="space-y-6">
          <div class="grid md:grid-cols-2 gap-4">
            <input type="text" :placeholder="t('contact.namePlaceholder')" class="input">
            <input type="email" :placeholder="t('contact.emailPlaceholder')" class="input">
          </div>
          <input type="text" :placeholder="t('contact.subjectPlaceholder')" class="input">
          <textarea :placeholder="t('contact.messagePlaceholder')" rows="5" class="input"></textarea>
          <button type="submit" class="btn btn-primary">{{ t('contact.submitMessage') }}</button>
        </form>
      </div>
      <div>
        <h2 class="text-xl font-semibold mb-6">{{ t('contact.contactInfo') }}</h2>
        <div class="space-y-6">
          <div><h3 class="font-medium mb-2">{{ t('contact.email') }}</h3><p class="text-gray-600">support@artring.com</p></div>
          <div><h3 class="font-medium mb-2">{{ t('contact.phone') }}</h3><p class="text-gray-600">+1 (555) 123-4567</p></div>
          <div><h3 class="font-medium mb-2">{{ t('contact.address') }}</h3><p class="text-gray-600">123 Art Street, Design District<br>New York, NY 10001</p></div>
          <div><h3 class="font-medium mb-2">{{ t('contact.hours') }}</h3><p class="text-gray-600">{{ t('contact.hoursWeek') }}<br>{{ t('contact.hoursSat') }}</p></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
