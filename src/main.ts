import Keycloak from 'keycloak-js'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

keycloak
  .init({ onLoad: 'login-required', pkceMethod: 'S256' })
  .then((authenticated) => {
    if (!authenticated) {
      keycloak.login()
      return
    }

    const app = createApp(App)

    app.use(createPinia())
    app.use(router)
    app.use(vuetify)
    app.use(VueQueryPlugin, { queryClient })
    app.provide('keycloak', keycloak)

    app.mount('#app')

    setInterval(() => {
      keycloak.updateToken(70).catch(() => keycloak.logout())
    }, 60_000)
  })
  .catch(() => {
    document.body.innerHTML =
      '<p style="padding:2rem;font-family:sans-serif">Unable to connect to authentication server. Please check your connection and reload.</p>'
  })
