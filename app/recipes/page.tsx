import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import RecipeList from "@/components/recipes/recipe-list"
import SearchBar from "@/components/layout/search-bar"

export default function RecipesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold text-gray-900">Recipes</h1>
        <Link href="/recipes/new">
          <Button className="bg-green-700 hover:bg-green-800 text-white">
            <Plus className="mr-2 h-5 w-5" />
            Create New Recipe
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <SearchBar />
      </div>

      <Suspense fallback={<div>Loading recipes...</div>}>
        <RecipeList />
      </Suspense>
    </main>
  )
}
