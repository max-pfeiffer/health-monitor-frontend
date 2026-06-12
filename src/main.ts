import Keycloak from 'keycloak-js'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { initKeycloakInstance } from './lib/keycloak'
import { useAuthStore } from './stores/auth'

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

    const pinia = createPinia()
    const app = createApp(App)

    app.use(pinia)
    app.use(router)
    app.use(vuetify)
    app.use(VueQueryPlugin, { queryClient })

    initKeycloakInstance(keycloak)
    useAuthStore(pinia).init(keycloak)

    app.mount('#app')

    setInterval(() => {
      keycloak.updateToken(70).catch(() => keycloak.logout())
    }, 60_000)
  })
  .catch(() => {
    const isOffline = !navigator.onLine
    const heading = isOffline ? 'You are offline' : 'Authentication unavailable'
    const body = isOffline
      ? 'Please reconnect to the internet and reload the page.'
      : 'Unable to reach the authentication server. Please try again later.'

    document.body.style.cssText =
      'margin:0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh'
    document.body.innerHTML = `
      <div style="max-width:360px;padding:2rem;text-align:center">
        <h1 style="font-size:1.25rem;font-weight:600;margin:0 0 .75rem;color:#333">${heading}</h1>
        <p style="margin:0;color:#666;line-height:1.5">${body}</p>
      </div>`
  })
