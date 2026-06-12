import type Keycloak from 'keycloak-js'

let instance: Keycloak | null = null

export function initKeycloakInstance(kc: Keycloak): void {
  instance = kc
}

export function getToken(): string | undefined {
  return instance?.token
}
