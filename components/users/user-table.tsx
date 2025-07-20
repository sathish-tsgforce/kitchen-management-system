"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, RefreshCw, UserPlus, Plus, Lock } from "lucide-react"
import { UserForm } from "@/components/users/user-form"
import { useUsers } from "@/lib/hooks/use-users"
import { useTextSize } from "@/lib/context/text-size-context"
import { useAuth } from "@/lib/auth-context"
import type { User } from "@/lib/types/user"

export function UserTable({ users, onEdit, onDelete }) {
  const { roles, locations, error, createUser, updateUser, deleteUser, refreshUsers, refreshLocations } = useUsers()
  const { textSize } = useTextSize()
  const { user: currentUser } = useAuth()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEdit = (user: User) => {
    onEdit(user)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedUser) {
      setIsSubmitting(true)
      try {
        await deleteUser(selectedUser.id)
      } catch (error) {
        console.error("Error during delete:", error)
      } finally {
        setIsSubmitting(false)
        setIsDeleteDialogOpen(false)
      }
    }
  }



  const handleEditSubmit = async (values: any) => {
    if (selectedUser) {
      setIsSubmitting(true)
      try {
        await updateUser({ id: selectedUser.id, ...values })
        setIsEditDialogOpen(false)
      } catch (error) {
        console.error("Error during update:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleRefresh = () => {
    refreshUsers()
    refreshLocations()
  }

  // Helper function to get role name safely
  const getRoleName = (user: User) => {
    if (!user.role_id) return "No role"
    if (user.role?.name) return user.role.name

    // Fallback to roles array if needed
    const role = roles.find((r) => r.id === user.role_id)
    return role ? role.name : `Role ${user.role_id}`
  }

  // Helper function to get text size classes
  const getTextSizeClasses = () => {
    switch (textSize) {
      case "large":
        return {
          tableHeader: "text-base",
          tableCell: "text-base",
        }
      case "x-large":
        return {
          tableHeader: "text-lg",
          tableCell: "text-lg",
        }
      default:
        return {
          tableHeader: "text-sm",
          tableCell: "text-sm",
        }
    }
  }

  const textClasses = getTextSizeClasses()

  return (
   <div className="flex flex-col h-full">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={textClasses.tableHeader}>Name</TableHead>
                <TableHead className={textClasses.tableHeader}>Email</TableHead>
                <TableHead className={textClasses.tableHeader}>Role</TableHead>
                <TableHead className={textClasses.tableHeader}>Location</TableHead>
                <TableHead className={`text-right ${textClasses.tableHeader}`}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className={`text-center py-6 ${textClasses.tableCell}`}>
                    <p>No users found. Click "Add User" to create one.</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className={`font-medium ${textClasses.tableCell}`}>{user.name || "N/A"}</TableCell>
                    <TableCell className={textClasses.tableCell}>{user.email}</TableCell>
                    <TableCell className={textClasses.tableCell}>{getRoleName(user)}</TableCell>
                    <TableCell className={textClasses.tableCell}>
                      {user.location_id && locations.find(loc => loc.id === user.location_id)?.name || 
                       user.location?.name || 
                       "Not assigned"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        {currentUser && user.id === currentUser.id ? (
                          <Button variant="outline" size="icon" disabled title="Cannot delete your own account">
                            <Lock className="h-4 w-4" />
                            <span className="sr-only">Cannot Delete</span>
                          </Button>
                        ) : (
                          <Button variant="destructive" size="icon" onClick={() => handleDelete(user)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      


      {selectedUser && (
        <UserForm
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleEditSubmit}
          user={selectedUser}
          roles={roles}
          locations={locations}
          isLoading={isSubmitting}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user <strong>{selectedUser?.name || selectedUser?.email}</strong>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
