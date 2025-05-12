"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data won't be considered stale for 5 minutes
            // This prevents unnecessary refetching
            staleTime: 5 * 60 * 1000,

            // Keep data in cache for 30 minutes
            gcTime: 30 * 60 * 1000,

            // Don't refetch on window focus for this application
            // since data is manually invalidated when needed
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
