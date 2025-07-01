"use client"

import { useAuth } from "@/lib/auth-context"
import { TextSizeProvider } from "@/lib/context/text-size-context"

export function TextSizeProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  
  return (
    <TextSizeProvider userRole={user?.role}>
      {children}
    </TextSizeProvider>
  )
} 