"use client"

import type React from "react"
import { AuthProvider } from "@/lib/context/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { QueryProvider } from "@/components/providers/query-provider"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <QueryProvider>
        {children}
        <Toaster />
      </QueryProvider>
    </AuthProvider>
  )
}
