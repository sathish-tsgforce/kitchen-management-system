"use client"

import { useState } from "react"
import { Plus, ArrowUpDown, Edit, Trash2, Download, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import InventoryForm from "@/components/inventory/inventory-form"
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
import { useToast } from "@/components/ui/use-toast"

export default function InventoryPage() {
  const { ingredients, deleteIngredient } = useData()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ingredientToDelete, setIngredientToDelete] = useState<number | null>(null)
  const [showLowQuantityOnly, setShowLowQuantityOnly] = useState(false)
  const { toast } = useToast()

  // Get unique categories for filter dropdown
  const categories = ["all", ...new Set(ingredients.map((ingredient) => ingredient.category))].filter(Boolean)

  // Sort ingredients
  const sortedIngredients = [...ingredients].sort((a, b) => {
    if (!sortConfig) return 0

    const key = sortConfig.key as keyof typeof a

    if (a[key] < b[key]) {
      return sortConfig.direction === "ascending" ? -1 : 1
    }
    if (a[key] > b[key]) {
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
      (ingredient.location && String(ingredient.location).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ingredient.quantity !== undefined && String(ingredient.quantity).includes(searchQuery)) ||
      (ingredient.price !== undefined && String(ingredient.price).includes(searchQuery))

    const matchesCategory = filterCategory === "all" || ingredient.category === filterCategory

    const matchesLowQuantity = !showLowQuantityOnly || (ingredient.quantity !== undefined && ingredient.quantity < 10)

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
      <ArrowUpDown className="ml-2 h-4 w-4 text-green-600" />
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

  // Export to CSV
  const exportToCSV = () => {
    try {
      // Define the headers
      const headers = ["Name", "Quantity", "Unit", "Price", "Category", "Location"]

      // Format the data
      const data = ingredients.map((ingredient) => [
        ingredient.name,
        ingredient.quantity,
        ingredient.unit,
        ingredient.price ? `$${ingredient.price.toFixed(2)}` : "N/A",
        ingredient.category || "Uncategorized",
        ingredient.location || "Not specified",
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-xl text-gray-700">Manage your ingredients inventory</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-end">
        <div className="w-full md:w-1/3">
          <label htmlFor="search-inventory" className="block text-sm font-medium text-gray-700 mb-1">
            Search Inventory
          </label>
          <Input
            id="search-inventory"
            placeholder="Search by any field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="w-full md:w-1/4">
          <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Category
          </label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger id="filter-category" className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category} className="cursor-pointer">
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-auto flex flex-col md:flex-row gap-2 md:ml-auto">
          <Button
            variant={showLowQuantityOnly ? "default" : "outline"}
            onClick={toggleLowQuantityFilter}
            className="w-full md:w-auto"
          >
            <Filter className="mr-2 h-5 w-5" />
            {showLowQuantityOnly ? "Show All" : "Low Quantity Only"}
          </Button>

          <Button variant="outline" onClick={exportToCSV} className="w-full md:w-auto">
            <Download className="mr-2 h-5 w-5" />
            Export to CSV
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-green-700 hover:bg-green-800">
                <Plus className="mr-2 h-5 w-5" />
                Add New Ingredient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-2xl">Add New Ingredient</DialogTitle>
              </DialogHeader>
              <InventoryForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("name")}
                  aria-label="Sort by name"
                >
                  Name {getSortDirectionIcon("name")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("quantity")}
                  aria-label="Sort by quantity"
                >
                  Quantity {getSortDirectionIcon("quantity")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("price")}
                  aria-label="Sort by price"
                >
                  Price {getSortDirectionIcon("price")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("category")}
                  aria-label="Sort by category"
                >
                  Category {getSortDirectionIcon("category")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center font-semibold text-left"
                  onClick={() => requestSort("location")}
                  aria-label="Sort by location"
                >
                  Location {getSortDirectionIcon("location")}
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIngredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {showLowQuantityOnly ? "No ingredients with low quantity found." : "No ingredients found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredIngredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>
                    {ingredient.quantity} {ingredient.unit}
                    {ingredient.quantity < 10 && (
                      <Badge variant="destructive" className="ml-2">
                        Low
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>${ingredient.price?.toFixed(2) || "N/A"}</TableCell>
                  <TableCell>{ingredient.category || "Uncategorized"}</TableCell>
                  <TableCell>{ingredient.location || "Not specified"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" aria-label={`Edit ${ingredient.name}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle className="text-2xl">Edit Ingredient</DialogTitle>
                          </DialogHeader>
                          <InventoryForm ingredient={ingredient} />
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this ingredient from your inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
