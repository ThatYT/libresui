import { computed } from 'vue'
import { createI18n } from 'vue-i18n'
import en from './en'
import zhcn from './zhcn'

export type SupportedLocale = 'en' | 'zhHans'
export const normalizeLocale = (value: unknown): SupportedLocale =>
  value === 'zhHans' ? 'zhHans' : 'en'

export const savedLocale = normalizeLocale(localStorage.getItem('locale'))
localStorage.setItem('locale', savedLocale)

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, zhHans: zhcn },
})

export const locale = computed(() =>
  i18n.global.locale.value === 'zhHans' ? 'zh-CN' : 'en')

export const languages = [
  { title: 'English', value: 'en' },
  { title: '简体中文', value: 'zhHans' },
]
