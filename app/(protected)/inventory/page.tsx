"use client"

import { useState, useCallback, useEffect } from "react"
import { Plus, ArrowUpDown, Edit, Trash2, Download, Filter, RefreshCw, Loader2Icon, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import InventoryForm from "@/components/inventory/inventory-form"
import { useInventory } from "@/lib/hooks/use-inventory"
import { useAuth } from "@/lib/context/auth-context"
import { getStorageTypeName } from "@/lib/utils/storage-type-utils"
import { supabase } from "@/lib/supabase"
import type { Location } from "@/lib/types"
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
import { useToast } from "@/components/ui/use-toast"
import { TextSizeControls } from "@/components/accessibility/text-size-controls"
import { useTextSize } from "@/lib/context/text-size-context"

export default function InventoryPage() {
  const { ingredients, deleteIngredient, refreshData } = useInventory()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterLocation, setFilterLocation] = useState<string>("all")
  const [locations, setLocations] = useState<Location[]>([])
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<number | null>(null)
  const [showLowQuantityOnly, setShowLowQuantityOnly] = useState(false)
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState<number | null>(null)
  const { user } = useAuth()
  const { textSize } = useTextSize()

  // Get unique categories for filter dropdown
  const categories = ["all", ...new Set(ingredients.map((ingredient) => ingredient.category))].filter(Boolean)
  
  // Fetch locations for Admin users
  useEffect(() => {
    if (user?.role === "Admin") {
      const fetchLocations = async () => {
        const { data, error } = await supabase
          .from("locations")
          .select("*")
          .eq("is_active", true)
          .order("name")
        
        if (error) {
          console.error("Error fetching locations:", error)
          return
        }
        
        setLocations(data || [])
      }
      
      fetchLocations()
    }
  }, [user?.role])
  
  // Filter ingredients by user location (for non-admin) or selected location (for admin)
  // If user is null (logged out), don't show any ingredients
  const userIngredients = !user ? [] : 
    user.role === "Admin" && filterLocation !== "all"
      ? ingredients.filter((ingredient) => ingredient.location?.id === parseInt(filterLocation))
      : user.location_id
        ? ingredients.filter((ingredient) => ingredient.location?.id === user.location_id)
        : ingredients

  // Sort ingredients
  const sortedIngredients = [...userIngredients].sort((a, b) => {
    if (!sortConfig) return 0

    let aValue: any
    let bValue: any

    // Handle special sorting for storage_type
    if (sortConfig.key === "storage_type") {
      aValue = getStorageTypeName(a)
      bValue = getStorageTypeName(b)
    } else {
      const key = sortConfig.key as keyof typeof a
      aValue = a[key]
      bValue = b[key]
    }

    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1
    }
    return 0
  })

  // Filter ingredients based on search query, category, and low quantity filter
  const filteredIngredients = sortedIngredients.filter((ingredient) => {
    const matchesSearch =
      searchQuery === "" ||
      String(ingredient.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(ingredient.unit).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ingredient.category && String(ingredient.category).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ingredient.location?.name && String(ingredient.location.name).toLowerCase().includes(searchQuery.toLowerCase())) ||
      getStorageTypeName(ingredient).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ingredient.quantity !== undefined && String(ingredient.quantity).includes(searchQuery)) ||
      (ingredient.price !== undefined && String(ingredient.price).includes(searchQuery))

    const matchesCategory = filterCategory === "all" || ingredient.category === filterCategory

    const matchesLowQuantity =
      !showLowQuantityOnly ||
      (ingredient.quantity !== undefined &&
        ingredient.threshold_quantity !== undefined &&
        ingredient.quantity <= ingredient.threshold_quantity) ||
      (ingredient.quantity !== undefined && ingredient.threshold_quantity === undefined && ingredient.quantity < 10)

    return matchesSearch && matchesCategory && matchesLowQuantity
  })

  // Handle sorting
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Get sort direction icon
  const getSortDirectionIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }

    return sortConfig.direction === "ascending" ? (
      <ArrowUpDown className="ml-2 h-4 w-4 text-green-700" />
    ) : (
      <ArrowUpDown className="ml-2 h-4 w-4 text-red-600" />
    )
  }

  // Handle delete confirmation
  const handleDeleteClick = (id: number) => {
    setIngredientToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (ingredientToDelete !== null) {
      deleteIngredient(ingredientToDelete)
      setIngredientToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  // Toggle low quantity filter
  const toggleLowQuantityFilter = () => {
    setShowLowQuantityOnly(!showLowQuantityOnly)
  }

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

  // Export to CSV
  const exportToCSV = () => {
    try {
      // Define the headers
      const headers = ["Name", "Quantity", "Unit", "Threshold Quantity", "Price", "Category", "Location", "Storage Type"]

      // Format the data
      const data = ingredients.map((ingredient) => [
        ingredient.name,
        ingredient.quantity,
        ingredient.unit,
        ingredient.threshold_quantity || 10,
        ingredient.price ? `${ingredient.price.toFixed(2)}` : "N/A",
        ingredient.category || "Uncategorized",
        ingredient.location?.name || "Not specified",
        getStorageTypeName(ingredient),
      ])

      // Combine headers and data
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          row
            .map((cell) => {
              // Handle commas and quotes in cell values
              const cellStr = String(cell)
              return cellStr.includes(",") || cellStr.includes('"') ? `"${cellStr.replace(/"/g, '""')}"` : cellStr
            })
            .join(","),
        ),
      ].join("\n")

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `inventory_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: "Inventory data has been exported to CSV",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      toast({
        title: "Export Failed",
        description: "There was an error exporting the inventory data",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Helper function to get text size classes
  const getTextSizeClasses = () => {
    switch (textSize) {
      case "large":
        return {
          label: "text-base",
          button: "text-base",
          tableHeader: "text-base",
          tableCell: "text-base",
          dialogTitle: "text-xl",
          dialogDescription: "text-base",
          badge: "text-sm",
        }
      case "x-large":
        return {
          label: "text-lg",
          button: "text-lg",
          tableHeader: "text-lg",
          tableCell: "text-lg",
          dialogTitle: "text-2xl",
          dialogDescription: "text-lg",
          badge: "text-base",
        }
      default:
        return {
          label: "text-sm",
          button: "text-sm",
          tableHeader: "text-sm",
          tableCell: "text-sm",
          dialogTitle: "text-lg",
          dialogDescription: "text-sm",
          badge: "text-xs",
        }
    }
  }

  const textClasses = getTextSizeClasses()

  return (
    <main className="container mx-auto px-4 py-8">
       <div className="mb-8 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className={`font-bold text-gray-900 ${textSize === 'large' ? 'text-4xl' : textSize === 'x-large' ? 'text-5xl' : 'text-3xl'}`}>Inventory</h1>
          <div className="flex gap-2">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className={`w-full md:w-auto bg-green-800 hover:bg-green-900 ${textClasses.button}`}
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add New Ingredient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[450px] p-4 border-2 border-gray-200 rounded-lg shadow-lg">
                <DialogHeader className="pb-2 mb-1">
                  <DialogTitle className={`font-semibold ${textClasses.dialogTitle}`}>Add New Ingredient</DialogTitle>
                </DialogHeader>
                <InventoryForm onSuccess={() => setAddDialogOpen(false)} />
              </DialogContent>
             </Dialog>
            <TextSizeControls />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-end">
        <div className="w-full md:w-1/3">
          <label htmlFor="search-inventory" className={`block font-medium text-gray-700 mb-1 ${textClasses.label}`}>
            Search Inventory
          </label>
          <Input
            id="search-inventory"
            placeholder="Search by any field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${textClasses.tableCell}`}
          />
        </div>

        <div className="w-full md:w-1/4">
          <label htmlFor="filter-category" className={`block font-medium text-gray-700 mb-1 ${textClasses.label}`}>
            Filter by Category
          </label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger id="filter-category" className={`w-full ${textClasses.tableCell}`}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category} className={`cursor-pointer ${textClasses.tableCell}`}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location filter for Admin users */}
        {user?.role === "Admin" && locations.length > 0 && (
          <div className="w-full md:w-1/4">
            <label htmlFor="filter-location" className={`block font-medium text-gray-700 mb-1 ${textClasses.label}`}>
              <MapPin className="inline mr-1 h-4 w-4" />
              Filter by Location
            </label>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger id="filter-location" className={`w-full ${textClasses.tableCell}`}>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className={`cursor-pointer ${textClasses.tableCell}`}>
                  All Locations
                </SelectItem>
                {locations.map((location) => (
                  <SelectItem 
                    key={location.id} 
                    value={location.id.toString()} 
                    className={`cursor-pointer ${textClasses.tableCell}`}
                  >
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="w-full md:w-auto flex flex-col md:flex-row gap-2 md:ml-auto">          
          <Button
            variant={showLowQuantityOnly ? "default" : "outline"}
            onClick={toggleLowQuantityFilter}
            className={`w-full md:w-auto ${textClasses.button}`}
          >
            <Filter className="mr-2 h-5 w-5" />
            {showLowQuantityOnly ? "Show All" : "Low Quantity Only"}
          </Button>

          <Button variant="outline" onClick={exportToCSV} className={`w-full md:w-auto ${textClasses.button}`}>
            <Download className="mr-2 h-5 w-5" />
            Export to CSV
          </Button>


        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <button
                  className={`flex items-center font-semibold text-left ${textClasses.tableHeader}`}
                  onClick={() => requestSort("name")}
                  aria-label="Sort by name"
                >
                  Name {getSortDirectionIcon("name")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className={`flex items-center font-semibold text-left ${textClasses.tableHeader}`}
                  onClick={() => requestSort("quantity")}
                  aria-label="Sort by quantity"
                >
                  Quantity {getSortDirectionIcon("quantity")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className={`flex items-center font-semibold text-left ${textClasses.tableHeader}`}
                  onClick={() => requestSort("threshold_quantity")}
                  aria-label="Sort by threshold quantity"
                >
                  Threshold Quantity {getSortDirectionIcon("threshold_quantity")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className={`flex items-center font-semibold text-left ${textClasses.tableHeader}`}
                  onClick={() => requestSort("price")}
                  aria-label="Sort by price"
                >
                  Price {getSortDirectionIcon("price")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className={`flex items-center font-semibold text-left ${textClasses.tableHeader}`}
                  onClick={() => requestSort("category")}
                  aria-label="Sort by category"
                >
                  Category {getSortDirectionIcon("category")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className={`flex items-center font-semibold text-left ${textClasses.tableHeader}`}
                  onClick={() => requestSort("location")}
                  aria-label="Sort by location"
                >
                  Location {getSortDirectionIcon("location")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className={`flex items-center font-semibold text-left ${textClasses.tableHeader}`}
                  onClick={() => requestSort("storage_type")}
                  aria-label="Sort by storage type"
                >
                  Storage Type {getSortDirectionIcon("storage_type")}
                </button>
              </TableHead>
              <TableHead className={`text-right ${textClasses.tableHeader}`}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIngredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className={`h-24 text-center ${textClasses.tableCell}`}>
                  {showLowQuantityOnly ? "No ingredients with low quantity found." : "No ingredients found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredIngredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell className={`font-medium ${textClasses.tableCell}`}>{ingredient.name}</TableCell>
                  <TableCell className={textClasses.tableCell}>
                    {ingredient.quantity} {ingredient.unit}
                    {ingredient.quantity <= (ingredient.threshold_quantity || 10) && (
                      <Badge variant="destructive" className={`ml-2 ${textClasses.badge}`}>
                        Low
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={textClasses.tableCell}>
                    {ingredient.threshold_quantity || 10} {ingredient.unit}
                  </TableCell>
                  <TableCell className={textClasses.tableCell}>${ingredient.price?.toFixed(2) || "N/A"}</TableCell>
                  <TableCell className={textClasses.tableCell}>{ingredient.category || "Uncategorized"}</TableCell>
                  <TableCell className={textClasses.tableCell}>{ingredient.location?.name || "Not specified"}</TableCell>
                  <TableCell className={textClasses.tableCell}>{getStorageTypeName(ingredient)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={editDialogOpen === ingredient.id} onOpenChange={(open) => setEditDialogOpen(open ? ingredient.id : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            aria-label={`Edit ${ingredient.name}`}
                            onClick={() => setEditDialogOpen(ingredient.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[450px] p-4 border-2 border-gray-200 rounded-lg shadow-lg">
                          <DialogHeader className="pb-2 mb-1">
                            <DialogTitle className={`font-semibold ${textClasses.dialogTitle}`}>Edit Ingredient</DialogTitle>
                          </DialogHeader>
                          <InventoryForm 
                            ingredient={ingredient} 
                            onSuccess={() => setEditDialogOpen(null)} 
                          />
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="destructive"
                        size="icon"
                        aria-label={`Delete ${ingredient.name}`}
                        onClick={() => handleDeleteClick(ingredient.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={textClasses.dialogTitle}>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className={textClasses.dialogDescription}>
              This will permanently delete this ingredient from your inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={textClasses.button}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={`bg-red-600 hover:bg-red-700 ${textClasses.button}`}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
