"use client"

import { MenuItemTable } from "@/components/menu/menu-item-table"
import { TextSizeControls } from "@/components/accessibility/text-size-controls"
import { useTextSize } from "@/lib/context/text-size-context"

export default function MenuPage() {
  const { textSize } = useTextSize();
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`font-bold ${textSize === 'large' ? 'text-4xl' : textSize === 'x-large' ? 'text-5xl' : 'text-3xl'}`}>Menu</h1>
        <TextSizeControls />
      </div>
      <MenuItemTable />
    </div>
  )
}
