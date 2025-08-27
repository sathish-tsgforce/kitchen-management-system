import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET /api/config - Get all config or specific config by key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    let query = supabase.from('config').select('*')
    
    if (key) {
      query = query.eq('key', key).single()
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching config:', error)
      return NextResponse.json(
        { error: 'Failed to fetch config' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in config GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/config - Update config value
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('config')
      .update({ 
        value: value.toString(),
        updated_at: new Date().toISOString()
      })
      .eq('key', key)
      .select()
      .single()

    if (error) {
      console.error('Error updating config:', error)
      return NextResponse.json(
        { error: 'Failed to update config' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in config PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
