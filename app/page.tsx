import { MenuItemTable } from "@/components/menu/menu-item-table"

export default function HomePage() {
  return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Menu</h1>
        <MenuItemTable />
      </div>
    )
  }
