"use client"

import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react"
import Link from "next/link"
import {
  Plus,
  ArrowUpDown,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  UserPlus,
  Play,
  Edit,
  MoreHorizontal,
  FileDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import OrderForm from "@/components/orders/order-form"
import EditOrderForm from "@/components/orders/edit-order-form"
import { useData } from "@/lib/context/data-context"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import type { Order } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TextSizeControls } from "@/components/accessibility/text-size-controls"
import { useTextSize } from "@/lib/context/text-size-context"

// Create a separate component for the action buttons to prevent re-renders
const OrderActions = memo(
  ({
    order,
    onAction,
    onRevert,
    onAssignChef,
    onDelete,
    onEdit,
    processingOrders,
    inventoryStatus,
    checkingInventory,
  }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={`/orders/${order.id}`}>
                <Eye className="h-4 w-4 mr-2" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(order)} disabled={processingOrders[order.id]}>
              {processingOrders[order.id] ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}{" "}
              Edit Order
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {order.status === "pending" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => onAction(order.id, "accept")}
                  disabled={
                    inventoryStatus[order.id] === false || checkingInventory[order.id] || processingOrders[order.id]
                  }
                  className={
                    inventoryStatus[order.id] === false || checkingInventory[order.id] || processingOrders[order.id]
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                >
                  {processingOrders[order.id] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : checkingInventory[order.id] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}{" "}
                  {checkingInventory[order.id] ? "Checking..." : "Accept"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction(order.id, "cancel")} disabled={processingOrders[order.id]}>
                  {processingOrders[order.id] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}{" "}
                  Cancel
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

          {order.status === "accepted" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => onAction(order.id, "in_progress")}
                  disabled={processingOrders[order.id]}
                >
                  {processingOrders[order.id] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}{" "}
                  Set In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRevert(order.id)} disabled={processingOrders[order.id]}>
                  {processingOrders[order.id] ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Revert to
                  Pending
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

          {order.status === "in_progress" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onAction(order.id, "complete")} disabled={processingOrders[order.id]}>
                  {processingOrders[order.id] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}{" "}
                  Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRevert(order.id)} disabled={processingOrders[order.id]}>
                  {processingOrders[order.id] ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Revert to
                  Pending
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

          {(order.status === "pending" || order.status === "accepted" || order.status === "in_progress") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAssignChef(order.id)} disabled={processingOrders[order.id]}>
                {processingOrders[order.id] ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}{" "}
                Assign Chef
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(order.id)}
            className="text-red-600"
            disabled={processingOrders[order.id]}
          >
            {processingOrders[order.id] ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}{" "}
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
)
OrderActions.displayName = "OrderActions"

// Format order items for display
const formatOrderItems = (items) => {
  if (!items || items.length === 0) return "No items"

  // Create a summary string of the first 2 items with quantities
  const summary = items
    .slice(0, 2)
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(", ")

  // Add "and X more" if there are more than 2 items
  return items.length > 2 ? `${summary} and ${items.length - 2} more` : summary
}

