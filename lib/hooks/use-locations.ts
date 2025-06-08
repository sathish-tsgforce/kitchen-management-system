import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getLocations, createLocation, updateLocation, deleteLocation } from "@/lib/api/locations"
import type { LocationInsert, LocationUpdate } from "@/lib/api/locations"

export function useLocations() {
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const queryClient = useQueryClient()

  const {
    data: locations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      try {
        setError(null)
        return await getLocations()
      } catch (err: any) {
        setError(err.message || "Failed to fetch locations")
        setDebugInfo(err)
        return []
      }
    },
  })

  const createLocationMutation = useMutation({
    mutationFn: (newLocation: LocationInsert) => createLocation(newLocation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] })
    },
    onError: (err: any) => {
      setError(err.message || "Failed to create location")
      setDebugInfo(err)
    },
  })

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, ...location }: { id: number } & LocationUpdate) => updateLocation(id, location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] })
    },
    onError: (err: any) => {
      setError(err.message || "Failed to update location")
      setDebugInfo(err)
    },
  })

  const deleteLocationMutation = useMutation({
    mutationFn: (id: number) => deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] })
    },
    onError: (err: any) => {
      setError(err.message || "Failed to delete location")
      setDebugInfo(err)
    },
  })

  return {
    locations,
    isLoading,
    error,
    debugInfo,
    createLocation: createLocationMutation.mutateAsync,
    updateLocation: updateLocationMutation.mutateAsync,
    deleteLocation: deleteLocationMutation.mutateAsync,
    refreshLocations: refetch,
  }
}