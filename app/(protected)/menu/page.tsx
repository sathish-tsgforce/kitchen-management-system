"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MenuItemTable } from "@/components/menu/menu-item-table"
import { TextSizeControls } from "@/components/accessibility/text-size-controls"
import { useTextSize } from "@/lib/context/text-size-context"

export default function MenuPage() {
  const { textSize } = useTextSize()
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`font-bold ${textSize === 'large' ? 'text-4xl' : textSize === 'x-large' ? 'text-5xl' : 'text-3xl'}`}>Menu</h1>
        <div className="flex space-x-2">
          <Button asChild className="bg-green-800 hover:bg-green-900 text-white">
            <Link href="/menu/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Link>
          </Button>
          <TextSizeControls />
        </div>
      </div>
      <MenuItemTable />
    </div>
  )
}
