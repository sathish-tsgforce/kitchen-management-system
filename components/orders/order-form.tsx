"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import { useData } from "@/lib/context/data-context"
import { DialogClose } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

export default function OrderForm() {
  const { menuItems = [], addOrder, chefs = [] } = useData()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    customer_name: "",
    delivery_address: "",
    delivery_date: new Date(),
    kitchen_location: "Main Kitchen",
    chef_id: null as string | null,
    notes: "",
    items: [] as { menu_item_id: number; name: string; quantity: number; price: number }[],
  })

  const [selectedMenuItem, setSelectedMenuItem] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const kitchenLocations = ["Main Kitchen", "Downtown Kitchen", "Catering Kitchen", "Event Kitchen"]

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
      await addOrder({
        date: new Date().toISOString(),
        customer_name: formData.customer_name,
        delivery_address: formData.delivery_address,
        delivery_date: formData.delivery_date.toISOString(),
        kitchen_location: formData.kitchen_location,
        chef_id: formData.chef_id,
        items: formData.items,
        total: calculateTotal(),
        status: "pending", // Always start with pending
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="customer_name" className="text-lg">
            Customer Name
          </Label>
          <Input
            id="customer_name"
            value={formData.customer_name}
            onChange={(e) => handleChange("customer_name", e.target.value)}
            className="text-lg p-3 h-auto"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery_address" className="text-lg">
            Delivery Address
          </Label>
          <Input
            id="delivery_address"
            value={formData.delivery_address}
            onChange={(e) => handleChange("delivery_address", e.target.value)}
            className="text-lg p-3 h-auto"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery_date" className="text-lg">
            Delivery Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.delivery_date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.delivery_date ? format(formData.delivery_date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.delivery_date}
                onSelect={(date) => handleChange("delivery_date", date || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kitchen_location" className="text-lg">
            Kitchen Location
          </Label>
          <Select value={formData.kitchen_location} onValueChange={(value) => handleChange("kitchen_location", value)}>
            <SelectTrigger id="kitchen_location" className="text-lg p-3 h-auto">
              <SelectValue placeholder="Select kitchen location" />
            </SelectTrigger>
            <SelectContent>
              {kitchenLocations.map((location) => (
                <SelectItem key={location} value={location} className="cursor-pointer">
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chef_id" className="text-lg">
            Assign Chef (Optional)
          </Label>
          <Select
            value={formData.chef_id || "none"}
            onValueChange={(value) => handleChange("chef_id", value === "none" ? null : value)}
          >
            <SelectTrigger id="chef_id" className="text-lg p-3 h-auto">
              <SelectValue placeholder="Select a chef" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No chef assigned</SelectItem>
              {chefs.map((chef) => (
                <SelectItem key={chef.id} value={chef.id}>
                  {chef.name || chef.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes" className="text-lg">
            Order Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            className="text-lg p-3 min-h-[100px]"
            placeholder="Special instructions, allergies, etc."
          />
        </div>

        <div className="space-y-4 md:col-span-2">
          <h3 className="text-xl font-bold">Order Items</h3>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <Label htmlFor="menu_item" className="text-lg mb-2 block">
                Menu Item
              </Label>
              <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
                <SelectTrigger id="menu_item" className="text-lg p-3 h-auto">
                  <SelectValue placeholder="Select menu item" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()} className="cursor-pointer">
                      {item.name} - ${(item.price || 0).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-1/4">
              <Label htmlFor="quantity" className="text-lg mb-2 block">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
                className="text-lg p-3 h-auto"
              />
            </div>

            <div className="w-full md:w-1/4 flex items-end">
              <Button
                type="button"
                onClick={addItem}
                className="w-full bg-green-700 hover:bg-green-800 text-lg p-3 h-auto"
                disabled={!selectedMenuItem}
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Item
              </Button>
            </div>
          </div>

          {formData.items.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Menu Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${(item.price || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${((item.price || 0) * item.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeItem(index)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">${calculateTotal().toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-lg text-gray-500 mb-4">No items added to this order yet</p>
              <p className="text-md text-gray-400">Select a menu item and quantity above to add items</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="text-lg p-3 h-auto">
            Cancel
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-lg p-3 h-auto"
            disabled={
              formData.items.length === 0 || !formData.customer_name || !formData.delivery_address || isSubmitting
            }
          >
            {isSubmitting ? "Creating..." : "Create Order"}
          </Button>
        </DialogClose>
      </div>
    </form>
  )
}
