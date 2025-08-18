"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from 'js-cookie'

type User = {
  id: string
  email: string
  name?: string
  role_id?: number
  role?: string
  location_id?: number
  location?: {
    id: number
    name: string
  }
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signOut: () => void
  signIn: (userData: User, token: string) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: () => {},
  signIn: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for user data in cookies
    const userDataStr = Cookies.get('user')
    const token = Cookies.get('token')
    
    if (userDataStr && token) {
      try {
        const userData = JSON.parse(userDataStr)
        setUser(userData)
      } catch (error) {
        console.error("Error parsing user data:", error)
        // Clear invalid cookies
        Cookies.remove('user')
        Cookies.remove('token')
      }
    }
    
    setLoading(false)
  }, [])

  const signIn = (userData: User, token: string) => {
    // Set user data and token in cookies
    Cookies.set('user', JSON.stringify(userData), { expires: 7 }) // 7 days
    Cookies.set('token', token, { expires: 7 })
    setUser(userData)
  }

  const signOut = () => {
    // Clear cookies and user state
    Cookies.remove('user')
    Cookies.remove('token')
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)