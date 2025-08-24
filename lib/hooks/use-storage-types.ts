"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  fetchStorageTypes, 
  addStorageType, 
  updateStorageType, 
  deleteStorageType
} from "@/lib/api/storage-types"
import type { StorageType } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

// Keys for React Query
export const storageTypeKeys = {
  all: ["storage-types"] as const,
  lists: () => [...storageTypeKeys.all, "list"] as const,
  list: (filters: any) => [...storageTypeKeys.lists(), { filters }] as const,
  details: () => [...storageTypeKeys.all, "detail"] as const,
  detail: (id: number) => [...storageTypeKeys.details(), id] as const,
}

// Hook to fetch storage types
export function useStorageTypes() {
  return useQuery({
    queryKey: storageTypeKeys.lists(),
    queryFn: fetchStorageTypes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to add a storage type
export function useAddStorageType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storageType: Omit<StorageType, "id">) => 
      addStorageType(storageType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageTypeKeys.lists() })
      toast({
        title: "Storage type added",
        description: "The storage type has been added successfully.",
      })
    },
    onError: (error: any) => {
      console.error("Error adding storage type:", error)
      toast({
        variant: "destructive",
        title: "Error adding storage type",
        description: error.message || "There was an error adding the storage type. Please try again.",
      })
    },
  })
}

// Hook to update a storage type
export function useUpdateStorageType(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storageType: Partial<StorageType>) => updateStorageType(id, storageType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageTypeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: storageTypeKeys.lists() })
      toast({
        title: "Storage type updated",
        description: "The storage type has been updated successfully.",
      })
    },
    onError: (error: any) => {
      console.error("Error updating storage type:", error)
      toast({
        variant: "destructive",
        title: "Error updating storage type",
        description: error.message || "There was an error updating the storage type. Please try again.",
      })
    },
  })
}

// Hook to delete a storage type
export function useDeleteStorageType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteStorageType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageTypeKeys.lists() })
      toast({
        title: "Storage type deleted",
        description: "The storage type has been deleted successfully.",
      })
    },
    onError: (error: any) => {
      console.error("Error deleting storage type:", error)
      toast({
        variant: "destructive",
        title: "Error deleting storage type",
        description: error.message || "There was an error deleting the storage type. Please try again.",
      })
    },
  })
}
