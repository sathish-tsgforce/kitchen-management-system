"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTextSize } from "@/lib/context/text-size-context"

export function MainNav() {
  const pathname = usePathname()
  const { textSize } = useTextSize()

  const routes = [
    {
      href: "/menu",
      label: "Menu",
      active: pathname === "/menu" || pathname.startsWith("/menu/"),
    },
    {
      href: "/inventory",
      label: "Inventory",
      active: pathname === "/inventory",
    },
    {
      href: "/recipes",
      label: "Recipes",
      active: pathname === "/recipes" || pathname.startsWith("/recipes/"),
    },
    {
      href: "/orders",
      label: "Orders",
      active: pathname === "/orders" || pathname.startsWith("/orders/"),
    },
    {
      href: "/users",
      label: "Users",
      active: pathname === "/users",
    },
  ]

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
