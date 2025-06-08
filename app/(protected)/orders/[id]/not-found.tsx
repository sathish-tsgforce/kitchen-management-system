import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function OrderNotFound() {
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
        <AlertTitle className="text-xl font-bold">Order Not Found</AlertTitle>
        <AlertDescription className="text-lg">
          The order you're looking for doesn't exist or has been removed.
        </AlertDescription>
      </Alert>

      <Button href="/orders" className="bg-green-700 hover:bg-green-800 text-white">
        Return to Orders
      </Button>
    </main>
  )
}
