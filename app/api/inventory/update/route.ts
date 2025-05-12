import { NextResponse } from "next/server"
import { updateInventoryInBackground } from "@/lib/workers/inventory-worker"

export async function POST(request: Request) {
  try {
    const { orderId, action } = await request.json()

    if (!orderId || !action) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // Start background process
    updateInventoryInBackground(orderId, action)
      .then((success) => {
        console.log(`Background inventory update ${success ? "completed" : "failed"} for order ${orderId}`)
      })
      .catch((err) => {
        console.error("Background inventory update error:", err)
      })

    // Return immediately without waiting for the background process
    return NextResponse.json({ success: true, message: "Inventory update started" })
  } catch (error) {
    console.error("Error processing inventory update request:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
