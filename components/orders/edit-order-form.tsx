"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { useData } from "@/lib/context/data-context"
import { toast } from "@/components/ui/use-toast"
import type { Order, MenuItem } from "@/lib/types"

interface EditOrderFormProps {
  order: Order
  onClose: () => void
}

export default function EditOrderForm({ order, onClose }: EditOrderFormProps) {
  const { updateOrder, menuItems, chefs, refreshData } = useData()
  const [formData, setFormData] = useState({
    customer_name: order.customer_name,
    delivery_address: order.delivery_address,
    delivery_date: format(new Date(order.delivery_date), "yyyy-MM-dd"),
    kitchen_location: order.kitchen_location,
    chef_id: order.chef_id || "none", // Use "none" instead of empty string
    notes: order.notes || "",
    items: [...order.items],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("")
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)

  // Find the selected menu item
  const getMenuItemById = (id: number): MenuItem | undefined => {
    return menuItems.find((item) => item.id === id)
  }

  // Add item to order
  const addItemToOrder = () => {
    if (!selectedMenuItem) return

    const menuItemId = Number.parseInt(selectedMenuItem)
    const menuItem = getMenuItemById(menuItemId)

    if (!menuItem) return

    // Check if item already exists in order
    const existingItemIndex = formData.items.findIndex((item) => item.menu_item_id === menuItemId)

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...formData.items]
      updatedItems[existingItemIndex].quantity += selectedQuantity
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
            quantity: selectedQuantity,
            price: menuItem.price,
          },
        ],
      })
    }

    // Reset selection
    setSelectedMenuItem("")
    setSelectedQuantity(1)
  }

  // Remove item from order
  const removeItemFromOrder = (menuItemId: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.menu_item_id !== menuItemId),
    })
  }

  // Update item quantity
  const updateItemQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(menuItemId)
      return
    }

    setFormData({
      ...formData,
      items: formData.items.map((item) => (item.menu_item_id === menuItemId ? { ...item, quantity } : item)),
    })
  }

  // Calculate total
  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (
        !formData.customer_name ||
        !formData.delivery_address ||
        !formData.delivery_date ||
        !formData.kitchen_location
      ) {
        throw new Error("Please fill in all required fields")
      }

      if (formData.items.length === 0) {
        throw new Error("Please add at least one item to the order")
      }

      // Format data for submission
      const updatedOrder = {
        customer_name: formData.customer_name,
        delivery_address: formData.delivery_address,
        delivery_date: new Date(formData.delivery_date).toISOString(),
        kitchen_location: formData.kitchen_location,
        chef_id: formData.chef_id === "none" ? null : formData.chef_id, // Convert "none" back to null
        notes: formData.notes,
        items: formData.items,
      }

      // Update order
      await updateOrder(order.id, updatedOrder)

      toast({
        title: "Order updated",
        description: "The order has been updated successfully.",
      })

      // Refresh data to ensure state is up to date
      refreshData()

      // Close form
      onClose()
    } catch (error: any) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: error.message || "There was an error updating the order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="customer_name" className="text-base">
            Customer Name *
          </Label>
          <Input
            id="customer_name"
            value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            className="text-base"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery_date" className="text-base">
            Delivery Date *
          </Label>
          <Input
            id="delivery_date"
            type="date"
            value={formData.delivery_date}
            onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
            className="text-base"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="delivery_address" className="text-base">
            Delivery Address *
          </Label>
          <Input
            id="delivery_address"
            value={formData.delivery_address}
            onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
            className="text-base"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kitchen_location" className="text-base">
            Kitchen Location *
          </Label>
          <Input
            id="kitchen_location"
            value={formData.kitchen_location}
            onChange={(e) => setFormData({ ...formData, kitchen_location: e.target.value })}
            className="text-base"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chef_id" className="text-base">
            Assigned Chef
          </Label>
          <Select value={formData.chef_id} onValueChange={(value) => setFormData({ ...formData, chef_id: value })}>
            <SelectTrigger id="chef_id" className="text-base">
              <SelectValue placeholder="Select chef" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="cursor-pointer">
                No chef assigned
              </SelectItem>
              {chefs.map((chef) => (
                <SelectItem key={chef.id} value={chef.id} className="cursor-pointer">
                  {chef.name || chef.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes" className="text-base">
            Notes
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="text-base min-h-[100px]"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Order Items</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="menu_item" className="text-base">
              Menu Item
            </Label>
            <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
              <SelectTrigger id="menu_item" className="text-base">
                <SelectValue placeholder="Select menu item" />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()} className="cursor-pointer">
                    {item.name} (${item.price.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-base">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={selectedQuantity}
              onChange={(e) => setSelectedQuantity(Number.parseInt(e.target.value) || 1)}
              className="text-base"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={addItemToOrder}
              disabled={!selectedMenuItem}
              className="bg-green-700 hover:bg-green-800 text-base"
            >
              Add Item
            </Button>
          </div>
        </div>

        {formData.items.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-md">
            <p className="text-gray-500">No items added to this order yet.</p>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Item</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Quantity</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Subtotal</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {formData.items.map((item) => (
                  <tr key={item.menu_item_id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-r-none"
                          onClick={() => updateItemQuantity(item.menu_item_id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.menu_item_id, Number.parseInt(e.target.value) || 0)}
                          className="h-7 w-16 rounded-none text-center p-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-l-none"
                          onClick={() => updateItemQuantity(item.menu_item_id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">${item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeItemFromOrder(item.menu_item_id)}
                      >
                        ×
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-4 py-3 text-base font-semibold text-right">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-base font-bold text-right">${calculateTotal().toFixed(2)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="text-base">
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-green-700 hover:bg-green-800 text-base"
          disabled={isSubmitting || formData.items.length === 0}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
