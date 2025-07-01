"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)

  // Debounce search query to avoid too many URL updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update URL when debounced query changes
  useEffect(() => {
    if (debouncedQuery === initialQuery) return

    // Create new URLSearchParams
    const params = new URLSearchParams(searchParams)

    // Set or remove the search query parameter
    if (debouncedQuery) {
      params.set("q", debouncedQuery)
    } else {
      params.delete("q")
    }

    // Update the URL with the new search params
    router.push(`/?${params.toString()}`)
  }, [debouncedQuery, initialQuery, router, searchParams])

  return (
    <div className="w-full">
      <div className="relative">
        <label htmlFor="recipe-search" className="sr-only">
          Search recipes
        </label>
        <div className="flex">
          <Input
            id="recipe-search"
            type="search"
            placeholder="Search recipes by name..."
            className="w-full text-lg p-4 h-auto rounded-r-none border-2 border-r-0 border-gray-300 focus-visible:ring-green-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search recipes"
          />
          <div className="bg-green-800 hover:bg-green-900 rounded-l-none px-6 flex items-center">
            <Search className="h-5 w-5 text-white" />
            <span className="sr-only">Search</span>
          </div>
        </div>
      </div>
    </div>
  )
}
