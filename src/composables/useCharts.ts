import { type MaybeRefOrGetter, computed, toValue } from 'vue'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { api } from '@/lib/api'

export interface BloodPressureChartParams {
  start: string | null
  end: string | null
  systolic_top: number
  diastolic_top: number
  show_systolic: boolean
  show_diastolic: boolean
  show_pulse: boolean
}

export interface SimpleChartParams {
  start: string | null
  end: string | null
}

function toIsoOrUndefined(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined
  return new Date(dateStr).toISOString()
}

function buildBloodPressureQuery(
  p: BloodPressureChartParams,
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    systolic_top: p.systolic_top,
    diastolic_top: p.diastolic_top,
    show_systolic: p.show_systolic,
    show_diastolic: p.show_diastolic,
    show_pulse: p.show_pulse,
  }
  const start = toIsoOrUndefined(p.start)
  const end = toIsoOrUndefined(p.end)
  if (start) query.start = start
  if (end) query.end = end
  return query
}

function buildSimpleQuery(p: SimpleChartParams): Record<string, string> {
  const query: Record<string, string> = {}
  const start = toIsoOrUndefined(p.start)
  const end = toIsoOrUndefined(p.end)
  if (start) query.start = start
  if (end) query.end = end
  return query
}

export function useBloodPressureChart(params: MaybeRefOrGetter<BloodPressureChartParams>) {
  return useQuery({
    queryKey: computed(() => ['blood-pressure', 'chart', { ...toValue(params) }]),
    queryFn: () =>
      api('/api/v1/blood-pressure/chart', {
        query: buildBloodPressureQuery(toValue(params)),
        responseType: 'text' as const,
      }) as Promise<string>,
    placeholderData: keepPreviousData,
  })
}

export function useBloodGlucoseChart(params: MaybeRefOrGetter<SimpleChartParams>) {
  return useQuery({
    queryKey: computed(() => ['blood-glucose', 'chart', { ...toValue(params) }]),
    queryFn: () =>
      api('/api/v1/blood-glucose/chart', {
        query: buildSimpleQuery(toValue(params)),
        responseType: 'text' as const,
      }) as Promise<string>,
    placeholderData: keepPreviousData,
  })
}

export function useKetonesChart(params: MaybeRefOrGetter<SimpleChartParams>) {
  return useQuery({
    queryKey: computed(() => ['ketones', 'chart', { ...toValue(params) }]),
    queryFn: () =>
      api('/api/v1/ketones/chart', {
        query: buildSimpleQuery(toValue(params)),
        responseType: 'text' as const,
      }) as Promise<string>,
    placeholderData: keepPreviousData,
  })
}
