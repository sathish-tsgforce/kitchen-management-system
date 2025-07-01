import { supabase } from "@/lib/supabase"
import type { Order } from "@/lib/types"

export async function fetchOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, users(name, email)")
      .order("date", { ascending: false })

    if (error) throw error

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      data.map(async (order) => {
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("*, menu_items(name)")
          .eq("order_id", order.id)

        if (itemsError) {
          console.error(`Error fetching items for order ${order.id}:`, itemsError)
          return {
            ...order,
            chef_name: order.users?.name || order.users?.email || null,
            items: [],
            total: 0,
          }
        }

        const items = orderItems.map((item) => ({
          menu_item_id: item.menu_item_id,
          name: item.menu_items?.name || "Unknown Item",
          quantity: item.quantity,
          price: item.price,
        }))

        // Calculate total
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

        return {
          ...order,
          chef_name: order.users?.name || order.users?.email || null,
          items,
          total,
        }
      }),
    )

    return ordersWithItems
  } catch (error) {
    console.error("Error fetching orders:", error)
    throw error
  }
}

export async function fetchOrderById(id: number): Promise<Order | null> {
  try {
    const { data, error } = await supabase.from("orders").select("*, users(name, email)").eq("id", id).single()

    if (error) throw error
    if (!data) return null

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*, menu_items(name)")
      .eq("order_id", id)

    if (itemsError) throw itemsError

    const items = orderItems.map((item) => ({
      menu_item_id: item.menu_item_id,
      name: item.menu_items?.name || "Unknown Item",
      quantity: item.quantity,
      price: item.price,
    }))

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return {
      ...data,
      chef_name: data.users?.name || data.users?.email || null,
      items,
      total,
    }
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error)
    return null
  }
}

export async function getOrderStatusColor(status: string): Promise<string> {
  switch (status) {
    case "pending":
      return "bg-yellow-500"
    case "accepted":
      return "bg-blue-600"
    case "in_progress":
      return "bg-purple-600"
    case "completed":
      return "bg-green-800"
    case "cancelled":
      return "bg-red-600"
    default:
      return "bg-gray-500"
  }
}

export async function getOrderStatusText(status: string): Promise<string> {
  switch (status) {
    case "pending":
      return "Pending"
    case "accepted":
      return "Accepted"
    case "in_progress":
      return "In Progress"
    case "completed":
      return "Completed"
    case "cancelled":
      return "Cancelled"
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}
