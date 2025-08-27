import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Config } from '@/lib/types'

// Fetch config by key
export const useConfig = (key: string) => {
  return useQuery({
    queryKey: ['config', key],
    queryFn: async (): Promise<Config> => {
      const response = await fetch(`/api/config?key=${key}`)
      if (!response.ok) {
        throw new Error('Failed to fetch config')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Update config
export const useUpdateConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string | number }) => {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      })

      if (!response.ok) {
        throw new Error('Failed to update config')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate and refetch config queries
      queryClient.invalidateQueries({ queryKey: ['config'] })
      // Update the specific config in cache
      queryClient.setQueryData(['config', data.key], data)
    },
  })
}
