"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
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
import type { Order } from "@/lib/types"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useData } from "@/lib/context/data-context"

interface Chef {
  id: string
  name?: string
  email?: string
}

interface OrderPageProps {
  params: {
    id: string
  }
}

interface DialogState {
  actionDialogOpen: boolean
  actionType: "complete" | "cancel" | "accept" | "in_progress" | "revert" | null
  createTasksDialogOpen: boolean // Changed from assignChefDialogOpen
}

interface ItemTask {
  menu_item_id: number
  chef_id: string | null
}

const OrderPage = ({ params }: OrderPageProps) => {
  const router = useRouter()
  const { toast } = useToast()
  const { refreshData } = useData()
  
  // Basic state
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [chefs, setChefs] = useState<Chef[]>([])
  const [activeTab, setActiveTab] = useState("details")
  const [itemTasks, setItemTasks] = useState<ItemTask[]>([])
  const [dialogState, setDialogState] = useState<DialogState>({
    actionDialogOpen: false,
    actionType: null,
    createTasksDialogOpen: false,
  })

  // Track if component is mounted
  const isMounted = useRef(true)
  // Refs for loading state
  const dataLoaded = useRef(false)

  const orderId = Number.parseInt(params.id)

  // Set up cleanup function for component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

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

        if (isMounted.current) {
          setOrder(fullOrder)
          setError(null)
          dataLoaded.current = true
        }

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
          if (isMounted.current) {
            setChefs(chefsData || [])
          }
        }
      } catch (err) {
        console.error("Error loading order:", err)
        if (isMounted.current) {
          setError(`Failed to load order: ${err || "Unknown error"}`)
        }
      } finally {
        if (isMounted.current) {
          setLoading(false)
        }
      }
    }

    fetchOrderData()
  }, [orderId])

  // Update order status with proper error handling
  const updateOrderStatus = useCallback(
    (status: Order["status"]) => {
      console.log(`🔍 updateOrderStatus - START (status: ${status})`)
      console.time("updateOrderStatus")

      try {
        setDialogState((prev) => ({ ...prev, actionDialogOpen: false, actionType: null }))
        setIsProcessing(true)

        setOrder((prevOrder) => {
          return prevOrder ? { ...prevOrder, status } : null
        })

        toast({
          title: "Updating order",
          description: "Order status is being updated...",
        })

        supabase
          .from("orders")
          .update({ status })
          .eq("id", orderId)
          .then(({ error }) => {
            if (error) throw error

            toast({
              title: "Order updated",
              description: getStatusChangeMessage(status),
            })
          })
          .catch((err) => {
            handleError(err)
          })
          .finally(() => {
            if (isMounted.current) {
              setIsProcessing(false)
              refreshData()
              
              // Force a re-render
              setTimeout(() => {
                if (isMounted.current) {
                  setActiveTab(activeTab)
                }
              }, 50)
            }
          })

      } catch (err) {
        handleError(err)
        if (isMounted.current) {
          setIsProcessing(false)
        }
      }
    },
    [orderId, refreshData, toast, activeTab]
  )

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
        return <Badge className="bg-green-800 text-lg py-1 px-3">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-600 text-lg py-1 px-3">Cancelled</Badge>
      default:
        return <Badge className="text-lg py-1 px-3">{status}</Badge>
    }
  }

  // Helper function to get appropriate status change message
  const getStatusChangeMessage = (status: Order["status"]): string => {
    switch (status) {
      case "pending":
        return "Order has been reverted to pending."
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

  // Improve type safety for confirm action
  const confirmAction = useCallback(() => {
    console.log("🔍 confirmAction - START")
    console.time("confirmAction")

    if (!dialogState.actionType || !isMounted.current) {
      console.log("🔍 confirmAction - No action type or component unmounted, returning early")
      console.timeEnd("confirmAction")
      return
    }

    setDialogState((prev) => ({ ...prev, actionDialogOpen: false }))

    const statusMap: Record<DialogState["actionType"], Order["status"]> = {
      complete: "completed",
      cancel: "cancelled",
      accept: "accepted",
      "in_progress": "in_progress",
      revert: "pending",
      null: "pending"
    }

    const newStatus = statusMap[dialogState.actionType]
    if (newStatus) {
      updateOrderStatus(newStatus)
    }

    console.timeEnd("confirmAction")
    console.log("🔍 confirmAction - END")
  }, [dialogState.actionType, updateOrderStatus])
  // Handle assigning chef
  const handleAssignChef = useCallback(() => {
    console.log("🔍 handleAssignChef - START")
    if (order) {
      setSelectedChefId(order.chef_id || "none")
      setDialogState((prev) => ({ ...prev, assignChefDialogOpen: true }))
    }
    console.log("🔍 handleAssignChef - END")
  }, [order])

  // Handle opening create tasks dialog
  const handleCreateTasks = useCallback(() => {
    console.log("🔍 handleCreateTasks - START")
    if (order) {
      // Initialize tasks for each order item
      const initialTasks = order.items.map(item => ({
        menu_item_id: item.menu_item_id,
        chef_id: null
      }))
      setItemTasks(initialTasks)
      setDialogState((prev) => ({ ...prev, createTasksDialogOpen: true }))
    }
    console.log("🔍 handleCreateTasks - END")
  }, [order])

  // Handle assigning chef to a specific item task
  const handleTaskChefChange = useCallback((menuItemId: number, chefId: string) => {
    setItemTasks(prev => 
      prev.map(task => 
        task.menu_item_id === menuItemId 
          ? { ...task, chef_id: chefId === "none" ? null : chefId }
          : task
      )
    )
  }, [])

  // Create tasks with assigned chefs
  const createTasks = useCallback(async () => {
    console.log("🔍 createTasks - START")
    if (!isMounted.current || !order) return

    setDialogState((prev) => ({ ...prev, createTasksDialogOpen: false }))
    setIsProcessing(true)

    try {
      // Create tasks in the database
      const { error } = await supabase
        .from("tasks")
        .insert(
          itemTasks
            .filter(task => task.chef_id) // Only create tasks for items with assigned chefs
            .map(task => ({
              order_id: orderId,
              menu_item_id: task.menu_item_id,
              chef_id: task.chef_id,
              status: "pending"
            }))
        )

      if (error) throw error

      toast({
        title: "Tasks created",
        description: "Tasks have been created and assigned to chefs",
      })
      
      refreshData()
    } catch (err) {
      console.error("Error creating tasks:", err)
      toast({
        title: "Error",
        description: "Failed to create tasks. Please try again.",
        variant: "destructive",
      })
    } finally {
      if (isMounted.current) {
        setIsProcessing(false)
      }
    }
  }, [itemTasks, order, orderId, toast, refreshData])

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
  const handleAction = useCallback((actionType: DialogState["actionType"]) => {
    if (!actionType) return

    console.log(`🔍 handleAction - START (${actionType})`)
    setTimeout(() => {
      if (isMounted.current) {
        setDialogState((prev) => ({ ...prev, actionDialogOpen: true, actionType }))
      }
    }, 0)
    console.log("🔍 handleAction - END")
  }, [])

  // Handle error with proper type safety
  const handleError = (err: Error | unknown) => {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
    console.error("Error:", err)
    if (isMounted.current) {
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Assign chef with proper error handling
  const assignChef = useCallback(() => {
    console.log("🔍 assignChef - START")
    if (!isMounted.current || !order) return

    setDialogState((prev) => ({ ...prev, assignChefDialogOpen: false }))
    setIsProcessing(true)

    const chefId = null;
    const chef = chefs.find(c => c.id === chefId)

    setOrder((prev) => {
      if (!prev) return null
      return {
        ...prev,
        chef_id: chefId || undefined,
        chef_name: chef?.name
      }
    })

    supabase
      .from("orders")
      .update({ chef_id: chefId })
      .eq("id", orderId)
      .then(({ error }) => {
        if (error) throw error
        toast({
          title: "Chef assigned",
          description: chefId ? `Order assigned to ${chef?.name}` : "Chef unassigned from order",
        })
      })
      .catch((err) => {
        console.error("Error assigning chef:", err)
        toast({
          title: "Error",
          description: "Failed to assign chef. Please try again.",
          variant: "destructive",
        })
      })
      .finally(() => {
        if (isMounted.current) {
          setIsProcessing(false)
          refreshData()
        }
      })
  }, [order, orderId, chefs, toast, refreshData])

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

        <Button onClick={() => router.push("/orders")} className="bg-green-800 hover:bg-green-900 text-white mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>

        <Button
          onClick={() => {
            dataLoaded.current = false
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
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-5 w-5" />
                )}
                Accept Order
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
                className="bg-green-800 hover:bg-green-900 text-white px-6 py-3 rounded-lg text-lg font-medium h-auto"
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
              aria-label={`Create tasks for order #${order.id}`}
              onClick={handleCreateTasks}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
              Create Tasks
            </Button>
          )}
        </div>
      </div>

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
          if (!open && !isProcessing) {
            // Only update state if we're closing and not processing
            console.log(`🔍 Action dialog open state changing to: ${open}`)
            setTimeout(() => {
              if (isMounted.current) {
                setDialogState((prev) => ({ ...prev, actionDialogOpen: open }))
              }
            }, 0)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.actionType === "complete"
                ? "This will mark the order as completed."
                : dialogState.actionType === "cancel"
                  ? "This will cancel the order."
                  : dialogState.actionType === "accept"
                    ? "This will accept the order."
                    : dialogState.actionType === "in_progress"
                      ? "This will mark the order as in progress."
                      : "This will revert the order to pending status."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => console.log("🔍 Action dialog cancelled")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log("🔍 Action dialog confirmed, calling confirmAction")
                confirmAction()
              }}
              disabled={isProcessing}
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
        open={dialogState.createTasksDialogOpen}
        onOpenChange={(open) => {
          console.log(`🔍 Create tasks dialog open state changing to: ${open}`)
          setTimeout(() => {
            if (isMounted.current) {
              setDialogState((prev) => ({ ...prev, createTasksDialogOpen: open }))
            }
          }, 0)
        }}
      >
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Create Tasks</AlertDialogTitle>
            <AlertDialogDescription>Assign chefs to create tasks for ordered items.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Assigned Chef</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => {
                  const task = itemTasks.find(t => t.menu_item_id === item.menu_item_id)
                  return (
                    <TableRow key={item.menu_item_id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Select
                          value={task?.chef_id || "none"}
                          onValueChange={(value) => handleTaskChefChange(item.menu_item_id, value)}
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
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => console.log("🔍 Create tasks dialog cancelled")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log("🔍 Create tasks dialog confirmed, calling createTasks")
                createTasks()
              }}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Tasks
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

export default OrderPage;