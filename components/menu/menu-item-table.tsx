"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useMenuItems, useDeleteMenuItem } from "@/lib/hooks/use-menu-items"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Edit, Trash2, Plus, Divide } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import { Skeleton } from "@/components/ui/skeleton"
import { useTextSize } from "@/lib/context/text-size-context"

export function MenuItemTable() {
  const { data: menuItems, isLoading, isError } = useMenuItems()
  const deleteMenuItem = useDeleteMenuItem()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const { textSize } = useTextSize()

  // Handle delete confirmation
  const handleDelete = (id: number) => {
    setDeleteId(id)
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (deleteId !== null) {
      await deleteMenuItem.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  // Cancel delete
  const cancelDelete = () => {
    setDeleteId(null)
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
          <div className="flex justify-end mb-4">
            <Skeleton className="h-10 w-32" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Min. Order</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-16 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-red-500">Error loading menu items. Please try again later.</div>
        </CardContent>
      </Card>
    )
  }

  return (
   <div className="flex flex-col h-full">
        {menuItems && menuItems.length > 0 ? (
          <div className="rounded-md border">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Min. Order</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="relative h-16 w-16 rounded-md overflow-hidden">
                      <Image
                        src={item.image_url || "/recipe_placeholder.jpg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className={`font-medium ${textClasses.tableCell}`}>{item.name}</TableCell>
                  <TableCell className={`max-w-xs truncate ${textClasses.tableCell}`}>{item.description || "No description"}</TableCell>
                  <TableCell className={textClasses.tableCell}>{item.minimum_order_quantity}</TableCell>
                  <TableCell className={textClasses.tableCell}>{formatCurrency(item.price)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/menu/${item.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-8 border rounded-md">
            <p className={`text-gray-500 ${textClasses.tableCell}`}>No menu items found.</p>

          </div>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={cancelDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the menu item and remove the image from
                storage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
