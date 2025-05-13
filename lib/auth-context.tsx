"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

// Define role types and permissions
export type UserRole = "ADMIN" | "CHEF" | "STAFF"

interface RolePermissions {
  allowedRoutes: string[]
  allowedNavItems: string[]
}

// Define permissions for each role
const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    allowedRoutes: ["/", "/recipes", "/inventory", "/orders", "/menu", "/users", "/recipe"],
    allowedNavItems: ["recipes", "inventory", "orders", "menu", "users"],
  },
  CHEF: {
    allowedRoutes: ["/", "/recipes", "/inventory", "/recipe"],
    allowedNavItems: ["recipes", "inventory"],
  },
  STAFF: {
    allowedRoutes: ["/", "/recipes", "/orders", "/recipe"],
    allowedNavItems: ["recipes", "orders"],
  },
}

// Define user type
export interface AuthUser {
  id: string
  email: string
  username: string
  name: string
  role: UserRole
  roleId: number
}

// Define auth context type
interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (route: string) => boolean
  allowedNavItems: string[]
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider props
interface AuthProviderProps {
  children: ReactNode
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [allowedNavItems, setAllowedNavItems] = useState<string[]>([])
  const router = useRouter()
  const pathname = usePathname()

  // Check if user has permission to access a route - memoized for performance
  const hasPermission = useCallback(
    (route: string): boolean => {
      if (!user) return false
      const permissions = ROLE_PERMISSIONS[user.role]
      return permissions.allowedRoutes.some((allowedRoute) => route.startsWith(allowedRoute))
    },
    [user],
  )

  // Optimized user data fetching
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Use a single query to get user data with role
      const { data, error } = await supabase
        .from("users")
        .select(`
          id,
          email,
          name,
          role_id,
          roles:roles(id, name)
        `)
        .eq("id", userId)
        .single()

      if (error || !data) {
        return null
      }

      // Get role name - handle both array and object formats
      let roleName: string | undefined

      if (Array.isArray(data.roles)) {
        roleName = data.roles[0]?.name
      } else if (typeof data.roles === "object") {
        roleName = data.roles.name
      }

      // Fallback role based on role_id if needed
      if (!roleName) {
        roleName = data.role_id === 1 ? "ADMIN" : data.role_id === 2 ? "CHEF" : "STAFF"
      }

      // Convert role name to uppercase and validate
      const upperRoleName = roleName.toUpperCase() as UserRole
      const validRole = ROLE_PERMISSIONS[upperRoleName] ? upperRoleName : "STAFF"

      return {
        id: data.id,
        email: data.email,
        username: data.email.split("@")[0],
        name: data.name,
        role: validRole,
        roleId: data.role_id,
      }
    } catch (error) {
      console.error("[Auth] Error in fetchUserData:", error)
      return null
    }
  }, [])

  // Initialize auth state - optimized for performance
  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      if (!isMounted) return

      try {
        // Check for existing session - fast path
        const { data } = await supabase.auth.getSession()

        if (!data.session) {
          setUser(null)
          setIsLoading(false)
          if (pathname !== "/login") {
            router.push("/login")
          }
          return
        }

        // We have a session, get user data
        const userProfile = await fetchUserData(data.session.user.id)

        if (!userProfile || !isMounted) {
          if (isMounted) {
            setUser(null)
            setIsLoading(false)
            if (pathname !== "/login") {
              router.push("/login")
            }
          }
          return
        }

        // Set user and allowed nav items
        setUser(userProfile)
        setAllowedNavItems(ROLE_PERMISSIONS[userProfile.role].allowedNavItems)
        setIsLoading(false)
      } catch (error) {
        console.error("[Auth] Auth initialization error:", error)
        if (isMounted) {
          setUser(null)
          setIsLoading(false)
          if (pathname !== "/login") {
            router.push("/login")
          }
        }
      }
    }

    initAuth()

    // Set up auth state change listener - optimized for multi-device support
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === "SIGNED_IN" && session) {
        const userProfile = await fetchUserData(session.user.id)

        if (userProfile && isMounted) {
          setUser(userProfile)
          setAllowedNavItems(ROLE_PERMISSIONS[userProfile.role].allowedNavItems)

          if (pathname === "/login") {
            router.push("/")
          }
        }
      } else if (event === "SIGNED_OUT" && isMounted) {
        setUser(null)
        setAllowedNavItems([])
        if (pathname !== "/login") {
          router.push("/login")
        }
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [router, pathname, fetchUserData])

  // Login function - optimized for performance
  const login = async (username: string, password: string) => {
    setIsLoading(true)

    try {
      // First, look up the email associated with the username
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .ilike("name", username)
        .single()

      if (userError || !userData) {
        throw new Error("Invalid username or password")
      }

      // Sign in with the email and password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      })

      if (signInError) {
        throw new Error(signInError.message)
      }

      // Auth state listener will handle setting the user and navigation
    } catch (error: any) {
      console.error("[Auth] Login error:", error)
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      })
      setUser(null)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function - optimized for performance
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      // Auth state listener will handle clearing the user and navigation
    } catch (error) {
      console.error("[Auth] Logout error:", error)
      toast({
        title: "Logout Failed",
        description: "An error occurred during logout",
        variant: "destructive",
      })
    }
  }

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
    allowedNavItems,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
