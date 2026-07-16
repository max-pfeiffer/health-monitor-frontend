import { $fetch } from 'ofetch'
import { getConfig } from './config'
import { getToken } from './keycloak'

export const api = $fetch.create({
  onRequest({ options }) {
    // baseURL must be resolved per request: the runtime config is loaded
    // asynchronously before the app mounts, after this module is imported
    options.baseURL = getConfig().apiBaseUrl
    const token = getToken()
    if (token) {
      const headers = new Headers(options.headers as HeadersInit)
      headers.set('Authorization', `Bearer ${token}`)
      options.headers = headers
    }
  },
})
