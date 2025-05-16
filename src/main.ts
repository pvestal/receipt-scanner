import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import './firebase/firebase'
import { useThemeStore } from './stores/themeStore'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(pinia)

// Initialize the app
app.mount('#app')

// Initialize theme (must be done after app is mounted and store is ready)
const themeStore = useThemeStore()
themeStore.initTheme()
