import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import type Keycloak from 'keycloak-js'

export const useAuthStore = defineStore('auth', () => {
  const keycloak = shallowRef<Keycloak | null>(null)

  const isAuthenticated = computed(() => keycloak.value?.authenticated ?? false)
  const username = computed(
    () => (keycloak.value?.tokenParsed?.preferred_username as string | undefined) ?? undefined,
  )
  const token = computed(() => keycloak.value?.token)

  function init(kc: Keycloak): void {
    keycloak.value = kc
  }

  function logout(): void {
    keycloak.value?.logout()
  }

  return { isAuthenticated, username, token, init, logout }
})
