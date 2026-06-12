import { defineComponent, h } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { createPinia } from 'pinia'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))

import { api } from '@/lib/api'
import { useCreateKetones, useDeleteKetones, useKetonesList, useUpdateKetones } from '../useKetones'

const mockApi = vi.mocked(api)

function createTestWrapper<T>(setup: () => T): { result: T } {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  let result!: T
  mount(
    defineComponent({
      setup() {
        result = setup()
        return () => h('div')
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient }], createPinia()] } },
  )
  return { result }
}

const mockRecord = {
  id: 1,
  value: '1.2',
  measured_at: '2024-01-01T00:00:00Z',
  notes: null,
}

describe('useKetonesList', () => {
  beforeEach(() => mockApi.mockResolvedValue([]))

  it('fetches from /api/v1/ketones/', () => {
    createTestWrapper(() => useKetonesList())
    expect(mockApi).toHaveBeenCalledWith('/api/v1/ketones/')
  })
})

describe('useCreateKetones', () => {
  beforeEach(() => mockApi.mockResolvedValue(mockRecord))

  it('posts to /api/v1/ketones/', async () => {
    const { result } = createTestWrapper(() => useCreateKetones())
    const payload = { value: 1.2, measured_at: '2024-01-01T00:00:00Z' }
    await result.mutateAsync(payload)
    expect(mockApi).toHaveBeenCalledWith('/api/v1/ketones/', {
      method: 'POST',
      body: payload,
    })
  })
})

describe('useUpdateKetones', () => {
  beforeEach(() => mockApi.mockResolvedValue({ ...mockRecord, value: '0.8' }))

  it('puts to /api/v1/ketones/{id}', async () => {
    const { result } = createTestWrapper(() => useUpdateKetones())
    const data = { value: 0.8 }
    await result.mutateAsync({ id: 1, data })
    expect(mockApi).toHaveBeenCalledWith('/api/v1/ketones/1', {
      method: 'PUT',
      body: data,
    })
  })
})

describe('useDeleteKetones', () => {
  beforeEach(() => mockApi.mockResolvedValue(undefined))

  it('sends DELETE to /api/v1/ketones/{id}', async () => {
    const { result } = createTestWrapper(() => useDeleteKetones())
    await result.mutateAsync(3)
    expect(mockApi).toHaveBeenCalledWith('/api/v1/ketones/3', { method: 'DELETE' })
  })
})
