"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      label: "Recipes",
      active: pathname === "/" || pathname.startsWith("/recipes"),
    },
    {
      href: "/inventory",
      label: "Inventory",
      active: pathname === "/inventory",
    },
    {
      href: "/orders",
      label: "Orders",
      active: pathname === "/orders" || pathname.startsWith("/orders/"),
    },
    {
      href: "/menu",
      label: "Menu",
      active: pathname === "/menu" || pathname.startsWith("/menu/"),
    },
  ]

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-lg font-medium transition-colors hover:text-green-700",
            route.active ? "text-green-700 font-bold" : "text-gray-700",
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  )
}
