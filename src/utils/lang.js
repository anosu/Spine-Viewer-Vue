import {createI18n} from "vue-i18n";

import zh_CN from '../locales/zh_CN.json'
import en_US from '../locales/en_US.json'

const defaultLanguage = navigator.language.startsWith('zh') ? 'zh_CN' : 'en_US'

const i18n = createI18n({
    locale: localStorage.getItem('locale') || defaultLanguage,
    fallbackLocale: 'en-US',
    messages: {
        zh_CN,
        en_US
    }
})

export default i18n