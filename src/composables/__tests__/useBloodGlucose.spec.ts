import { defineComponent, h } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { createPinia } from 'pinia'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))

import { api } from '@/lib/api'
import {
  useBloodGlucoseList,
  useCreateBloodGlucose,
  useDeleteBloodGlucose,
  useImportBloodGlucose,
  useUpdateBloodGlucose,
} from '../useBloodGlucose'

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
  value: '5.4',
  measured_at: '2024-01-01T00:00:00Z',
  notes: null,
}

describe('useBloodGlucoseList', () => {
  beforeEach(() => mockApi.mockResolvedValue([]))

  it('fetches from /api/v1/blood-glucose/', () => {
    createTestWrapper(() => useBloodGlucoseList())
    expect(mockApi).toHaveBeenCalledWith('/api/v1/blood-glucose/')
  })
})

describe('useCreateBloodGlucose', () => {
  beforeEach(() => mockApi.mockResolvedValue(mockRecord))

  it('posts to /api/v1/blood-glucose/', async () => {
    const { result } = createTestWrapper(() => useCreateBloodGlucose())
    const payload = { value: 5.4, measured_at: '2024-01-01T00:00:00Z' }
    await result.mutateAsync(payload)
    expect(mockApi).toHaveBeenCalledWith('/api/v1/blood-glucose/', {
      method: 'POST',
      body: payload,
    })
  })
})

describe('useUpdateBloodGlucose', () => {
  beforeEach(() => mockApi.mockResolvedValue({ ...mockRecord, value: '6.1' }))

  it('puts to /api/v1/blood-glucose/{id}', async () => {
    const { result } = createTestWrapper(() => useUpdateBloodGlucose())
    const data = { value: 6.1 }
    await result.mutateAsync({ id: 1, data })
    expect(mockApi).toHaveBeenCalledWith('/api/v1/blood-glucose/1', {
      method: 'PUT',
      body: data,
    })
  })
})

describe('useDeleteBloodGlucose', () => {
  beforeEach(() => mockApi.mockResolvedValue(undefined))

  it('sends DELETE to /api/v1/blood-glucose/{id}', async () => {
    const { result } = createTestWrapper(() => useDeleteBloodGlucose())
    await result.mutateAsync(7)
    expect(mockApi).toHaveBeenCalledWith('/api/v1/blood-glucose/7', { method: 'DELETE' })
  })
})

describe('useImportBloodGlucose', () => {
  beforeEach(() => {
    mockApi.mockClear()
    mockApi.mockResolvedValue(undefined)
  })

  it('posts a multipart form with the file to /api/v1/blood-glucose/import', async () => {
    const { result } = createTestWrapper(() => useImportBloodGlucose())
    const file = new File(['[]'], 'records.json', { type: 'application/json' })
    await result.mutateAsync(file)
    expect(mockApi).toHaveBeenCalledTimes(1)
    const [url, opts] = mockApi.mock.calls[0]
    expect(url).toBe('/api/v1/blood-glucose/import')
    expect(opts).toMatchObject({ method: 'POST' })
    expect(opts?.body).toBeInstanceOf(FormData)
    expect((opts?.body as FormData).get('file')).toBe(file)
  })
})
