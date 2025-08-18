"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/use-toast"
import { 
  fetchIngredients, 
  addIngredient, 
  updateIngredient, 
  deleteIngredient 
} from "@/lib/api/ingredients"
import type { Ingredient } from "@/lib/types"

export const inventoryKeys = {
  all: ["ingredients"] as const,
  lists: () => [...inventoryKeys.all, "list"] as const,
  list: (filters: any) => [...inventoryKeys.lists(), { filters }] as const,
  details: () => [...inventoryKeys.all, "detail"] as const,
  detail: (id: number) => [...inventoryKeys.details(), id] as const,
}

export function useInventory() {
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Fetch ingredients with React Query
  const {
    data: ingredients = [],
    isLoading,
    refetch: refreshIngredients,
  } = useQuery({
    queryKey: inventoryKeys.lists(),
    queryFn: async () => {
      try {
        setError(null)
        return await fetchIngredients()
      } catch (err: any) {
        setError(err.message)
        return []
      }
    },
  })

  // Add ingredient mutation
  const addIngredientMutation = useMutation({
    mutationFn: addIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      toast({
        title: "Success",
        description: "Ingredient added successfully",
      })
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: `Failed to add ingredient: ${err.message}`,
        variant: "destructive",
      })
    },
  })

  // Update ingredient mutation
  const updateIngredientMutation = useMutation({
    mutationFn: ({ id, ingredient }: { id: number; ingredient: Partial<Ingredient> }) => 
      updateIngredient(id, ingredient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      toast({
        title: "Success",
        description: "Ingredient updated successfully",
      })
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: `Failed to update ingredient: ${err.message}`,
        variant: "destructive",
      })
    },
  })

  // Delete ingredient mutation
  const deleteIngredientMutation = useMutation({
    mutationFn: deleteIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      toast({
        title: "Success",
        description: "Ingredient deleted successfully",
      })
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: `Failed to delete ingredient: ${err.message}`,
        variant: "destructive",
      })
    },
  })

  return {
    ingredients,
    isLoading,
    error,
    addIngredient: addIngredientMutation.mutateAsync,
    updateIngredient: (id: number, ingredient: Partial<Ingredient>) => 
      updateIngredientMutation.mutateAsync({ id, ingredient }),
    deleteIngredient: deleteIngredientMutation.mutateAsync,
    refreshData: refreshIngredients,
  }
}