import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import vi from './locales/vi.json'

const LOCALE_KEY = 'artring-locale'
const supportedLocales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
]

function getInitialLocale() {
  const saved = localStorage.getItem(LOCALE_KEY)
  if (saved && supportedLocales.some((l) => l.code === saved)) return saved
  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    vi
  }
})

export function setLocale(code) {
  if (supportedLocales.some((l) => l.code === code)) {
    i18n.global.locale.value = code
    localStorage.setItem(LOCALE_KEY, code)
  }
}

export { supportedLocales }
export default i18n