// Memoized OrderRow component to prevent unnecessary re-renders
const OrderRow = memo(
  ({
    order,
    processingOrders,
    inventoryStatus,
    checkingInventory,
    onAction,
    onRevert,
    onAssignChef,
    onDelete,
    onEdit,
    getStatusBadge,
  }) => {
    // Format the order items for display
    const itemsDisplay = formatOrderItems(order.items)

    // Truncate delivery address if it's too long
    const truncateAddress = (address) => {
      return address.length > 30 ? `${address.substring(0, 30)}...` : address
    }

    return (
      <TableRow key={order.id}>
        <TableCell className="font-medium">#{order.id}</TableCell>
        <TableCell>{format(new Date(order.date), "MMM d, yyyy")}</TableCell>
        <TableCell>{order.customer_name}</TableCell>
        <TableCell>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="text-left">{truncateAddress(order.delivery_address)}</TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{order.delivery_address}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
        <TableCell>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="text-left">{itemsDisplay}</TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-bold mb-1">Order Items:</p>
                  <ul className="list-disc pl-4">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.quantity}x {item.name} (${item.price.toFixed(2)} each)
                      </li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
        <TableCell>{format(new Date(order.delivery_date), "MMM d, yyyy")}</TableCell>
        <TableCell>{order.kitchen_location}</TableCell>
        <TableCell>{order.chef_name || "Not assigned"}</TableCell>
        <TableCell>${order.total.toFixed(2)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {getStatusBadge(order.status)}
            {order.status === "pending" && inventoryStatus[order.id] === false && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Insufficient inventory</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <OrderActions
            order={order}
            onAction={onAction}
            onRevert={onRevert}
            onAssignChef={onAssignChef}
            onDelete={onDelete}
            onEdit={onEdit}
            processingOrders={processingOrders}
            inventoryStatus={inventoryStatus}
            checkingInventory={checkingInventory}
          />
        </TableCell>
      </TableRow>
    )
  },
)
OrderRow.displayName = "OrderRow"

// Memoized OrderTable component to prevent unnecessary re-renders
const OrderTable = memo(
  ({
    orders,
    processingOrders,
    inventoryStatus,
    checkingInventory,
    onAction,
    onRevert,
    onAssignChef,
    onDelete,
    onEdit,
    getStatusBadge,
    sortConfig,
    requestSort,
    getSortDirectionIcon,
  }) => {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("id")}
                  aria-label="Sort by ID"
                >
                  Order ID {getSortDirectionIcon("id")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("date")}
                  aria-label="Sort by date"
                >
                  Date {getSortDirectionIcon("date")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("customer_name")}
                  aria-label="Sort by customer"
                >
                  Customer {getSortDirectionIcon("customer_name")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("delivery_address")}
                  aria-label="Sort by delivery address"
                >
                  Delivery Address {getSortDirectionIcon("delivery_address")}
                </button>
              </TableHead>
              <TableHead>Items</TableHead>
              <TableHead>
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("delivery_date")}
                  aria-label="Sort by delivery date"
                >
                  Delivery Date {getSortDirectionIcon("delivery_date")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("kitchen_location")}
                  aria-label="Sort by kitchen location"
                >
                  Kitchen {getSortDirectionIcon("kitchen_location")}
                </button>
              </TableHead>
              <TableHead>Chef</TableHead>
              <TableHead>
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("total")}
                  aria-label="Sort by total"
                >
                  Total {getSortDirectionIcon("total")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("status")}
                  aria-label="Sort by status"
                >
                  Status {getSortDirectionIcon("status")}
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  processingOrders={processingOrders}
                  inventoryStatus={inventoryStatus}
                  checkingInventory={checkingInventory}
                  onAction={onAction}
                  onRevert={onRevert}
                  onAssignChef={onAssignChef}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  },
)
OrderTable.displayName = "OrderTable"

// Update the OperationQueue class to handle errors better
class OperationQueue {
  queue = []
  isProcessing = false
  retryCount = {} // Track retry attempts

  add(operation, id = null) {
    // Store the ID with the operation for retries
    this.queue.push({ operation, id })
    if (!this.isProcessing) {
      this.processNext()
    }
  }

  async processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false
      return
    }

    this.isProcessing = true
    const { operation, id } = this.queue.shift()

    // Initialize retry count if needed
    if (id && !this.retryCount[id]) {
      this.retryCount[id] = 0
    }

    try {
      // Set a timeout for operation to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Operation timed out")), 20000),
      )

      // Execute the operation with a timeout
      await Promise.race([operation(), timeoutPromise])

      // Reset retry count on success if this operation has an ID
      if (id) {
        this.retryCount[id] = 0
      }
    } catch (error) {
      console.error("Error processing operation:", error)

      // Retry logic for operations with IDs
      if (id && this.retryCount[id] < 3) {
        console.log(`Retrying operation for ID ${id}, attempt ${this.retryCount[id] + 1}`)
        this.retryCount[id]++
        // Put back in queue with exponential backoff
        setTimeout(() => {
          this.queue.push({ operation, id })
          if (!this.isProcessing) {
            this.processNext()
          }
        }, this.retryCount[id] * 1000) // Gradually increase delay
      }
    }

    // Use a longer delay (100ms) to give the UI thread more time to breathe
    setTimeout(() => this.processNext(), 100)
  }
}

