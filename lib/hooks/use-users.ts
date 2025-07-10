"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/use-toast"
import type { User, NewUser, UpdateUser, UserRole } from "@/lib/types/user"
import type { Location } from "@/lib/api/locations"

export function useUsers() {
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const queryClient = useQueryClient()

  // Fetch users with React Query
  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        setError(null)
        const response = await fetch("/api/users")
        if (!response.ok) throw new Error(`Error: ${response.status}`)
        return await response.json()
      } catch (err: any) {
        setError(err.message)
        setDebugInfo(err)
        return []
      }
    },
  })

  // Fetch roles with React Query
  const {
    data: roles = [],
    isLoading: rolesLoading,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/roles")
        if (!response.ok) throw new Error(`Error: ${response.status}`)
        return await response.json()
      } catch (err: any) {
        console.error("Error fetching roles:", err)
        return []
      }
    },
  })

  // Fetch locations with React Query
  const {
    data: locations = [],
    isLoading: locationsLoading,
    refetch: refetchLocations,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/locations")
        if (!response.ok) throw new Error(`Error: ${response.status}`)
        return await response.json()
      } catch (err: any) {
        console.error("Error fetching locations:", err)
        return []
      }
    },
  })

  const isLoading = usersLoading || rolesLoading || locationsLoading

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: NewUser) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      return await response.json()
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast({
        title: "Success",
        description: "User created successfully",
      })
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: `Failed to create user: ${err.message}`,
        variant: "destructive",
      })
    },
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: UpdateUser) => {
      const response = await fetch(`/api/users/${userData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast({
        title: "Success",
        description: "User updated successfully",
      })
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: `Failed to update user: ${err.message}`,
        variant: "destructive",
      })
    },
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${err.message}`,
        variant: "destructive",
      })
    },
  })

  return {
    users,
    roles,
    locations,
    isLoading,
    error,
    debugInfo,
    createUser: createUserMutation.mutateAsync,
    updateUser: updateUserMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
    refreshUsers: refetchUsers,
    refreshRoles: refetchRoles,
    refreshLocations: refetchLocations,
  }
}