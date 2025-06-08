"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserTable } from "@/components/users/user-table"
import { UserForm } from "@/components/users/user-form"
import { useUsers } from "@/lib/hooks/use-users"
import { Loader2, Plus, RefreshCw } from "lucide-react"
import { ApiDebugPanel } from "@/components/debug/api-debug-panel"

export default function UsersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const { users, roles, locations, isLoading, error, debugInfo, createUser, updateUser, deleteUser, refreshUsers, refreshRoles, refreshLocations } =
    useUsers()

  const handleCreateUser = async (userData) => {
    setIsSubmitting(true)
    try {
      await createUser(userData)
      setIsFormOpen(false)
    } catch (error) {
      console.error("Failed to create user:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async (userData) => {
    setIsSubmitting(true)
    try {
      await updateUser(userData)
      setIsFormOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("Failed to update user:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId)
    } catch (error) {
      console.error("Failed to delete user:", error)
    }
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setSelectedUser(null)
  }

  const handleRefresh = () => {
    refreshUsers()
    refreshRoles()
    refreshLocations()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <ApiDebugPanel error={error} debugInfo={debugInfo} onRetry={handleRefresh} title="Error Loading Users" />
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-lg text-gray-500">Loading users...</span>
        </div>
      ) : (
        <UserTable users={users} onEdit={handleEditUser} onDelete={handleDeleteUser} />
      )}

      <UserForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
        user={selectedUser}
        roles={roles}
        locations={locations}
        isLoading={isSubmitting}
      />
    </div>
  )
}
