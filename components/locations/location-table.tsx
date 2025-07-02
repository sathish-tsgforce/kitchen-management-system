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
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, RefreshCw, Plus } from "lucide-react"
import { LocationForm } from "@/components/locations/location-form"
import { useLocations } from "@/lib/hooks/use-locations"
import { useTextSize } from "@/lib/context/text-size-context"
import type { Location } from "@/lib/api/locations"

export function LocationTable() {
  const { locations, isLoading, error, createLocation, updateLocation, deleteLocation, refreshLocations } = useLocations()
  const { textSize } = useTextSize()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEdit = (location: Location) => {
    setSelectedLocation(location)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (location: Location) => {
    setSelectedLocation(location)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedLocation) {
      setIsSubmitting(true)
      try {
        await deleteLocation(selectedLocation.id)
      } catch (error) {
        console.error("Error during delete:", error)
      } finally {
        setIsSubmitting(false)
        setIsDeleteDialogOpen(false)
      }
    }
  }

  const handleAddSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      await createLocation(values)
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error during create:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (values: any) => {
    if (selectedLocation) {
      setIsSubmitting(true)
      try {
        await updateLocation({ id: selectedLocation.id, ...values })
        setIsEditDialogOpen(false)
      } catch (error) {
        console.error("Error during update:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleRefresh = () => {
    refreshLocations()
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
                <TableHead className={textClasses.tableHeader}>Address</TableHead>
                <TableHead className={textClasses.tableHeader}>Status</TableHead>
                <TableHead className={`text-right ${textClasses.tableHeader}`}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className={`text-center py-6 ${textClasses.tableCell}`}>
                    <div className="flex justify-center items-center">
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                      Loading locations...
                    </div>
                  </TableCell>
                </TableRow>
              ) : locations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className={`text-center py-6 ${textClasses.tableCell}`}>
                    {error ? (
                      <div>
                        <p>Error loading locations.</p>
                      </div>
                    ) : (
                      <div>
                        <p>No locations found. Click "Add Location" to create one.</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className={`font-medium ${textClasses.tableCell}`}>{location.name}</TableCell>
                    <TableCell className={textClasses.tableCell}>{location.address || "—"}</TableCell>
                    <TableCell className={textClasses.tableCell}>
                      {location.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(location)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(location)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
     

      {/* Add Location Dialog */}
      <LocationForm
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddSubmit}
        isLoading={isSubmitting}
      />

      {/* Edit Location Dialog */}
      {selectedLocation && (
        <LocationForm
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleEditSubmit}
          location={selectedLocation}
          isLoading={isSubmitting}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the location <strong>{selectedLocation?.name}</strong>. This action cannot be undone.
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