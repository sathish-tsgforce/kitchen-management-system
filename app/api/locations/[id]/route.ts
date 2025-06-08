import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    
    const supabase = createClient()
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error fetching location:`, error)
    return NextResponse.json({ error: "Failed to fetch location" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const { name, address, is_active } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("locations")
      .update({ name, address, is_active })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    
    const supabase = createClient()
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting location:", error)
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 })
  }
}