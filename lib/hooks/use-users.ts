"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"
import type { User, NewUser, UpdateUser, UserRole } from "@/lib/types/user"

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<UserRole[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to handle API responses
  const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
      const contentType = response.headers.get("content-type") || ""
      let errorMessage = `Error: ${response.status} ${response.statusText}`

      if (contentType.includes("application/json")) {
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          console.error("Failed to parse error response:", e)
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        }
      } else {
        const errorText = await response.text()
        errorMessage = errorText || errorMessage
      }

      throw new Error(errorMessage)
    }

    return await response.json()
  }

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/users")
      const data = await handleApiResponse(response)
      setUsers(data)
    } catch (err: any) {
      console.error("Error fetching users:", err)
      setError(err.message)
      toast({
        title: "Error",
        description: `Failed to load users: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch("/api/roles")
      const data = await handleApiResponse(response)
      setRoles(data)
    } catch (err: any) {
      console.error("Error fetching roles:", err)
      toast({
        title: "Error",
        description: `Failed to load roles: ${err.message}`,
        variant: "destructive",
      })
    }
  }, [])

  // Create user
  const createUser = async (userData: NewUser) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const newUser = await handleApiResponse(response)

      // Check if there's a warning message
      if (newUser.warning) {
        toast({
          title: "User Created",
          description: newUser.warning,
          variant: "default",
        })
      } else {
        toast({
          title: "Success",
          description: "User created successfully",
        })
      }

      // Remove warning from user object before adding to state
      const { warning, ...userWithoutWarning } = newUser
      setUsers((prev) => [...prev, userWithoutWarning])

      return userWithoutWarning
    } catch (err: any) {
      console.error("Error creating user:", err)
      toast({
        title: "Error",
        description: `Failed to create user: ${err.message}`,
        variant: "destructive",
      })
      throw err
    }
  }

  // Update user
  const updateUser = async (userData: UpdateUser) => {
    try {
      const response = await fetch(`/api/users/${userData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const updatedUser = await handleApiResponse(response)
      setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)))

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      return updatedUser
    } catch (err: any) {
      console.error("Error updating user:", err)
      toast({
        title: "Error",
        description: `Failed to update user: ${err.message}`,
        variant: "destructive",
      })
      throw err
    }
  }

  // Delete user
  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      const result = await handleApiResponse(response)
      setUsers((prev) => prev.filter((user) => user.id !== userId))

      if (result.warning) {
        toast({
          title: "User Deleted",
          description: result.warning,
          variant: "default",
        })
      } else {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
      }

      return result
    } catch (err: any) {
      console.error("Error deleting user:", err)
      toast({
        title: "Error",
        description: `Failed to delete user: ${err.message}`,
        variant: "destructive",
      })
      throw err
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchRoles().catch((err) => console.error("Initial roles fetch failed:", err))
    fetchUsers().catch((err) => console.error("Initial users fetch failed:", err))
  }, [fetchRoles, fetchUsers])

  return {
    users,
    roles,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers,
    refreshRoles: fetchRoles,
  }
}
