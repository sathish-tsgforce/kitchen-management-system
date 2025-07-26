import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/context/auth-context"
import { QueryProvider } from "@/components/providers/query-provider"
import { TextSizeProviderWrapper } from "@/components/providers/text-size-provider-wrapper"
import { Header } from "@/components/layout/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kitchen Management System",
  description: "A comprehensive system for managing recipes, inventory, and orders",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <QueryProvider>
          <AuthProvider>
            <TextSizeProviderWrapper>
              {children}
              <Toaster />
            </TextSizeProviderWrapper>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}