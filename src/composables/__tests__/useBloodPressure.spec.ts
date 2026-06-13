import { defineComponent, h } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { createPinia } from 'pinia'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))

import { api } from '@/lib/api'
import {
  useBloodPressureList,
  useCreateBloodPressure,
  useDeleteBloodPressure,
  useImportBloodPressure,
  useUpdateBloodPressure,
} from '../useBloodPressure'

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
  systolic: 120,
  diastolic: 80,
  pulse: null,
  measured_at: '2024-01-01T00:00:00Z',
  notes: null,
}

describe('useBloodPressureList', () => {
  beforeEach(() => mockApi.mockResolvedValue([]))

  it('fetches from /api/v1/blood-pressure/', () => {
    createTestWrapper(() => useBloodPressureList())
    expect(mockApi).toHaveBeenCalledWith('/api/v1/blood-pressure/')
  })
})

describe('useCreateBloodPressure', () => {
  beforeEach(() => mockApi.mockResolvedValue(mockRecord))

  it('posts to /api/v1/blood-pressure/', async () => {
    const { result } = createTestWrapper(() => useCreateBloodPressure())
    const payload = { systolic: 120, diastolic: 80, measured_at: '2024-01-01T00:00:00Z' }
    await result.mutateAsync(payload)
    expect(mockApi).toHaveBeenCalledWith('/api/v1/blood-pressure/', {
      method: 'POST',
      body: payload,
    })
  })
})

describe('useUpdateBloodPressure', () => {
  beforeEach(() => mockApi.mockResolvedValue({ ...mockRecord, id: 42, systolic: 130 }))

  it('puts to /api/v1/blood-pressure/{id}', async () => {
    const { result } = createTestWrapper(() => useUpdateBloodPressure())
    const data = { systolic: 130, diastolic: 85 }
    await result.mutateAsync({ id: 42, data })
    expect(mockApi).toHaveBeenCalledWith('/api/v1/blood-pressure/42', {
      method: 'PUT',
      body: data,
    })
  })
})

describe('useDeleteBloodPressure', () => {
  beforeEach(() => mockApi.mockResolvedValue(undefined))

  it('sends DELETE to /api/v1/blood-pressure/{id}', async () => {
    const { result } = createTestWrapper(() => useDeleteBloodPressure())
    await result.mutateAsync(42)
    expect(mockApi).toHaveBeenCalledWith('/api/v1/blood-pressure/42', { method: 'DELETE' })
  })
})

describe('useImportBloodPressure', () => {
  beforeEach(() => {
    mockApi.mockClear()
    mockApi.mockResolvedValue(undefined)
  })

  it('posts a multipart form with the file to /api/v1/blood-pressure/import', async () => {
    const { result } = createTestWrapper(() => useImportBloodPressure())
    const file = new File(['[]'], 'records.json', { type: 'application/json' })
    await result.mutateAsync(file)
    expect(mockApi).toHaveBeenCalledTimes(1)
    const [url, opts] = mockApi.mock.calls[0]
    expect(url).toBe('/api/v1/blood-pressure/import')
    expect(opts).toMatchObject({ method: 'POST' })
    expect(opts?.body).toBeInstanceOf(FormData)
    expect((opts?.body as FormData).get('file')).toBe(file)
  })
})
