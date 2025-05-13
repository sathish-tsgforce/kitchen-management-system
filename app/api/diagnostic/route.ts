import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("[API] GET /api/diagnostic: Running database connection test")

    // Check environment variables
    const envVars = {
      SUPABASE_URL: process.env.SUPABASE_URL ? "✓ Set" : "✗ Missing",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing",
      NODE_ENV: process.env.NODE_ENV,
    }

    console.log("[API] GET /api/diagnostic: Environment variables check:", envVars)

    // Test database connection with a simple query
    console.log("[API] GET /api/diagnostic: Testing database connection")
    const { data, error, status, statusText } = await supabase.from("roles").select("count(*)", { count: "exact" })

    console.log("[API] GET /api/diagnostic: Database connection test result:", {
      success: !error,
      status,
      statusText,
      count: data?.[0]?.count,
      error: error
        ? {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        : null,
    })

    // Check if roles table exists by trying to get its schema
    console.log("[API] GET /api/diagnostic: Checking roles table schema")
    const { data: schemaData, error: schemaError } = await supabase.rpc("get_schema_info", { table_name: "roles" })

    console.log("[API] GET /api/diagnostic: Schema check result:", {
      success: !schemaError,
      hasSchema: !!schemaData?.length,
      schemaCount: schemaData?.length,
      error: schemaError
        ? {
            message: schemaError.message,
            details: schemaError.details,
            hint: schemaError.hint,
            code: schemaError.code,
          }
        : null,
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envVars,
      database: {
        connection: !error ? "Success" : "Failed",
        status,
        statusText,
        error: error
          ? {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            }
          : null,
      },
      schema: {
        rolesTable: {
          exists: !schemaError && schemaData?.length > 0,
          columns: schemaData || [],
          error: schemaError
            ? {
                message: schemaError.message,
                details: schemaError.details,
                hint: schemaError.hint,
                code: schemaError.code,
              }
            : null,
        },
      },
    })
  } catch (error: any) {
    console.error("[API] GET /api/diagnostic: Unhandled exception:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    })

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
