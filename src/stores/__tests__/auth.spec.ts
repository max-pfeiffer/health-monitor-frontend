import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../auth'
import type Keycloak from 'keycloak-js'

function mockKeycloak(overrides: Partial<Keycloak> = {}): Keycloak {
  return {
    authenticated: true,
    token: 'mock-token',
    tokenParsed: { preferred_username: 'testuser' },
    logout: vi.fn(),
    ...overrides,
  } as unknown as Keycloak
}

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with unauthenticated state', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.username).toBeUndefined()
    expect(store.token).toBeUndefined()
  })

  it('reflects authenticated state after init', () => {
    const store = useAuthStore()
    store.init(mockKeycloak())
    expect(store.isAuthenticated).toBe(true)
    expect(store.username).toBe('testuser')
    expect(store.token).toBe('mock-token')
  })

  it('returns undefined username when tokenParsed has no preferred_username', () => {
    const store = useAuthStore()
    store.init(mockKeycloak({ tokenParsed: {} }))
    expect(store.username).toBeUndefined()
  })

  it('calls keycloak.logout on logout action', () => {
    const store = useAuthStore()
    const kc = mockKeycloak()
    store.init(kc)
    store.logout()
    expect(kc.logout).toHaveBeenCalledOnce()
  })
})
