// Types
import type { App } from 'vue'
import { createPinia } from 'pinia'
import router from '../router'
/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */
import i18n from './i18n'
// Plugins
import vuetify from './vuetify'
import { VueReCaptcha } from 'vue-recaptcha-v3'

export function registerPlugins (app: App) {
  app.use(vuetify)
  app.use(createPinia())
  app.use(i18n)
  app.use(router)
  app.use(VueReCaptcha, {
    siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'disabled',
    loaderOptions: { autoHideBadge: true },
  })
}
