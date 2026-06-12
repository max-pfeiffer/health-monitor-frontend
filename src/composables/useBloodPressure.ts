import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import type { BloodPressureCreate, BloodPressureRead, BloodPressureUpdate } from '@/types/api'

const QUERY_KEY = ['blood-pressure'] as const

export function useBloodPressureList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api<BloodPressureRead[]>('/api/v1/blood-pressure/'),
  })
}

export function useCreateBloodPressure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BloodPressureCreate) =>
      api<BloodPressureRead>('/api/v1/blood-pressure/', { method: 'POST', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateBloodPressure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BloodPressureUpdate }) =>
      api<BloodPressureRead>(`/api/v1/blood-pressure/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteBloodPressure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/api/v1/blood-pressure/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
