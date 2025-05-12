"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchRecipes, fetchRecipeById, createRecipe, updateRecipe, deleteRecipe } from "@/lib/api/recipes"
import type { Recipe } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

// Keys for React Query
export const recipeKeys = {
  all: ["recipes"] as const,
  lists: () => [...recipeKeys.all, "list"] as const,
  list: (filters: any) => [...recipeKeys.lists(), { filters }] as const,
  details: () => [...recipeKeys.all, "detail"] as const,
  detail: (id: number) => [...recipeKeys.details(), id] as const,
}

// Hook to fetch all recipes
export function useRecipes() {
  return useQuery({
    queryKey: recipeKeys.lists(),
    queryFn: fetchRecipes,
  })
}

// Hook to fetch a single recipe
export function useRecipe(id: number) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => fetchRecipeById(id),
    enabled: !!id,
  })
}

// Hook to create a recipe
export function useCreateRecipe() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (recipe: Omit<Recipe, "id" | "name">) => createRecipe(recipe),
    onSuccess: (newRecipeId) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      router.refresh()
      toast({
        title: "Recipe created",
        description: "Your recipe has been created successfully.",
      })
    },
    onError: (error) => {
      console.error("Error creating recipe:", error)
      toast({
        variant: "destructive",
        title: "Error creating recipe",
        description: "There was an error creating your recipe. Please try again.",
      })
    },
  })
}

// Hook to update a recipe
export function useUpdateRecipe(id: number) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (recipe: Partial<Recipe>) => updateRecipe(id, recipe),
    onSuccess: () => {
      // Invalidate both the specific recipe and the list
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      router.refresh()
      toast({
        title: "Recipe updated",
        description: "Your recipe has been updated successfully.",
      })
    },
    onError: (error) => {
      console.error("Error updating recipe:", error)
      toast({
        variant: "destructive",
        title: "Error updating recipe",
        description: "There was an error updating your recipe. Please try again.",
      })
    },
  })
}

// Hook to delete a recipe
export function useDeleteRecipe() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: (_, deletedRecipeId) => {
      // Invalidate the recipes list
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })

      // Remove the specific recipe from the cache
      queryClient.removeQueries({ queryKey: recipeKeys.detail(deletedRecipeId) })

      // Force a refresh to ensure all components update
      router.refresh()

      toast({
        title: "Recipe deleted",
        description: "Your recipe has been deleted successfully.",
      })
    },
    onError: (error) => {
      console.error("Error deleting recipe:", error)
      toast({
        variant: "destructive",
        title: "Error deleting recipe",
        description: "There was an error deleting your recipe. Please try again.",
      })
    },
  })
}
