export interface AppConfig {
  apiBaseUrl: string
  keycloakUrl: string
  keycloakRealm: string
  keycloakClientId: string
}

let config: AppConfig | null = null

/**
 * Loads the application config before the app mounts.
 *
 * In production the config is fetched from /config.json, which the container
 * entrypoint renders from environment variables on every start — this is what
 * makes the image runtime-configurable (e.g. via a Helm chart). In dev mode
 * the Vite dev server has no such endpoint, so the values come from
 * import.meta.env (.env file) instead.
 */
export async function loadConfig(): Promise<AppConfig> {
  if (import.meta.env.DEV) {
    config = {
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL,
      keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM,
      keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    }
    return config
  }

  // no-store: config.json is generated per container start and must never be
  // pinned by the HTTP cache or the service worker
  const response = await fetch('/config.json', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Failed to load /config.json: HTTP ${response.status}`)
  }
  config = (await response.json()) as AppConfig
  return config
}

export function getConfig(): AppConfig {
  if (!config) {
    throw new Error('App config has not been loaded — call loadConfig() first')
  }
  return config
}
