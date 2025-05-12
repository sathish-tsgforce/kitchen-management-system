"use client"

import type React from "react"

// Custom hook for order form logic
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import type { Order, MenuItem } from "@/lib/types"

interface UseOrderFormProps {
  menuItems: MenuItem[]
  userId?: string
  onSave: (order: Omit<Order, "id">) => Promise<void>
}

export function useOrderForm({ menuItems, userId, onSave }: UseOrderFormProps) {
  const [formData, setFormData] = useState({
    customer_name: "",
    delivery_address: "",
    delivery_date: new Date(),
    kitchen_location: "Main Kitchen",
    chef_id: userId,
    notes: "",
    items: [] as { menu_item_id: number; name: string; quantity: number; price: number }[],
  })

  const [selectedMenuItem, setSelectedMenuItem] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const addItem = () => {
    if (!selectedMenuItem) return

    const menuItemId = Number.parseInt(selectedMenuItem)
    const menuItem = menuItems.find((item) => item.id === menuItemId)

    if (!menuItem) return

    // Check if item already exists in order
    const existingItemIndex = formData.items.findIndex((item) => item.menu_item_id === menuItemId)

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...formData.items]
      updatedItems[existingItemIndex].quantity += quantity

      setFormData({
        ...formData,
        items: updatedItems,
      })
    } else {
      // Add new item
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            menu_item_id: menuItemId,
            name: menuItem.name,
            quantity: quantity,
            price: menuItem.price || 0, // Default to 0 if price is undefined
          },
        ],
      })
    }

    // Reset selection
    setSelectedMenuItem("")
    setQuantity(1)
  }

  const removeItem = (index: number) => {
    const updatedItems = [...formData.items]
    updatedItems.splice(index, 1)

    setFormData({
      ...formData,
      items: updatedItems,
    })
  }

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + (item.price || 0) * item.quantity, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create new order
      await onSave({
        date: new Date().toISOString(),
        customer_name: formData.customer_name,
        delivery_address: formData.delivery_address,
        delivery_date: formData.delivery_date.toISOString(),
        kitchen_location: formData.kitchen_location,
        chef_id: formData.chef_id,
        items: formData.items,
        total: calculateTotal(),
        status: "pending",
        notes: formData.notes || undefined,
      })

      toast({
        title: "Order created",
        description: "The order has been created successfully.",
      })
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Error",
        description: "There was an error creating the order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    selectedMenuItem,
    quantity,
    isSubmitting,
    handleChange,
    setSelectedMenuItem,
    setQuantity,
    addItem,
    removeItem,
    calculateTotal,
    handleSubmit,
  }
}
