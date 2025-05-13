"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface NavItem {
  id: string
  title: string
  href: string
  disabled?: boolean
}

export function MainNav() {
  const pathname = usePathname()
  const { allowedNavItems } = useAuth()

  const items: NavItem[] = [
    {
      id: "recipes",
      title: "Recipes",
      href: "/recipes",
    },
    {
      id: "inventory",
      title: "Inventory",
      href: "/inventory",
    },
    {
      id: "orders",
      title: "Orders",
      href: "/orders",
    },
    {
      id: "menu",
      title: "Menu",
      href: "/menu",
    },
    {
      id: "users",
      title: "Users",
      href: "/users",
    },
  ].filter((item) => allowedNavItems.includes(item.id))

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "text-lg font-medium transition-colors",
            pathname?.startsWith(item.href) ? "font-bold text-green-700" : "font-bold text-green-700 hover:text-green-600",
            item.disabled && "cursor-not-allowed opacity-80",
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
