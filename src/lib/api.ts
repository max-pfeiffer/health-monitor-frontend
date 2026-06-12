import { $fetch } from 'ofetch'
import { getToken } from './keycloak'

export const api = $fetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  onRequest({ options }) {
    const token = getToken()
    if (token) {
      const headers = new Headers(options.headers as HeadersInit)
      headers.set('Authorization', `Bearer ${token}`)
      options.headers = headers
    }
  },
})
