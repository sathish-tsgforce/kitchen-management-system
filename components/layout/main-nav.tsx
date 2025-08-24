"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTextSize } from "@/lib/context/text-size-context"
import { useAuth } from "@/lib/context/auth-context"

export function MainNav() {
  const pathname = usePathname()
  const { textSize } = useTextSize()
  const { user } = useAuth()

  // Define all possible routes
  const allRoutes = [
    {
      href: "/recipes",
      label: "Recipes",
      active: pathname === "/recipes" || pathname.startsWith("/recipes/"),
      roles: ["Admin", "Chef", "Server"] // Available to all roles
    },
    {
      href: "/inventory",
      label: "Inventory",
      active: pathname === "/inventory",
      roles: ["Admin", "Chef", "Server"] // Available to all roles
    },
    {
      href: "/locations",
      label: "Locations",
      active: pathname === "/locations",
      roles: ["Admin"] // Admin only
    },
    {
      href: "/storage-types",
      label: "Storage Types",
      active: pathname === "/storage-types",
      roles: ["Admin"] // Admin only
    },
    {
      href: "/menu",
      label: "Menu",
      active: pathname === "/menu" || pathname.startsWith("/menu/"),
      roles: ["Admin"] // Admin only
    },
    {
      href: "/users",
      label: "Users",
      active: pathname === "/users",
      roles: ["Admin"] // Admin only
    },
  ]

  // Filter routes based on user role
  const routes = allRoutes.filter(route => {
    // If no user or no role, don't show any routes (shouldn't happen due to auth)
    if (!user || !user.role) return false
    
    // Check if the user's role is in the allowed roles for this route
    return route.roles.includes(user.role)
  })

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            `text-${textSize} font-medium transition-colors hover:text-primary`,
            route.active ? "text-black dark:text-white" : "text-muted-foreground",
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  )
}