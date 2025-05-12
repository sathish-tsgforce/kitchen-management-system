"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  ChefHat,
  Clipboard,
  Info,
  RefreshCw,
  Loader2,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
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
import type { Order } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useData } from "@/lib/context/data-context"

interface OrderPageProps {
  params: {
    id: string
  }
}

export default function OrderPage({ params }: OrderPageProps) {
  console.log("🔍 Component rendering")

  const router = useRouter()
  const { toast } = useToast()
  const { ingredients, recipes, refreshData } = useData()

  // Basic state
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [chefs, setChefs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("details")
  const [isCheckingInventory, setIsCheckingInventory] = useState(false)
  const [selectedChefId, setSelectedChefId] = useState<string>("none")
  const [restoreInventory, setRestoreInventory] = useState(true)

  // Inventory status
  const [inventoryStatus, setInventoryStatus] = useState<{
    isOk: boolean
    missingIngredients: { name: string; available: number; required: number; unit: string }[]
  } | null>(null)

  // Dialog state - consolidated into a single object
  const [dialogState, setDialogState] = useState({
    actionDialogOpen: false,
    actionType: null as "complete" | "cancel" | "accept" | "in_progress" | "revert" | null,
    assignChefDialogOpen: false,
  })

  // Processing state
  const [processingActions, setProcessingActions] = useState<Record<string, boolean>>({})

  // Refs
  const dataLoaded = useRef(false)
  const inventoryChecked = useRef(false)

  const orderId = Number.parseInt(params.id)

  // Load order data and check inventory on mount
  useEffect(() => {
    const fetchOrderData = async () => {
      // Prevent duplicate fetches
      if (dataLoaded.current) return

      try {
        setLoading(true)

        // Fetch order with all related data
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*, users(name, email)")
          .eq("id", orderId)
          .single()

        if (orderError) throw orderError
        if (!orderData) throw new Error("Order not found")

        // Fetch order items
        const { data: orderItemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*, menu_items(name)")
          .eq("order_id", orderId)

        if (itemsError) throw itemsError

        const items = orderItemsData.map((item) => ({
          menu_item_id: item.menu_item_id,
          name: item.menu_items?.name || "Unknown Item",
          quantity: item.quantity,
          price: item.price,
        }))

        // Calculate total
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

        const fullOrder = {
          ...orderData,
          chef_name: orderData.users?.name || orderData.users?.email || null,
          items,
          total,
        } as Order

        setOrder(fullOrder)
        setError(null)
        dataLoaded.current = true

        // Fetch chefs
        const { data: rolesData, error: rolesError } = await supabase
          .from("roles")
          .select("id")
          .ilike("name", "chef")
          .limit(1)

        if (rolesError) throw rolesError

        if (rolesData && rolesData.length > 0) {
          const chefRoleId = rolesData[0].id

          const { data: chefsData, error: chefsError } = await supabase
            .from("users")
            .select("*")
            .eq("role_id", chefRoleId)

          if (chefsError) throw chefsError
          setChefs(chefsData || [])
        }
      } catch (err) {
        console.error("Error loading order:", err)
        setError(`Failed to load order: ${err.message || "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderData()
  }, [orderId])

  // Check inventory for pending orders in a separate effect
  useEffect(() => {
    const checkInventoryForPendingOrder = async () => {
      // Only check inventory once and only for pending orders
      if (inventoryChecked.current || !order || order.status !== "pending") return

      await checkInventory()
      inventoryChecked.current = true
    }

    if (order && !loading && ingredients.length > 0 && recipes.length > 0) {
      checkInventoryForPendingOrder()
    }
  }, [order, loading, ingredients, recipes])

  // Check inventory using local state
  const checkInventory = async () => {
    console.log("🔍 checkInventory - START")
    console.time("checkInventory")

    if (isCheckingInventory || !order) return null

    setIsCheckingInventory(true)

    try {
      // Check if there is sufficient inventory for the order
      const result = checkInventoryForOrder(order, recipes, ingredients)
      setInventoryStatus(result)
      return result
    } catch (error) {
      console.error("Error checking inventory:", error)
      toast({
        title: "Error checking inventory",
        description: "Failed to check inventory. Please try again.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsCheckingInventory(false)
      console.timeEnd("checkInventory")
      console.log("🔍 checkInventory - END")
    }
  }

  // Replace the updateOrderStatus function with this implementation
  const updateOrderStatus = useCallback(
    (status: string, shouldRestoreInventory = false) => {
      console.log(`🔍 updateOrderStatus - START (status: ${status}, restore: ${shouldRestoreInventory})`)
      console.time("updateOrderStatus")

      try {
        // 1. IMMEDIATELY close dialog and update UI state
        console.log("🔍 Closing dialog")
        console.time("closeDialog")
        setDialogState((prev) => ({ ...prev, actionDialogOpen: false }))
        console.timeEnd("closeDialog")

        console.log("🔍 Setting processing state")
        console.time("setProcessing")
        setIsProcessing(true)
        console.timeEnd("setProcessing")

        // 2. Update local state immediately for responsive UI
        console.log("🔍 Updating order state")
        console.time("updateOrderState")
        setOrder((prevOrder) => {
          console.log("🔍 Inside setOrder callback")
          return prevOrder ? { ...prevOrder, status } : null
        })
        console.timeEnd("updateOrderState")

        // 3. Show toast to indicate the process has started
        console.log("🔍 Showing toast")
        console.time("showToast")
        toast({
          title: "Updating order",
          description: "Order status is being updated...",
        })
        console.timeEnd("showToast")

        console.log("🔍 UI updates complete, starting database operations")

        // 4. Start database operations WITHOUT awaiting them
        console.log("🔍 Starting database update")
        console.time("databaseUpdate")

        // Special handling for accepting - check inventory first
        if (status === "accepted") {
          console.log("🔍 Checking inventory for accept action")
          const inventoryResult = inventoryStatus
          if (!inventoryResult || !inventoryResult.isOk) {
            console.log("🔍 Insufficient inventory, cancelling operation")
            toast({
              title: "Insufficient inventory",
              description: "This order cannot be accepted due to insufficient ingredients.",
              variant: "destructive",
            })
            setIsProcessing(false)
            console.timeEnd("updateOrderStatus")
            console.log("🔍 updateOrderStatus - END (early return due to inventory)")
            return
          }
        }

        // Update database in background
        supabase
          .from("orders")
          .update({ status })
          .eq("id", orderId)
          .then(({ error }) => {
            console.log("🔍 Database update completed", error ? "with error" : "successfully")
            console.timeEnd("databaseUpdate")

            if (error) {
              console.error("Error updating order status:", error)
              toast({
                title: "Error",
                description: "There was an error updating the order status. The UI has been updated anyway.",
                variant: "destructive",
              })
              return
            }

            // 5. Handle inventory updates in background
            if (status === "accepted" && order) {
              console.log("🔍 Starting inventory updates for accepted order")
              console.time("inventoryUpdates")
              // Process inventory updates in the background
              handleInventoryUpdates(order, recipes, ingredients, false)
              console.timeEnd("inventoryUpdates")
            } else if (status === "pending" && shouldRestoreInventory && order) {
              console.log("🔍 Starting inventory restoration")
              console.time("inventoryRestoration")
              // Process inventory restoration in the background
              handleInventoryUpdates(order, recipes, ingredients, true)
              console.timeEnd("inventoryRestoration")
            }

            toast({
              title: "Order updated",
              description: getStatusChangeMessage(status, shouldRestoreInventory),
            })
          })
          .catch((err) => {
            console.error("Error in database operation:", err)
            toast({
              title: "Error",
              description: "An unexpected error occurred. The UI has been updated anyway.",
              variant: "destructive",
            })
          })
          .finally(() => {
            // 6. Always clean up processing state and refresh data
            console.log("🔍 Cleaning up processing state")
            setIsProcessing(false)
            console.log("🔍 Refreshing data")
            refreshData()
            console.timeEnd("updateOrderStatus")
            console.log("🔍 updateOrderStatus - END")
          })
      } catch (error) {
        console.error("Error in updateOrderStatus:", error)
        setIsProcessing(false)
        console.timeEnd("updateOrderStatus")
        console.log("🔍 updateOrderStatus - END (with error)")
      }
    },
    [orderId, order, refreshData, toast, ingredients, recipes, inventoryStatus],
  )

  // Helper function to process inventory updates in batches
  const processInventoryUpdates = async (order, recipes, ingredients, isRestoring) => {
    // Collect all inventory operations that need to be performed
    const operations = []

    for (const item of order.items) {
      const recipe = recipes.find((r) => r.menu_item_id === item.menu_item_id)
      if (recipe) {
        for (const ingredient of recipe.ingredients) {
          operations.push({
            ingredientId: ingredient.ingredient_id,
            quantity: ingredient.quantity_for_recipe * item.quantity,
            isRestoring,
          })
        }
      }
    }

    // Process operations in batches of 5 to prevent UI freezing
    const BATCH_SIZE = 5
    const BATCH_DELAY = 50 // ms between batches

    for (let i = 0; i < operations.length; i += BATCH_SIZE) {
      const batch = operations.slice(i, i + BATCH_SIZE)

      // Process this batch
      await Promise.all(
        batch.map(async (op) => {
          try {
            // Get current ingredient quantity
            const { data: currentIngredient, error: getError } = await supabase
              .from("ingredients")
              .select("quantity")
              .eq("id", op.ingredientId)
              .single()

            if (getError) {
              console.error(`Error getting ingredient ${op.ingredientId}:`, getError)
              return
            }

            if (!currentIngredient) return

            // Calculate new quantity
            let newQuantity
            if (op.isRestoring) {
              // Add ingredients back to inventory
              newQuantity = currentIngredient.quantity + op.quantity
            } else {
              // Remove ingredients from inventory (don't go below 0)
              newQuantity = Math.max(0, currentIngredient.quantity - op.quantity)
            }

            // Update the ingredient quantity
            const { error: updateError } = await supabase
              .from("ingredients")
              .update({ quantity: newQuantity })
              .eq("id", op.ingredientId)

            if (updateError) {
              console.error(`Error updating ingredient ${op.ingredientId}:`, updateError)
            }
          } catch (err) {
            console.error(`Error processing ingredient ${op.ingredientId}:`, err)
          }
        }),
      )

      // If this isn't the last batch, add a small delay to allow UI to breathe
      if (i + BATCH_SIZE < operations.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY))
      }
    }
  }

  // Helper function to get appropriate status change message
  const getStatusChangeMessage = (status, restoredInventory) => {
    switch (status) {
      case "pending":
        return restoredInventory
          ? "Order has been reverted to pending and inventory has been restored."
          : "Order has been reverted to pending."
      case "accepted":
        return "Order has been accepted."
      case "in_progress":
        return "Order has been set to in progress."
      case "completed":
        return "Order has been completed."
      case "cancelled":
        return "Order has been cancelled."
      default:
        return "Order status has been updated."
    }
  }

  // Update the confirmAction function to handle the revert action more efficiently
  const confirmAction = useCallback(() => {
    console.log("🔍 confirmAction - START")
    console.time("confirmAction")

    if (!dialogState.actionType) {
      console.log("🔍 confirmAction - No action type, returning early")
      console.timeEnd("confirmAction")
      return
    }

    let status = ""
    switch (dialogState.actionType) {
      case "complete":
        status = "completed"
        break
      case "cancel":
        status = "cancelled"
        break
      case "accept":
        status = "accepted"
        break
      case "in_progress":
        status = "in_progress"
        break
      case "revert":
        status = "pending"
        break
    }

    console.log(`🔍 confirmAction - Calling updateOrderStatus with status: ${status}`)

    // For revert action, pass the restore inventory flag
    if (dialogState.actionType === "revert") {
      updateOrderStatus(status, restoreInventory)
    } else {
      updateOrderStatus(status, false)
    }

    console.timeEnd("confirmAction")
    console.log("🔍 confirmAction - END")
  }, [dialogState.actionType, updateOrderStatus, restoreInventory])

  // Handle assign chef
  const handleAssignChef = useCallback(() => {
    console.log("🔍 handleAssignChef - START")
    if (order) {
      setSelectedChefId(order.chef_id || "none")
      setDialogState((prev) => ({ ...prev, assignChefDialogOpen: true }))
    }
    console.log("🔍 handleAssignChef - END")
  }, [order])

  // Manual inventory check
  const handleManualInventoryCheck = useCallback(async () => {
    console.log("🔍 handleManualInventoryCheck - START")
    console.time("manualInventoryCheck")

    const result = await checkInventory()

    if (result) {
      toast({
        title: result.isOk ? "Inventory check complete" : "Insufficient inventory",
        description: result.isOk
          ? "There is sufficient inventory for this order."
          : "This order cannot be accepted due to insufficient ingredients.",
        variant: result.isOk ? "default" : "destructive",
      })
    }

    console.timeEnd("manualInventoryCheck")
    console.log("🔍 handleManualInventoryCheck - END")
  }, [toast])

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return "Not specified"

    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch (e) {
      return dateString || "Not specified"
    }
  }, [])

  // Handle order action
  const handleAction = (actionType: "complete" | "cancel" | "accept" | "in_progress" | "revert") => {
    console.log(`🔍 handleAction - START (${actionType})`)
    setDialogState((prev) => ({ ...prev, actionDialogOpen: true, actionType }))
    console.log("🔍 handleAction - END")
  }

  // Replace the assignChef function with this implementation
  const assignChef = useCallback(() => {
    console.log("🔍 assignChef - START")
    console.time("assignChef")

    try {
      // 1. IMMEDIATELY close dialog and update UI state
      console.log("🔍 Closing chef dialog")
      console.time("closeChefDialog")
      setDialogState((prev) => ({ ...prev, assignChefDialogOpen: false }))
      console.timeEnd("closeChefDialog")

      console.log("🔍 Setting processing state")
      console.time("setChefProcessing")
      setIsProcessing(true)
      console.timeEnd("setChefProcessing")

      const chefId = selectedChefId === "none" ? null : selectedChefId

      // 2. Update UI immediately
      console.log("🔍 Updating chef in UI")
      console.time("updateChefUI")
      setOrder((prev) => {
        console.log("🔍 Inside setOrder callback for chef")
        return prev
          ? {
              ...prev,
              chef_id: chefId,
              chef_name: chefs.find((c) => c.id === chefId)?.name || chefs.find((c) => c.id === chefId)?.email || null,
            }
          : null
      })
      console.timeEnd("updateChefUI")

      // 3. Show toast
      console.log("🔍 Showing chef toast")
      console.time("showChefToast")
      toast({
        title: "Assigning chef",
        description: "Chef assignment is being updated...",
      })
      console.timeEnd("showChefToast")

      console.log("🔍 Chef UI updates complete, starting database operations")

      // 4. Update database in the background with error handling
      console.log("🔍 Starting chef database update")
      console.time("chefDatabaseUpdate")

      // Add timeout to prevent hanging indefinitely
      const timeoutMs = 15000 // 15 seconds timeout

      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Database operation timed out")), timeoutMs)
      })

      // The actual database operation
      const dbOperation = supabase.from("orders").update({ chef_id: chefId }).eq("id", orderId)

      // Race the database operation against the timeout
      Promise.race([dbOperation, timeoutPromise])
        .then((result) => {
          if (result && "error" in result) {
            const { error } = result
            console.log("🔍 Chef database update completed with error", error)
            console.timeEnd("chefDatabaseUpdate")

            if (error) {
              console.error("Error assigning chef:", error)
              toast({
                title: "Error",
                description: "There was an error assigning the chef. The UI has been updated anyway.",
                variant: "destructive",
              })
              return
            }
          }

          console.log("🔍 Chef database update completed successfully")
          console.timeEnd("chefDatabaseUpdate")

          toast({
            title: "Chef assigned",
            description: `Chef has been ${chefId ? "assigned to" : "removed from"} the order.`,
          })
        })
        .catch((err) => {
          console.error("Error in chef database operation:", err)
          toast({
            title: "Error",
            description: "Database operation timed out. The UI has been updated anyway.",
            variant: "destructive",
          })
        })
        .finally(() => {
          // 5. Always clean up processing state and refresh data
          console.log("🔍 Cleaning up chef processing state")
          setIsProcessing(false)
          console.log("🔍 Refreshing data after chef update")
          refreshData()
          console.timeEnd("assignChef")
          console.log("🔍 assignChef - END")
        })
    } catch (error) {
      console.error("Error in assignChef:", error)
      setIsProcessing(false)
      console.timeEnd("assignChef")
      console.log("🔍 assignChef - END (with error)")
    }
  }, [orderId, selectedChefId, chefs, refreshData, toast])

  // Show loading state
  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64 flex-col">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-xl">Loading order details...</p>
        </div>
      </main>
    )
  }

  // Show error state
  if (error || !order) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Link
          href="/orders"
          className="inline-flex items-center text-lg text-gray-700 hover:text-gray-900 mb-6 focus:outline-none focus:underline"
          aria-label="Back to orders"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Orders
        </Link>

        <Alert variant="destructive" className="mb-8">
          <AlertTitle className="text-xl font-bold">Error</AlertTitle>
          <AlertDescription className="text-lg">
            {error || "Order not found. Please check the order ID and try again."}
          </AlertDescription>
        </Alert>

        <Button onClick={() => router.push("/orders")} className="bg-green-700 hover:bg-green-800 text-white mr-4">
          Return to Orders
        </Button>

        <Button
          onClick={() => {
            dataLoaded.current = false
            inventoryChecked.current = false
            router.refresh()
          }}
          variant="outline"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </main>
    )
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 text-lg py-1 px-3">Pending</Badge>
      case "accepted":
        return <Badge className="bg-blue-600 text-lg py-1 px-3">Accepted</Badge>
      case "in_progress":
        return <Badge className="bg-purple-600 text-lg py-1 px-3">In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-600 text-lg py-1 px-3">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-600 text-lg py-1 px-3">Cancelled</Badge>
      default:
        return <Badge className="text-lg py-1 px-3">{status}</Badge>
    }
  }

  console.log("🔍 Rendering component UI")

  return (
    <main className="container mx-auto px-4 py-8">
      <Link
        href="/orders"
        className="inline-flex items-center text-lg text-gray-700 hover:text-gray-900 mb-6 focus:outline-none focus:underline"
        aria-label="Back to orders"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back to Orders
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Order #{order.id}</h1>
          <div className="flex items-center mt-2">
            <p className="text-xl text-gray-700">{format(new Date(order.date), "MMMM d, yyyy")}</p>
            <span className="mx-2 text-gray-400">•</span>
            <div>{getStatusBadge(order.status)}</div>
          </div>
        </div>
        <div className="flex gap-4 flex-wrap">
          {order.status === "pending" && (
            <>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-medium h-auto"
                aria-label={`Accept order #${order.id}`}
                onClick={() => handleAction("accept")}
                disabled={isProcessing || (inventoryStatus && !inventoryStatus.isOk)}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-5 w-5" />
                )}
                Accept Order
              </Button>
              <Button
                variant="outline"
                className="px-6 py-3 rounded-lg text-lg font-medium h-auto"
                aria-label="Check inventory"
                onClick={handleManualInventoryCheck}
                disabled={isCheckingInventory}
              >
                {isCheckingInventory ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-5 w-5" />
                )}
                Check Inventory
              </Button>
              <Button
                variant="destructive"
                className="px-6 py-3 rounded-lg text-lg font-medium h-auto"
                aria-label={`Cancel order #${order.id}`}
                onClick={() => handleAction("cancel")}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-5 w-5" />
                )}
                Cancel Order
              </Button>
            </>
          )}

          {order.status === "accepted" && (
            <>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-lg font-medium h-auto"
                aria-label={`Set order #${order.id} to in progress`}
                onClick={() => handleAction("in_progress")}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
                Set In Progress
              </Button>
              <Button
                variant="outline"
                className="px-6 py-3 rounded-lg text-lg font-medium h-auto"
                aria-label={`Revert order #${order.id} to pending`}
                onClick={() => handleAction("revert")}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <ArrowLeft className="mr-2 h-5 w-5" />
                )}
                Revert to Pending
              </Button>
            </>
          )}

          {order.status === "in_progress" && (
            <>
              <Button
                className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg text-lg font-medium h-auto"
                aria-label={`Complete order #${order.id}`}
                onClick={() => handleAction("complete")}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-5 w-5" />
                )}
                Complete Order
              </Button>
              <Button
                variant="outline"
                className="px-6 py-3 rounded-lg text-lg font-medium h-auto"
                aria-label={`Revert order #${order.id} to pending`}
                onClick={() => handleAction("revert")}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <ArrowLeft className="mr-2 h-5 w-5" />
                )}
                Revert to Pending
              </Button>
            </>
          )}

          {(order.status === "pending" || order.status === "accepted" || order.status === "in_progress") && (
            <Button
              variant="outline"
              className="px-6 py-3 rounded-lg text-lg font-medium h-auto"
              aria-label={`Assign chef to order #${order.id}`}
              onClick={handleAssignChef}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
              {order.chef_id ? "Reassign Chef" : "Assign Chef"}
            </Button>
          )}
        </div>
      </div>

      {/* Show inventory warning for pending orders */}
      {order.status === "pending" && inventoryStatus && !inventoryStatus.isOk && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-xl font-bold">Insufficient Ingredients</AlertTitle>
          <AlertDescription className="text-lg">
            <p>This order cannot be accepted due to insufficient ingredients:</p>
            <ul className="list-disc pl-5 mt-2">
              {inventoryStatus.missingIngredients.map((item, index) => (
                <li key={index}>
                  {item.name}: Available {item.available.toFixed(2)}
                  {item.unit}, Required {item.required.toFixed(2)}
                  {item.unit}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Order Details</TabsTrigger>
          <TabsTrigger value="items">Order Items</TabsTrigger>
          {order.notes && <TabsTrigger value="notes">Notes</TabsTrigger>}
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="text-lg font-semibold">{order.customer_name || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Delivery Address</h3>
                  <p className="text-lg">{order.delivery_address || "Not specified"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
                  <p className="text-lg">{formatDate(order.date)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Delivery Date</h3>
                  <p className="text-lg">{formatDate(order.delivery_date)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Kitchen Location</h3>
                  <p className="text-lg">{order.kitchen_location || "Not specified"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <ChefHat className="mr-2 h-5 w-5" />
                  Chef Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.chef_id ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Assigned Chef</h3>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{order.chef_name}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <Info className="h-5 w-5 mr-2" />
                    <p>No chef assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                  <p className="text-2xl font-bold">${order.total.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Items</h3>
                  <p className="text-lg">{order.items.length} items</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Clipboard className="mr-2 h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Item ID</TableHead>
                      <TableHead>Menu Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.menu_item_id}>
                        <TableCell className="font-medium">{item.menu_item_id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-bold">${order.total.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {order.notes && (
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Info className="mr-2 h-5 w-5" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Action Confirmation Dialog */}
      <AlertDialog
        open={dialogState.actionDialogOpen}
        onOpenChange={(open) => {
          console.log(`🔍 Action dialog open state changing to: ${open}`)
          setDialogState((prev) => ({ ...prev, actionDialogOpen: open }))
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.actionType === "complete"
                ? "This will mark the order as completed."
                : dialogState.actionType === "cancel"
                  ? "This will cancel the order. Any reserved inventory will be released."
                  : dialogState.actionType === "accept"
                    ? "This will accept the order and update inventory accordingly."
                    : dialogState.actionType === "in_progress"
                      ? "This will mark the order as in progress."
                      : "This will revert the order to pending status."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {dialogState.actionType === "revert" && (
            <div className="py-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restore-inventory"
                  checked={restoreInventory}
                  onCheckedChange={(checked) => {
                    console.log(`🔍 Restore inventory checkbox changed to: ${checked}`)
                    setRestoreInventory(checked === true)
                  }}
                />
                <label
                  htmlFor="restore-inventory"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Restore inventory (add ingredients back to stock)
                </label>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => console.log("🔍 Action dialog cancelled")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log("🔍 Action dialog confirmed, calling confirmAction")
                confirmAction()
              }}
              disabled={
                isProcessing || (dialogState.actionType === "accept" && inventoryStatus && !inventoryStatus.isOk)
              }
              className={
                dialogState.actionType === "complete"
                  ? "bg-green-600 hover:bg-green-700"
                  : dialogState.actionType === "cancel"
                    ? "bg-red-600 hover:bg-red-700"
                    : dialogState.actionType === "accept"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : dialogState.actionType === "in_progress"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {dialogState.actionType === "complete"
                ? "Complete Order"
                : dialogState.actionType === "cancel"
                  ? "Cancel Order"
                  : dialogState.actionType === "accept"
                    ? "Accept Order"
                    : dialogState.actionType === "in_progress"
                      ? "Set In Progress"
                      : "Revert to Pending"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Chef Dialog */}
      <AlertDialog
        open={dialogState.assignChefDialogOpen}
        onOpenChange={(open) => {
          console.log(`🔍 Chef dialog open state changing to: ${open}`)
          setDialogState((prev) => ({ ...prev, assignChefDialogOpen: open }))
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Chef</AlertDialogTitle>
            <AlertDialogDescription>Select a chef to assign to this order.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              value={selectedChefId}
              onValueChange={(value) => {
                console.log(`🔍 Chef selection changed to: ${value}`)
                setSelectedChefId(value)
              }}
            >
              <SelectTrigger className="w-full">
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
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => console.log("🔍 Chef dialog cancelled")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log("🔍 Chef dialog confirmed, calling assignChef")
                assignChef()
              }}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Assign Chef
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

// Helper function to check if there is sufficient inventory for an order
function checkInventoryForOrder(order: Order, recipes: any[], ingredients: any[]) {
  console.log("🔍 checkInventoryForOrder - START")
  console.time("checkInventoryForOrder")

  // Create a map of ingredient IDs to quantities
  const ingredientQuantities: { [ingredientId: number]: number } = {}
  const missingIngredients: { name: string; available: number; required: number; unit: string }[] = []

  // Iterate over the order items
  for (const item of order.items) {
    // Find the recipe for the menu item
    const recipe = recipes.find((r) => r.menu_item_id === item.menu_item_id)
    if (!recipe) {
      console.log(`🔍 Recipe not found for menu item ${item.menu_item_id}`)
      console.timeEnd("checkInventoryForOrder")
      return {
        isOk: false,
        message: `Recipe not found for menu item ${item.menu_item_id}`,
        missingIngredients,
      }
    }

    // Iterate over the recipe ingredients
    for (const recipeIngredient of recipe.ingredients) {
      // Get the ingredient ID and quantity
      const ingredientId = recipeIngredient.ingredient_id
      const quantity = recipeIngredient.quantity_for_recipe * item.quantity

      // Add the quantity to the ingredient quantities map
      if (ingredientQuantities[ingredientId]) {
        ingredientQuantities[ingredientId] += quantity
      } else {
        ingredientQuantities[ingredientId] = quantity
      }
    }
  }

  // Iterate over the ingredient quantities map
  for (const ingredientId in ingredientQuantities) {
    // Get the ingredient
    const ingredient = ingredients.find((i) => i.id === Number(ingredientId))
    if (!ingredient) {
      console.log(`🔍 Ingredient not found for ID ${ingredientId}`)
      console.timeEnd("checkInventoryForOrder")
      return {
        isOk: false,
        message: `Ingredient not found for ID ${ingredientId}`,
        missingIngredients,
      }
    }

    // Check if there is sufficient quantity
    if (ingredient.quantity < ingredientQuantities[ingredientId]) {
      console.log(`🔍 Insufficient quantity for ingredient ${ingredient.name}`)
      missingIngredients.push({
        name: ingredient.name,
        available: ingredient.quantity,
        required: ingredientQuantities[ingredientId],
        unit: ingredient.unit || "",
      })
    }
  }

  // If there are missing ingredients, return false
  if (missingIngredients.length > 0) {
    console.log(`🔍 Found ${missingIngredients.length} missing ingredients`)
    console.timeEnd("checkInventoryForOrder")
    return {
      isOk: false,
      message: "Insufficient inventory",
      missingIngredients,
    }
  }

  // If all ingredients have sufficient quantity, return true
  console.log("🔍 All ingredients have sufficient quantity")
  console.timeEnd("checkInventoryForOrder")
  return {
    isOk: true,
    message: "Sufficient inventory",
    missingIngredients: [],
  }
}

// Add this helper function for inventory updates
const handleInventoryUpdates = (order, recipes, ingredients, isRestoring = false) => {
  console.log(`🔍 handleInventoryUpdates - START (isRestoring: ${isRestoring})`)
  console.time("handleInventoryUpdates")

  // Process each order item one by one
  order.items.forEach((item) => {
    const recipe = recipes.find((r) => r.menu_item_id === item.menu_item_id)
    if (!recipe) {
      console.log(`🔍 Recipe not found for menu item ${item.menu_item_id}`)
      return
    }

    // Process each ingredient one by one
    recipe.ingredients.forEach((ingredient) => {
      console.log(`🔍 Processing ingredient ${ingredient.ingredient_id}`)

      // First get the current quantity
      supabase
        .from("ingredients")
        .select("quantity")
        .eq("id", ingredient.ingredient_id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            console.error(`Error getting ingredient ${ingredient.ingredient_id}:`, error)
            return
          }

          // Calculate new quantity
          const quantityChange = ingredient.quantity_for_recipe * item.quantity
          const newQuantity = isRestoring
            ? data.quantity + quantityChange // Add back to inventory
            : Math.max(0, data.quantity - quantityChange) // Remove from inventory

          console.log(`🔍 Updating ingredient ${ingredient.ingredient_id} from ${data.quantity} to ${newQuantity}`)

          // Update the ingredient quantity
          supabase
            .from("ingredients")
            .update({ quantity: newQuantity })
            .eq("id", ingredient.ingredient_id)
            .then(({ error: updateError }) => {
              if (updateError) {
                console.error(`Error updating ingredient ${ingredient.ingredient_id}:`, updateError)
              } else {
                console.log(`🔍 Successfully updated ingredient ${ingredient.ingredient_id}`)
              }
            })
        })
    })
  })

  console.timeEnd("handleInventoryUpdates")
  console.log("🔍 handleInventoryUpdates - END")
}
