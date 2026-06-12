import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import type { BloodGlucoseCreate, BloodGlucoseRead, BloodGlucoseUpdate } from '@/types/api'

const QUERY_KEY = ['blood-glucose'] as const

export function useBloodGlucoseList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api<BloodGlucoseRead[]>('/api/v1/blood-glucose/'),
  })
}

export function useCreateBloodGlucose() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BloodGlucoseCreate) =>
      api<BloodGlucoseRead>('/api/v1/blood-glucose/', { method: 'POST', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateBloodGlucose() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BloodGlucoseUpdate }) =>
      api<BloodGlucoseRead>(`/api/v1/blood-glucose/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteBloodGlucose() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/api/v1/blood-glucose/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
