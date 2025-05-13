"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
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
    allowedRoutes: ["/", "/recipes", "/inventory", "/orders", "/menu", "/users"],
    allowedNavItems: ["recipes", "inventory", "orders", "menu", "users"],
  },
  CHEF: {
    allowedRoutes: ["/", "/recipes", "/inventory"],
    allowedNavItems: ["recipes", "inventory"],
  },
  STAFF: {
    allowedRoutes: ["/", "/recipes", "/orders"],
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

  // Check if user has permission to access a route
  const hasPermission = (route: string): boolean => {
    if (!user) return false
    const permissions = ROLE_PERMISSIONS[user.role]
    return permissions.allowedRoutes.some((allowedRoute) => route.startsWith(allowedRoute))
  }

  // Fetch user data from database
  const fetchUserData = async (userId: string) => {
    try {
      console.log(`[Auth] Fetching user data`)

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

      if (error) {
        console.error("[Auth] Error fetching user data:", error)
        return null
      }

      if (!data) {
        console.error("[Auth] No user data found")
        return null
      }

      console.log("[Auth] User data fetched successfully")

      // Check if roles data exists and has the expected structure
      if (!data.roles) {
        console.error("[Auth] No role data found for user")
        return null
      }

      // Get role name - handle both array and object formats that Supabase might return
      let roleName: string | undefined

      if (Array.isArray(data.roles)) {
        roleName = data.roles[0]?.name
      } else if (typeof data.roles === "object") {
        roleName = data.roles.name
      }

      console.log("[Auth] Role name:", roleName)

      if (!roleName) {
        console.error("[Auth] Role name is undefined")

        // Fallback to a default role based on role_id
        if (data.role_id === 1) {
          roleName = "ADMIN"
        } else if (data.role_id === 2) {
          roleName = "CHEF"
        } else {
          roleName = "STAFF"
        }

        console.log("[Auth] Using fallback role:", roleName)
      }

      // Convert role name to uppercase and validate
      const upperRoleName = roleName.toUpperCase() as UserRole

      if (!ROLE_PERMISSIONS[upperRoleName]) {
        console.error(`[Auth] Invalid role: ${upperRoleName}`)

        // Fallback to STAFF role if the role is invalid
        console.log("[Auth] Falling back to STAFF role")
        return {
          id: data.id,
          email: data.email,
          username: data.email.split("@")[0],
          name: data.name,
          role: "STAFF" as UserRole,
          roleId: data.role_id,
        }
      }

      return {
        id: data.id,
        email: data.email,
        username: data.email.split("@")[0],
        name: data.name,
        role: upperRoleName,
        roleId: data.role_id,
      }
    } catch (error) {
      console.error("[Auth] Error in fetchUserData:", error)
      return null
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)

      try {
        // Check for existing session
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData?.session) {
          const { user: authUser } = sessionData.session

          // Get user metadata
          const { data: userData } = await supabase.auth.getUser()
          const username = userData?.user?.user_metadata?.username || authUser.email?.split("@")[0] || ""

          // Fetch complete user data from database
          const userProfile = await fetchUserData(authUser.id)

          if (userProfile) {
            const fullUser = {
              ...userProfile,
              username,
            }

            setUser(fullUser)
            setAllowedNavItems(ROLE_PERMISSIONS[fullUser.role].allowedNavItems)

            // Redirect if on a route they don't have permission for
            if (
              pathname &&
              !ROLE_PERMISSIONS[fullUser.role].allowedRoutes.some((route) => pathname.startsWith(route))
            ) {
              router.push("/")
            }
          } else {
            // User exists in auth but not in database
            console.error("[Auth] User exists in auth but not in database")
            await supabase.auth.signOut()
            setUser(null)
            router.push("/login")
          }
        } else {
          // No session
          setUser(null)
          if (pathname !== "/login") {
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("[Auth] Auth initialization error:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth] Auth state changed:", event)

      if (event === "SIGNED_IN" && session) {
        const { user: authUser } = session

        // Get user metadata
        const { data: userData } = await supabase.auth.getUser()
        const username = userData?.user?.user_metadata?.username || authUser.email?.split("@")[0] || ""

        // Fetch complete user data from database
        const userProfile = await fetchUserData(authUser.id)

        if (userProfile) {
          const fullUser = {
            ...userProfile,
            username,
          }

          setUser(fullUser)
          setAllowedNavItems(ROLE_PERMISSIONS[fullUser.role].allowedNavItems)

          // Navigate to home page if on login page
          if (pathname === "/login") {
            router.push("/")
          }
        } else {
          // User exists in auth but not in database
          console.error("[Auth] User exists in auth but not in database")
          toast({
            title: "Authentication Error",
            description: "Your user account is not properly set up. Please contact an administrator.",
            variant: "destructive",
          })
          await supabase.auth.signOut()
          setUser(null)
          router.push("/login")
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setAllowedNavItems([])
        router.push("/login")
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, pathname])

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true)

    try {
      console.log(`[Auth] Login attempt initiated`)

      // First, look up the email associated with the username
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .ilike("name", username) // Using name field as username
        .single()

      if (userError || !userData) {
        console.error("[Auth] User lookup error:", userError)
        throw new Error("Invalid username or password")
      }

      const email = userData.email
      console.log(`[Auth] User email resolved`)

      // Now sign in with the email and password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("[Auth] Sign in error:", signInError)
        throw new Error(signInError.message)
      }

      console.log("[Auth] Sign in successful")

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

  // Logout function
  const logout = async () => {
    setIsLoading(true)

    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("[Auth] Logout error:", error)
      toast({
        title: "Logout Failed",
        description: "An error occurred during logout",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
