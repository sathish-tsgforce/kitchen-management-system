import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="h-9 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="border rounded-lg p-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-lg text-gray-500">Loading locations...</span>
        </div>
      </div>
    </div>
  )
}