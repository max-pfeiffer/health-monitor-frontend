import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import type { KetonesCreate, KetonesRead, KetonesUpdate } from '@/types/api'

const QUERY_KEY = ['ketones'] as const

export function useKetonesList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api<KetonesRead[]>('/api/v1/ketones/'),
  })
}

export function useCreateKetones() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: KetonesCreate) =>
      api<KetonesRead>('/api/v1/ketones/', { method: 'POST', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateKetones() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: KetonesUpdate }) =>
      api<KetonesRead>(`/api/v1/ketones/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteKetones() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/api/v1/ketones/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useImportKetones() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData()
      body.append('file', file)
      return api('/api/v1/ketones/import', { method: 'POST', body })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
