import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/layout/header"
import { AuthProvider } from "@/lib/auth-context"
import { DataProvider } from "@/lib/context/data-context"
import { QueryProvider } from "@/components/providers/query-provider"
import { TextSizeProvider } from "@/lib/context/text-size-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Recipe Management System",
  description: "A comprehensive system for managing recipes, inventory, and orders",
    generator: 'v0.dev'
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
            <DataProvider>
              <TextSizeProvider>
                <Header />
                {children}
                <Toaster />
              </TextSizeProvider>
            </DataProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
