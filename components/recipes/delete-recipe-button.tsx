"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { recipeKeys } from "@/lib/hooks/use-recipes"
import { deleteRecipe } from "@/lib/api/recipes"

interface DeleteRecipeButtonProps {
  recipeId: number
  recipeName: string
  onSuccess?: () => void
}

export default function DeleteRecipeButton({ recipeId, recipeName, onSuccess }: DeleteRecipeButtonProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteRecipe(recipeId)

      // Invalidate both the specific recipe and the list
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) })
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })

      // Remove the specific recipe from the cache
      queryClient.removeQueries({ queryKey: recipeKeys.detail(recipeId) })

      toast({
        title: "Recipe deleted",
        description: `"${recipeName}" has been deleted successfully.`,
      })

      setIsOpen(false)

      if (onSuccess) {
        onSuccess()
      } else {
        // Force a refresh of the page to ensure state is updated
        router.refresh()
        router.push("/recipes")
      }
    } catch (error) {
      console.error("Error deleting recipe:", error)

      toast({
        variant: "destructive",
        title: "Error deleting recipe",
        description: "There was an error deleting the recipe. Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button variant="outline" className="border-red-700 text-red-700 hover:bg-red-50" onClick={() => setIsOpen(true)}>
        <Trash2 className="mr-2 h-5 w-5" />
        Delete Recipe
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{recipeName}" and all its ingredients and steps. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Recipe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
