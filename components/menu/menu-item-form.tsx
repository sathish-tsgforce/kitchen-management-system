"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useAddMenuItem, useUpdateMenuItem } from "@/lib/hooks/use-menu-items"
import type { MenuItem } from "@/lib/types"
import { ImagePlus, X } from "lucide-react"

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  minimum_order_quantity: z.coerce.number().int().min(1, "Minimum order quantity must be at least 1"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
})

type MenuItemFormValues = z.infer<typeof formSchema>

interface MenuItemFormProps {
  menuItem?: MenuItem
  isEditing?: boolean
}

export function MenuItemForm({ menuItem, isEditing = false }: MenuItemFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(menuItem?.image_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addMenuItem = useAddMenuItem()
  const updateMenuItem = useUpdateMenuItem()

  // Initialize form with default values or existing menu item data
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: menuItem?.name || "",
      description: menuItem?.description || "",
      minimum_order_quantity: menuItem?.minimum_order_quantity || 1,
      price: menuItem?.price || 0,
    },
  })

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Clear selected image
  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle form submission
  const onSubmit = async (values: MenuItemFormValues) => {
    try {
      if (isEditing && menuItem?.id) {
        // Update existing menu item
        await updateMenuItem.mutateAsync({
          id: menuItem.id,
          menuItem: {
            ...values,
            image_url: imageFile ? undefined : imagePreview,
          },
          imageFile: imageFile || undefined,
        })
      } else {
        // Add new menu item
        await addMenuItem.mutateAsync({
          menuItem: {
            ...values,
            image_url: null, // Will be set by the API after upload
          },
          imageFile: imageFile || undefined,
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  const isLoading = addMenuItem.isPending || updateMenuItem.isPending

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter menu item name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter menu item description"
                          className="min-h-[120px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minimum_order_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Order Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" step="1" {...field} />
                        </FormControl>
                        <FormDescription>Minimum quantity per order</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>Price per unit</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Menu Item Image
                  </label>
                  <div className="mt-2 flex flex-col items-center">
                    <div className="relative w-full h-64 border rounded-md overflow-hidden bg-gray-50">
                      {imagePreview ? (
                        <>
                          <Image
                            src={imagePreview || "/placeholder.svg"}
                            alt="Menu item preview"
                            fill
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={clearImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <ImagePlus className="h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">No image selected</p>
                        </div>
                      )}
                    </div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="mt-4"
                      onChange={handleImageChange}
                    />
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Upload an image of the menu item. Recommended size: 800x600 pixels.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : isEditing ? "Update Menu Item" : "Add Menu Item"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
