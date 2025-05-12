"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// Mock user for development
const mockUser: User = {
  id: "mock-user-id",
  email: "admin@example.com",
  name: "Admin User",
  role_id: 1,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(mockUser) // Always logged in with mock user
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      // Just set the mock user
      setUser(mockUser)

      console.log("Mock sign in successful for:", email)
    } catch (err: any) {
      console.error("Error signing in:", err)
      setError(err.message || "Failed to sign in")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)

      // For development, we'll just keep the user logged in
      console.log("Mock sign out - user remains logged in for development")
    } catch (err: any) {
      console.error("Error signing out:", err)
      setError(err.message || "Failed to sign out")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
