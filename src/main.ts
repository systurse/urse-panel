/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

// Styles - MUST be imported before components
// Vuetify styles are loaded via the plugin (vuetify.ts) which imports vuetify/styles first
import './styles/tailwind.css'
import './styles/main.scss'

// Plugins (includes Vuetify which loads its styles on initialization)
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
