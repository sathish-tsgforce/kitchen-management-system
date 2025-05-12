"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchMenuItems, fetchMenuItemById, addMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/api/menu-items"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import type { MenuItem } from "@/lib/types"

// Keys for React Query
export const menuItemKeys = {
  all: ["menuItems"] as const,
  lists: () => [...menuItemKeys.all, "list"] as const,
  list: (filters: any) => [...menuItemKeys.lists(), { filters }] as const,
  details: () => [...menuItemKeys.all, "detail"] as const,
  detail: (id: number) => [...menuItemKeys.details(), id] as const,
}

// Hook to fetch all menu items
export function useMenuItems() {
  return useQuery({
    queryKey: menuItemKeys.lists(),
    queryFn: fetchMenuItems,
  })
}

// Hook to fetch a single menu item by ID
export function useMenuItem(id: number) {
  return useQuery({
    queryKey: menuItemKeys.detail(id),
    queryFn: () => fetchMenuItemById(id),
    enabled: !!id,
  })
}

// Hook to add a new menu item
export function useAddMenuItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  return useMutation({
    mutationFn: ({
      menuItem,
      imageFile,
    }: {
      menuItem: Omit<MenuItem, "id">
      imageFile?: File
    }) => addMenuItem(menuItem, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuItemKeys.lists() })
      toast({
        title: "Success",
        description: "Menu item added successfully",
      })
      router.push("/menu")
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// Hook to update an existing menu item
export function useUpdateMenuItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  return useMutation({
    mutationFn: ({
      id,
      menuItem,
      imageFile,
    }: {
      id: number
      menuItem: Partial<MenuItem>
      imageFile?: File
    }) => updateMenuItem(id, menuItem, imageFile),
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: menuItemKeys.lists() })
        queryClient.invalidateQueries({ queryKey: menuItemKeys.detail(data.id) })
      }
      toast({
        title: "Success",
        description: "Menu item updated successfully",
      })
      router.push("/menu")
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// Hook to delete a menu item
export function useDeleteMenuItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: number) => deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuItemKeys.lists() })
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}
