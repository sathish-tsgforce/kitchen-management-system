"use client"

import { useMenuItem } from "@/lib/hooks/use-menu-items"
import { MenuItemForm } from "@/components/menu/menu-item-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { use } from "react"

export default function EditMenuItemPage({ params }: { params: { id: string } }) {
  const resolvedParams = use(params)
  const id = Number.parseInt(resolvedParams.id)
  const { data: menuItem, isLoading, isError } = useMenuItem(id)

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Skeleton className="h-10 w-32 mr-4" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (isError || !menuItem) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/menu">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Menu
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Menu Item Not Found</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          The menu item you are trying to edit does not exist or could not be loaded.
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/menu">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Menu Item</h1>
      </div>
      <MenuItemForm menuItem={menuItem} isEditing />
    </div>
  )
}
