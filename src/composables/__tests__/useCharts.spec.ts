import { defineComponent, h, ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { createPinia } from 'pinia'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))

import { api } from '@/lib/api'
import { useBloodGlucoseChart, useBloodPressureChart, useKetonesChart } from '../useCharts'
import type { BloodPressureChartParams, SimpleChartParams } from '../useCharts'

const mockApi = vi.mocked(api)

const MOCK_SVG = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>'

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

describe('useBloodPressureChart', () => {
  beforeEach(() => {
    mockApi.mockClear()
    mockApi.mockResolvedValue(MOCK_SVG)
  })

  it('fetches from /api/v1/blood-pressure/chart with default params', () => {
    const params = ref<BloodPressureChartParams>({
      start: null,
      end: null,
      systolic_top: 135,
      diastolic_top: 85,
      show_systolic: true,
      show_diastolic: true,
      show_pulse: true,
      theme: 'light',
    })
    createTestWrapper(() => useBloodPressureChart(params))
    expect(mockApi).toHaveBeenCalledWith('/api/v1/blood-pressure/chart', {
      query: {
        systolic_top: 135,
        diastolic_top: 85,
        show_systolic: true,
        show_diastolic: true,
        show_pulse: true,
        theme: 'light',
      },
      responseType: 'text',
    })
  })

  it('forwards the dark theme', () => {
    const params = ref<BloodPressureChartParams>({
      start: null,
      end: null,
      systolic_top: 135,
      diastolic_top: 85,
      show_systolic: true,
      show_diastolic: true,
      show_pulse: true,
      theme: 'dark',
    })
    createTestWrapper(() => useBloodPressureChart(params))
    expect((mockApi.mock.lastCall![1]?.query as Record<string, unknown>).theme).toBe('dark')
  })

  it('includes date range when provided', () => {
    const params = ref<BloodPressureChartParams>({
      start: '2024-01-01',
      end: '2024-01-31',
      systolic_top: 135,
      diastolic_top: 85,
      show_systolic: true,
      show_diastolic: false,
      show_pulse: true,
      theme: 'light',
    })
    createTestWrapper(() => useBloodPressureChart(params))
    const call = mockApi.mock.lastCall!
    expect(call[1]?.query).toMatchObject({
      show_diastolic: false,
    })
    expect((call[1]?.query as Record<string, unknown>).start).toMatch(/2024-01-01T/)
    expect((call[1]?.query as Record<string, unknown>).end).toMatch(/2024-01-31T/)
  })
})

describe('useBloodGlucoseChart', () => {
  beforeEach(() => mockApi.mockResolvedValue(MOCK_SVG))

  it('fetches from /api/v1/blood-glucose/chart', () => {
    const params = ref<SimpleChartParams>({ start: null, end: null, theme: 'light' })
    createTestWrapper(() => useBloodGlucoseChart(params))
    expect(mockApi).toHaveBeenCalledWith('/api/v1/blood-glucose/chart', {
      query: { theme: 'light' },
      responseType: 'text',
    })
  })
})

describe('useKetonesChart', () => {
  beforeEach(() => mockApi.mockResolvedValue(MOCK_SVG))

  it('fetches from /api/v1/ketones/chart', () => {
    const params = ref<SimpleChartParams>({ start: null, end: null, theme: 'dark' })
    createTestWrapper(() => useKetonesChart(params))
    expect(mockApi).toHaveBeenCalledWith('/api/v1/ketones/chart', {
      query: { theme: 'dark' },
      responseType: 'text',
    })
  })
})
