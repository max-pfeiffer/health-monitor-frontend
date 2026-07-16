import { describe, it, expect, afterEach, vi } from 'vitest'
import type { AppConfig } from '../config'

const runtimeConfig: AppConfig = {
  apiBaseUrl: 'https://api.example.com',
  keycloakUrl: 'https://auth.example.com',
  keycloakRealm: 'example-realm',
  keycloakClientId: 'example-client',
}

// The module holds the loaded config in module scope, so each test imports a
// fresh copy to start from the unloaded state.
async function importConfigModule(): Promise<typeof import('../config')> {
  vi.resetModules()
  return import('../config')
}

function mockFetchResponse(overrides: Partial<Response> = {}): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(runtimeConfig),
    ...overrides,
  } as Response)
}

describe('runtime config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('getConfig throws before loadConfig has run', async () => {
    const { getConfig } = await importConfigModule()
    expect(() => getConfig()).toThrow(/loadConfig/)
  })

  it('uses import.meta.env values in dev mode', async () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000')
    vi.stubEnv('VITE_KEYCLOAK_URL', 'http://localhost:8080')
    vi.stubEnv('VITE_KEYCLOAK_REALM', 'health-monitor')
    vi.stubEnv('VITE_KEYCLOAK_CLIENT_ID', 'health-monitor-frontend')
    const fetchMock = mockFetchResponse()
    vi.stubGlobal('fetch', fetchMock)

    const { loadConfig, getConfig } = await importConfigModule()
    const config = await loadConfig()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(config).toEqual({
      apiBaseUrl: 'http://localhost:8000',
      keycloakUrl: 'http://localhost:8080',
      keycloakRealm: 'health-monitor',
      keycloakClientId: 'health-monitor-frontend',
    })
    expect(getConfig()).toEqual(config)
  })

  it('fetches /config.json in production mode', async () => {
    vi.stubEnv('DEV', false)
    const fetchMock = mockFetchResponse()
    vi.stubGlobal('fetch', fetchMock)

    const { loadConfig, getConfig } = await importConfigModule()
    const config = await loadConfig()

    expect(fetchMock).toHaveBeenCalledWith('/config.json', { cache: 'no-store' })
    expect(config).toEqual(runtimeConfig)
    expect(getConfig()).toEqual(runtimeConfig)
  })

  it('throws when /config.json cannot be loaded', async () => {
    vi.stubEnv('DEV', false)
    vi.stubGlobal('fetch', mockFetchResponse({ ok: false, status: 404 }))

    const { loadConfig, getConfig } = await importConfigModule()

    await expect(loadConfig()).rejects.toThrow(/404/)
    expect(() => getConfig()).toThrow(/loadConfig/)
  })
})