export default function OrdersPage() {
  const {
    orders: contextOrders,
    deleteOrder,
    completeOrder,
    cancelOrder,
    acceptOrder,
    revertOrderToPending,
    setOrderInProgress,
    assignChef,
    chefs,
    refreshData,
    loading: dataLoading,
    error: dataError,
    ingredients,
    recipes,
  } = useData()

  // Create operation queue
  const operationQueue = useRef(new OperationQueue())

  // Create local state for orders that we can update immediately for UI responsiveness
  const [localOrders, setLocalOrders] = useState<Order[]>([])

  // Sync local orders with context orders when they change
  useEffect(() => {
    setLocalOrders(contextOrders)
  }, [contextOrders])

  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>({
    key: "date",
    direction: "descending",
  })

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [orderToAction, setOrderToAction] = useState<{ id: number; action: string } | null>(null)
  const [assignChefDialogOpen, setAssignChefDialogOpen] = useState(false)
  const [orderToAssign, setOrderToAssign] = useState<number | null>(null)
  const [selectedChefId, setSelectedChefId] = useState<string>("none")
  const [revertDialogOpen, setRevertDialogOpen] = useState(false)
  const [orderToRevert, setOrderToRevert] = useState<number | null>(null)
  const [restoreInventory, setRestoreInventory] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null)

  // Processing states - track processing state per order ID
  const [processingOrders, setProcessingOrders] = useState<Record<number, boolean>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Inventory check states
  const [inventoryStatus, setInventoryStatus] = useState<Record<number, boolean>>({})
  const [checkingInventory, setCheckingInventory] = useState<Record<number, boolean>>({})

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)

  // Debounce timers
  const actionDebounceTimers = useRef<Record<number, NodeJS.Timeout>>({})

  // Focus management refs
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const { textSize } = useTextSize();

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      // Clear all timers on unmount
      Object.values(actionDebounceTimers.current).forEach((timer) => {
        clearTimeout(timer)
      })
    }
  }, [])

  // Check inventory for a specific order using local state
  const checkOrderInventory = useCallback(
    (orderId: number) => {
      // If already checking, return
      if (checkingInventory[orderId]) {
        return false
      }

      if (isMounted.current) {
        setCheckingInventory((prev) => ({ ...prev, [orderId]: true }))
      }

      try {
        // Get the order
        const order = localOrders.find((o) => o.id === orderId)
        if (!order) {
          throw new Error("Order not found")
        }

        // Check if there is sufficient inventory for the order
        const result = checkInventoryForOrder(order, recipes, ingredients)

        if (isMounted.current) {
          setInventoryStatus((prev) => ({ ...prev, [orderId]: result.isOk }))
          setCheckingInventory((prev) => ({ ...prev, [orderId]: false }))
        }

        return result.isOk
      } catch (error) {
        console.error("Error checking inventory:", error)
        if (isMounted.current) {
          setCheckingInventory((prev) => ({ ...prev, [orderId]: false }))
        }
        return false
      }
    },
    [localOrders, recipes, ingredients, checkingInventory],
  )

  // Check inventory for pending orders when orders or ingredients change
  useEffect(() => {
    if (!dataLoading && localOrders.length > 0 && ingredients.length > 0) {
      // Check inventory for pending orders
      localOrders
        .filter((order) => order.status === "pending" && inventoryStatus[order.id] === undefined)
        .forEach((order) => {
          checkOrderInventory(order.id)
        })
    }
  }, [localOrders, ingredients, dataLoading, inventoryStatus, checkOrderInventory])

  // Manual refresh function with debounce
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      await refreshData()
      toast({
        title: "Data refreshed",
        description: "The orders list has been updated.",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Refresh failed",
        description: "Failed to refresh data. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshData, isRefreshing])

  // Update order status with debouncing to prevent UI freezing
  const updateOrderStatus = useCallback(
    (orderId: number, status: string, restoreInventory = false) => {
      console.log(`START updateOrderStatus: orderId=${orderId}, status=${status}`)

      // Prevent duplicate calls for the same order
      if (processingOrders[orderId]) {
        console.log(`Order ${orderId} is already being processed, skipping`)
        return false
      }

      // IMPORTANT: Update UI state IMMEDIATELY before any async operations
      // This is the key change to prevent UI freezing
      setLocalOrders((prevOrders) => prevOrders.map((o) => (o.id === orderId ? { ...o, status } : o)))
      console.log(`UI updated immediately for order ${orderId} to status ${status}`)

      // Set processing state for this specific order
      setProcessingOrders((prev) => ({ ...prev, [orderId]: true }))

      // Show toast for long operations
      toast({
        title: "Processing order",
        description: "Please wait while we update the order status...",
      })

      // Use setTimeout with 0ms delay to push the operation to the next event loop cycle
      // This ensures the UI updates are processed before any heavy operations
      setTimeout(() => {
        // Add the database operation to the queue
        operationQueue.current.add(async () => {
          try {
            console.log(`Background processing started for order ${orderId}`)
            let success = false

            switch (status) {
              case "accepted":
                success = await acceptOrder(orderId)
                break
              case "in_progress":
                success = await setOrderInProgress(orderId)
                break
              case "completed":
                success = await completeOrder(orderId)
                break
              case "cancelled":
                success = await cancelOrder(orderId)
                break
              case "pending":
                success = await revertOrderToPending(orderId, restoreInventory)
                break
              default:
                throw new Error(`Unknown status: ${status}`)
            }

            console.log(`Background processing completed for order ${orderId}, success=${success}`)

            // Use requestAnimationFrame to ensure UI is updated smoothly
            requestAnimationFrame(() => {
              // Dismiss the processing toast
              toast({
                title: "Order updated",
                description: `Order has been ${status === "in_progress" ? "set to in progress" : status + "ed"}.`,
              })

              // Clear processing state after a short delay to prevent UI flicker
              setTimeout(() => {
                if (isMounted.current) {
                  setProcessingOrders((prev) => ({ ...prev, [orderId]: false }))
                  console.log(`Processing state cleared for order ${orderId}`)
                }
              }, 50)
            })
          } catch (error) {
            console.error(`Error updating order status:`, error)

            // Use requestAnimationFrame to ensure UI is updated smoothly
            requestAnimationFrame(() => {
              toast({
                title: "Error",
                description: `Failed to update order. Please try again.`,
                variant: "destructive",
              })

              // Clear processing state
              setTimeout(() => {
                if (isMounted.current) {
                  setProcessingOrders((prev) => ({ ...prev, [orderId]: false }))
                  console.log(`Processing state cleared for order ${orderId}`)
                }
              }, 50)

              // Refresh data to ensure UI is in sync if there was an error
              refreshData()
            })
          }
        }, orderId)
      }, 0)

      console.log(`END updateOrderStatus: orderId=${orderId}`)
      return true
    },
    [
      processingOrders,
      acceptOrder,
      setOrderInProgress,
      completeOrder,
      cancelOrder,
      revertOrderToPending,
      refreshData,
      toast,
    ],
  )

  // Get unique statuses for filter dropdown
  const statuses = useMemo(() => {
    return ["all", ...new Set(localOrders.map((order) => order.status))].filter(Boolean)
  }, [localOrders])

  // Sort orders - memoize this to prevent recalculation on every render
  const sortedOrders = useMemo(() => {
    try {
      return [...localOrders].sort((a, b) => {
        const key = sortConfig.key as keyof typeof a

        if (key === "date" || key === "delivery_date") {
          return sortConfig.direction === "ascending"
            ? new Date(a[key]).getTime() - new Date(b[key]).getTime()
            : new Date(b[key]).getTime() - new Date(a[key]).getTime()
        }

        if (a[key] < b[key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[key] > b[key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    } catch (error) {
      console.error("Error sorting orders:", error)
      return [...localOrders]
    }
  }, [localOrders, sortConfig])

  // Filter orders based on search query and status - memoize this
  const filteredOrders = useMemo(() => {
    try {
      return sortedOrders.filter((order) => {
        const matchesSearch =
          order.id.toString().includes(searchQuery) ||
          order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.delivery_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.status && order.status.toLowerCase().includes(searchQuery.toLowerCase())) ||
          order.total.toString().includes(searchQuery) ||
          // Search in order items
          order.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesStatus = filterStatus === "all" || order.status === filterStatus

        return matchesSearch && matchesStatus
      })
    } catch (error) {
      console.error("Error filtering orders:", error)
      return sortedOrders
    }
  }, [sortedOrders, searchQuery, filterStatus])

  // Handle sorting
  const requestSort = useCallback(
    (key: string) => {
      try {
        let direction: "ascending" | "descending" = "ascending"

        if (sortConfig.key === key && sortConfig.direction === "ascending") {
          direction = "descending"
        }

        setSortConfig({ key, direction })
      } catch (error) {
        console.error("Error in requestSort:", error)
      }
    },
    [sortConfig],
  )

  // Get sort direction icon
  const getSortDirectionIcon = useCallback(
    (key: string) => {
      try {
        if (sortConfig.key !== key) {
          return <ArrowUpDown className="ml-2 h-4 w-4" />
        }

        return sortConfig.direction === "ascending" ? (
          <ArrowUpDown className="ml-2 h-4 w-4 text-green-600" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 text-red-600" />
        )
      } catch (error) {
        console.error("Error in getSortDirectionIcon:", error)
        return <ArrowUpDown className="ml-2 h-4 w-4" />
      }
    },
    [sortConfig],
  )

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    try {
      switch (status) {
        case "pending":
          return <Badge className="bg-yellow-500">Pending</Badge>
        case "accepted":
          return <Badge className="bg-blue-600">Accepted</Badge>
        case "in_progress":
          return <Badge className="bg-purple-600">In Progress</Badge>
        case "completed":
          return <Badge className="bg-green-600">Completed</Badge>
        case "cancelled":
          return <Badge className="bg-red-600">Cancelled</Badge>
        default:
          return <Badge>{status}</Badge>
      }
    } catch (error) {
      console.error("Error in getStatusBadge:", error)
      return <Badge>{status}</Badge>
    }
  }, [])

  // Handle delete confirmation with debounce
  const handleDeleteClick = useCallback(
    (id: number) => {
      try {
        // Prevent duplicate clicks
        if (processingOrders[id]) return

        // Store the active element before opening dialog
        previousFocusRef.current = document.activeElement as HTMLElement

        setOrderToDelete(id)
        setDeleteDialogOpen(true)
      } catch (error) {
        console.error("Error in handleDeleteClick:", error)
      }
    },
    [processingOrders],
  )

  const confirmDelete = useCallback(async () => {
    if (orderToDelete === null) return

    // Prevent duplicate submission
    if (processingOrders[orderToDelete]) return

    // Store the ID locally before clearing state
    const idToDelete = orderToDelete

    // Close dialog immediately for better UX
    setDeleteDialogOpen(false)
    setOrderToDelete(null)

    // Update UI immediately
    setLocalOrders((prevOrders) => prevOrders.filter((order) => order.id !== idToDelete))

    // Set processing state for this specific order
    setProcessingOrders((prev) => ({ ...prev, [idToDelete]: true }))

    // Show toast
    toast({
      title: "Deleting order",
      description: "Please wait while we delete the order...",
    })

    // Use setTimeout to push the operation to the next event loop cycle
    setTimeout(() => {
      // Add the database operation to the queue
      operationQueue.current.add(async () => {
        try {
          await deleteOrder(idToDelete)

          // Use requestAnimationFrame to ensure UI is updated smoothly
          requestAnimationFrame(() => {
            toast({
              title: "Order deleted",
              description: "The order has been deleted successfully.",
            })

            // Clear processing state after a short delay
            setTimeout(() => {
              if (isMounted.current) {
                setProcessingOrders((prev) => ({ ...prev, [idToDelete]: false }))
              }

              // Restore focus after a short delay
              setTimeout(() => {
                if (previousFocusRef.current && isMounted.current) {
                  previousFocusRef.current.focus()
                }
              }, 50)
            }, 50)
          })
        } catch (error) {
          console.error("Error deleting order:", error)

          // Use requestAnimationFrame to ensure UI is updated smoothly
          requestAnimationFrame(() => {
            toast({
              title: "Error",
              description: "Failed to delete order. Please try again.",
              variant: "destructive",
            })

            // Clear processing state
            setTimeout(() => {
              if (isMounted.current) {
                setProcessingOrders((prev) => ({ ...prev, [idToDelete]: false }))
              }

              // Restore focus
              setTimeout(() => {
                if (previousFocusRef.current && isMounted.current) {
                  previousFocusRef.current.focus()
                }
              }, 50)
            }, 50)

            // Refresh data to ensure UI is in sync
            refreshData()
          })
        }
      }, idToDelete)
    }, 0)
  }, [orderToDelete, processingOrders, deleteOrder, refreshData, toast])

  // Handle action confirmation (accept, complete, cancel, etc.) with debounce
  const handleActionClick = useCallback(
    (id: number, action: string) => {
      try {
        // Prevent duplicate clicks
        if (processingOrders[id]) return

        // Store the active element before opening dialog
        previousFocusRef.current = document.activeElement as HTMLElement

        // Clear any existing debounce timer for this order
        if (actionDebounceTimers.current[id]) {
          clearTimeout(actionDebounceTimers.current[id])
        }

        // If action is accept, check inventory first
        if (action === "accept") {
          // Check if we already know the inventory status
          if (inventoryStatus[id] === undefined) {
            // Check inventory before proceeding
            toast({
              title: "Checking inventory",
              description: "Please wait while we check inventory...",
            })

            const hasInventory = checkOrderInventory(id)

            if (!hasInventory) {
              toast({
                title: "Insufficient inventory",
                description: "This order cannot be accepted due to insufficient ingredients.",
                variant: "destructive",
              })
              return
            }
          } else if (inventoryStatus[id] === false) {
            toast({
              title: "Insufficient inventory",
              description: "This order cannot be accepted due to insufficient ingredients.",
              variant: "destructive",
            })
            return
          }
        }

        // Set action state and open dialog
        setOrderToAction({ id, action })
        setActionDialogOpen(true)
      } catch (error) {
        console.error("Error in handleActionClick:", error)
      }
    },
    [processingOrders, inventoryStatus, checkOrderInventory, toast],
  )

  // Confirm action with optimistic UI update
  const confirmAction = useCallback(() => {
    console.log("START confirmAction")
    if (!orderToAction) {
      console.log("No orderToAction, skipping")
      return
    }

    const { id, action } = orderToAction

    // Prevent duplicate submission
    if (processingOrders[id]) {
      console.log(`Order ${id} is already being processed, skipping`)
      return
    }

    let status = ""
    switch (action) {
      case "accept":
        status = "accepted"
        break
      case "in_progress":
        status = "in_progress"
        break
      case "complete":
        status = "completed"
        break
      case "cancel":
        status = "cancelled"
        break
      default:
        console.log(`Unknown action: ${action}`)
        toast({
          title: "Error",
          description: "Unknown action requested. Please try again.",
          variant: "destructive",
        })
        return
    }

    // Close dialog immediately for better UX
    setActionDialogOpen(false)
    setOrderToAction(null)
    console.log(`Dialog closed, calling updateOrderStatus for order ${id} with status ${status}`)

    try {
      // Update status using our improved function
      updateOrderStatus(id, status)
      console.log("END confirmAction")

      // Restore focus
      if (previousFocusRef.current && isMounted.current) {
        previousFocusRef.current.focus()
      }
    } catch (error) {
      console.error("Error in confirmAction:", error)
      toast({
        title: "Error",
        description: "Something went wrong during the operation. Please try again.",
        variant: "destructive",
      })

      // Clear processing state
      setProcessingOrders((prev) => ({ ...prev, [id]: false }))

      // Restore focus
      if (previousFocusRef.current && isMounted.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [orderToAction, processingOrders, updateOrderStatus, toast])

  // Handle assign chef with debounce
  const handleAssignChefClick = useCallback(
    (id: number) => {
      try {
        // Prevent duplicate clicks
        if (processingOrders[id]) return

        // Store the active element before opening dialog
        previousFocusRef.current = document.activeElement as HTMLElement

        // Find the current order to get its chef_id
        const order = localOrders.find((o) => o.id === id)
        if (!order) return

        // Set the current chef_id as the selected value
        // This fixes the issue where the dropdown doesn't show the current chef
        setSelectedChefId(order.chef_id || "none")
        setOrderToAssign(id)
        setAssignChefDialogOpen(true)
      } catch (error) {
        console.error("Error in handleAssignChefClick:", error)
        toast({
          title: "Error",
          description: "Failed to open chef assignment dialog. Please try again.",
          variant: "destructive",
        })
      }
    },
    [processingOrders, localOrders, toast],
  )

  const confirmAssignChef = useCallback(() => {
    console.log("START confirmAssignChef")
    if (orderToAssign === null) {
      console.log("Invalid assignment parameters, skipping")
      return
    }

    // Prevent duplicate submission
    if (processingOrders[orderToAssign]) {
      console.log(`Order ${orderToAssign} is already being processed, skipping`)
      return
    }

    // Store values locally
    const orderId = orderToAssign
    const chefId = selectedChefId === "none" ? null : selectedChefId

    // Close dialog immediately for better UX
    setAssignChefDialogOpen(false)
    setOrderToAssign(null)
    console.log(`Dialog closed for chef assignment`)

    // Update UI immediately
    const chef = chefs.find((c) => c.id === chefId)
    const chefName = chef ? chef.name || chef.email : null

    // Immediate UI update
    setLocalOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === orderId ? { ...order, chef_id: chefId, chef_name: chefName } : order)),
    )
    console.log(`UI updated immediately for chef assignment`)

    // Set processing state
    setProcessingOrders((prev) => ({ ...prev, [orderId]: true }))

    // Show toast
    toast({
      title: "Assigning chef",
      description: "Please wait while we assign the chef...",
    })

    // Use setTimeout to push the operation to the next event loop cycle
    setTimeout(() => {
      // Add the database operation to the queue
      operationQueue.current.add(async () => {
        try {
          console.log(`Background processing started for chef assignment`)

          // Define a timeout for the operation
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Chef assignment operation timed out")), 10000),
          )

          // Define the actual operation
          const assignmentPromise = assignChef(orderId, chefId)

          // Race them to prevent hanging
          await Promise.race([assignmentPromise, timeoutPromise])

          console.log(`Background processing completed for chef assignment`)

          // Use requestAnimationFrame to ensure UI is updated smoothly
          requestAnimationFrame(() => {
            toast({
              title: "Chef assigned",
              description: "Chef has been assigned to the order successfully.",
            })

            // Clear processing state after a short delay
            setTimeout(() => {
              if (isMounted.current) {
                setProcessingOrders((prev) => ({ ...prev, [orderId]: false }))
                console.log(`Processing state cleared for order ${orderId}`)
              }

              // Restore focus after a short delay
              setTimeout(() => {
                if (previousFocusRef.current && isMounted.current) {
                  previousFocusRef.current.focus()
                }
              }, 50)
            }, 50)
          })
        } catch (error) {
          console.error("Error assigning chef:", error)

          // Use requestAnimationFrame to ensure UI is updated smoothly
          requestAnimationFrame(() => {
            toast({
              title: "Error",
              description: "Failed to assign chef. The UI has been updated anyway.",
              variant: "destructive",
            })

            // Clear processing state
            setTimeout(() => {
              if (isMounted.current) {
                setProcessingOrders((prev) => ({ ...prev, [orderId]: false }))
                console.log(`Processing state cleared for order ${orderId}`)
              }

              // Restore focus
              setTimeout(() => {
                if (previousFocusRef.current && isMounted.current) {
                  previousFocusRef.current.focus()
                }
              }, 50)
            }, 50)
          })
        }
      }, orderId)
    }, 0)

    console.log("END confirmAssignChef")
  }, [orderToAssign, selectedChefId, processingOrders, chefs, assignChef, toast])

  // Handle revert to pending with debounce
  const handleRevertClick = useCallback(
    (id: number) => {
      try {
        // Prevent duplicate clicks
        if (processingOrders[id]) return

        // Store the active element before opening dialog
        previousFocusRef.current = document.activeElement as HTMLElement

        setOrderToRevert(id)
        setRestoreInventory(true)
        setRevertDialogOpen(true)
      } catch (error) {
        console.error("Error in handleRevertClick:", error)
      }
    },
    [processingOrders],
  )

  // Replace the confirmRevert function with this improved version
  // that ensures UI updates happen immediately

  const confirmRevert = useCallback(() => {
    console.log("START confirmRevert")
    if (orderToRevert === null) {
      console.log("No orderToRevert, skipping")
      return
    }

    // Prevent duplicate submission
    if (processingOrders[orderToRevert]) {
      console.log(`Order ${orderToRevert} is already being processed, skipping`)
      return
    }

    // Store the ID locally
    const idToRevert = orderToRevert
    const shouldRestoreInventory = restoreInventory

    // Close dialog immediately for better UX
    setRevertDialogOpen(false)
    setOrderToRevert(null)
    console.log(`Dialog closed, calling updateOrderStatus for order ${idToRevert}`)

    // Update status using our improved function
    updateOrderStatus(idToRevert, "pending", shouldRestoreInventory)
    console.log("END confirmRevert")

    // Restore focus
    if (previousFocusRef.current && isMounted.current) {
      previousFocusRef.current.focus()
    }
  }, [orderToRevert, restoreInventory, processingOrders, updateOrderStatus])

  // Handle edit order with debounce
  const handleEditClick = useCallback(
    (order: Order) => {
      try {
        // Prevent duplicate clicks
        if (processingOrders[order.id]) return

        // Store the active element before opening dialog
        previousFocusRef.current = document.activeElement as HTMLElement

        setOrderToEdit(order)
        setEditDialogOpen(true)
      } catch (error) {
        console.error("Error in handleEditClick:", error)
      }
    },
    [processingOrders],
  )

  // Handle dialog close for edit dialog
  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false)
    refreshData()

    // Restore focus
    if (previousFocusRef.current && isMounted.current) {
      setTimeout(() => {
        previousFocusRef.current?.focus()
      }, 0)
    }
  }, [refreshData])

  // Export table to CSV
  const exportToCSV = useCallback(() => {
    try {
      if (!filteredOrders.length) {
        toast({
          title: "No data to export",
          description: "There are no orders matching your current filters.",
          variant: "destructive",
        })
        return
      }

      // Create CSV header
      const headers = [
        "Order ID",
        "Date",
        "Customer",
        "Delivery Address",
        "Delivery Date",
        "Kitchen Location",
        "Chef",
        "Items",
        "Total",
        "Status",
        "Notes",
      ]

      // Create CSV rows
      const rows = filteredOrders.map((order) => [
        order.id,
        format(new Date(order.date), "yyyy-MM-dd"),
        order.customer_name,
        order.delivery_address,
        format(new Date(order.delivery_date), "yyyy-MM-dd"),
        order.kitchen_location,
        order.chef_name || "Not assigned",
        order.items.map((item) => `${item.quantity}x ${item.name}`).join("; "),
        order.total.toFixed(2),
        order.status,
        order.notes || "",
      ])

      // Combine header and rows
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n")

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `orders_export_${format(new Date(), "yyyy-MM-dd")}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url) // Clean up

      toast({
        title: "Export successful",
        description: "Orders have been exported to CSV.",
      })
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      toast({
        title: "Export failed",
        description: "Failed to export orders. Please try again.",
        variant: "destructive",
      })
    }
  }, [filteredOrders])

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-lg">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error loading data</AlertTitle>
          <AlertDescription>{dataError}</AlertDescription>
        </Alert>

        <Button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className={`font-bold text-gray-900 ${textSize === 'large' ? 'text-5xl' : textSize === 'x-large' ? 'text-6xl' : 'text-4xl'}`}>Orders</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </>
            )}
          </Button>
          <TextSizeControls />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-end">
        <div className="w-full md:w-1/3">
          <label htmlFor="search-orders" className="block text-sm font-medium text-gray-700 mb-1">
            Search Orders
          </label>
          <Input
            id="search-orders"
            placeholder="Search by ID, customer, address, items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="w-full md:w-1/4">
          <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger id="filter-status" className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status} className="cursor-pointer">
                  {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-auto md:ml-auto flex gap-2">
          <Button variant="outline" className="w-full md:w-auto" onClick={exportToCSV}>
            <FileDown className="mr-2 h-5 w-5" />
            Export
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-green-700 hover:bg-green-800">
                <Plus className="mr-2 h-5 w-5" />
                Create New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle className="text-2xl">Create New Order</DialogTitle>
              </DialogHeader>
              <OrderForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <OrderTable
          orders={filteredOrders}
          processingOrders={processingOrders}
          inventoryStatus={inventoryStatus}
          checkingInventory={checkingInventory}
          onAction={handleActionClick}
          onRevert={handleRevertClick}
          onAssignChef={handleAssignChefClick}
          onDelete={handleDeleteClick}
          onEdit={handleEditClick}
          getStatusBadge={getStatusBadge}
          sortConfig={sortConfig}
          requestSort={requestSort}
          getSortDirectionIcon={getSortDirectionIcon}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this order from your records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={orderToDelete !== null && processingOrders[orderToDelete]}
            >
              {orderToDelete !== null && processingOrders[orderToDelete] ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {orderToAction?.action === "accept" && "This will accept the order and update inventory accordingly."}
              {orderToAction?.action === "in_progress" && "This will mark the order as in progress."}
              {orderToAction?.action === "complete" && "This will mark the order as completed."}
              {orderToAction?.action === "cancel" && "This will cancel the order."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={orderToAction !== null && processingOrders[orderToAction.id]}
              className={
                orderToAction?.action === "accept"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : orderToAction?.action === "in_progress"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : orderToAction?.action === "complete"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
              }
            >
              {orderToAction !== null && processingOrders[orderToAction.id] ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {orderToAction?.action === "accept"
                ? "Accept Order"
                : orderToAction?.action === "in_progress"
                  ? "Set In Progress"
                  : orderToAction?.action === "complete"
                    ? "Complete Order"
                    : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Chef Dialog */}
      <AlertDialog open={assignChefDialogOpen} onOpenChange={setAssignChefDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Chef</AlertDialogTitle>
            <AlertDialogDescription>Select a chef to assign to this order.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedChefId} onValueChange={setSelectedChefId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a chef" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No chef assigned</SelectItem>
                {chefs.map((chef) => (
                  <SelectItem key={chef.id} value={chef.id} className="cursor-pointer">
                    {chef.name || chef.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAssignChef} className="bg-blue-600 hover:bg-blue-700">
              Assign Chef
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revert to Pending Dialog */}
      <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert to Pending</AlertDialogTitle>
            <AlertDialogDescription>This will revert the order status to pending.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="restore-inventory"
                checked={restoreInventory}
                onCheckedChange={(checked) => setRestoreInventory(checked === true)}
              />
              <label
                htmlFor="restore-inventory"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Restore inventory (add ingredients back to stock)
              </label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevert}
              disabled={orderToRevert !== null && processingOrders[orderToRevert]}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {orderToRevert !== null && processingOrders[orderToRevert] ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Revert to Pending
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Order #{orderToEdit?.id}</DialogTitle>
          </DialogHeader>
          {orderToEdit && <EditOrderForm order={orderToEdit} onClose={handleEditDialogClose} />}
        </DialogContent>
      </Dialog>
    </main>
  )
}

// Helper function to check if there is sufficient inventory for an order
function checkInventoryForOrder(order: Order, recipes: any[], ingredients: any[]) {
  // Create a map of ingredient IDs to quantities
  const ingredientQuantities: { [ingredientId: number]: number } = {}
  const missingIngredients: { name: string; available: number; required: number; unit: string }[] = []

  // Iterate over the order items
  for (const item of order.items) {
    // Find the recipe for the menu item
    const recipe = recipes.find((r) => r.menu_item_id === item.menu_item_id)
    if (!recipe) {
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
      return {
        isOk: false,
        message: `Ingredient not found for ID ${ingredientId}`,
        missingIngredients,
      }
    }

    // Check if there is sufficient quantity
    if (ingredient.quantity < ingredientQuantities[ingredientId]) {
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
    return {
      isOk: false,
      message: "Insufficient inventory",
      missingIngredients,
    }
  }

  // If all ingredients have sufficient quantity, return true
  return {
    isOk: true,
    message: "Sufficient inventory",
    missingIngredients: [],
  }
}
