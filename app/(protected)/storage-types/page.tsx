"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useStorageTypes, useDeleteStorageType } from "@/lib/hooks/use-storage-types"
import StorageTypeForm from "@/components/storage-types/storage-type-form"
import { TextSizeControls } from "@/components/accessibility/text-size-controls"
import { useTextSize } from "@/lib/context/text-size-context"
import type { StorageType } from "@/lib/types"

export default function StorageTypesPage() {
  const { data: storageTypes = [], isLoading, error } = useStorageTypes()
  const deleteStorageTypeMutation = useDeleteStorageType()
  const { textSize } = useTextSize()
  
  const [editingStorageType, setEditingStorageType] = useState<StorageType | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleEdit = (storageType: StorageType) => {
    setEditingStorageType(storageType)
    setIsFormOpen(true)
  }

  const handleAdd = () => {
    setEditingStorageType(null)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingStorageType(null)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteStorageTypeMutation.mutateAsync(id)
    } catch (error) {
      // Error is handled by the mutation
    }
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
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className={`font-bold ${textSize === 'large' ? 'text-4xl' : textSize === 'x-large' ? 'text-5xl' : 'text-3xl'}`}>
          Storage Types
        </h1>
        <div className="flex space-x-2">
          <Button className="bg-green-800 hover:bg-green-900 text-white" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Storage Type
          </Button>
          <TextSizeControls />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-lg text-gray-500">Loading storage types...</span>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={textClasses.tableHeader}>Name</TableHead>
                <TableHead className={textClasses.tableHeader}>Description</TableHead>
                <TableHead className={`text-right ${textClasses.tableHeader}`}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storageTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className={`text-center py-6 ${textClasses.tableCell}`}>
                    {error ? (
                      <div>
                        <p>Error loading storage types.</p>
                      </div>
                    ) : (
                      <div>
                        <p>No storage types found. Click "Add Storage Type" to create one.</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                storageTypes.map((storageType) => (
                  <TableRow key={storageType.id}>
                    <TableCell className={`font-medium ${textClasses.tableCell}`}>
                      {storageType.name}
                    </TableCell>
                    <TableCell className={textClasses.tableCell}>
                      {storageType.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(storageType)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              disabled={deleteStorageTypeMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the storage type <strong>{storageType.name}</strong>. 
                                This action cannot be undone and will fail if any ingredients are using this storage type.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(storageType.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteStorageTypeMutation.isPending}
                              >
                                {deleteStorageTypeMutation.isPending ? (
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingStorageType ? "Edit Storage Type" : "Add Storage Type"}
            </DialogTitle>
            <DialogDescription>
              {editingStorageType 
                ? "Update the storage type details below."
                : "Create a new storage type for ingredients."
              }
            </DialogDescription>
          </DialogHeader>
          <StorageTypeForm 
            storageType={editingStorageType}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
