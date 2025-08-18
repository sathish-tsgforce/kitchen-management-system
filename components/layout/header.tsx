import Link from "next/link"
import Image from "next/image"
import { MainNav } from "@/components/layout/main-nav"
import { UserNav } from "@/components/layout/user-nav"

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="flex items-center text-2xl font-bold text-green-800 mr-8">
          <Image 
            src="/logo.jpg" 
            alt="Kitchen Management System Logo" 
            width={120} 
            height={100} 
            className="rounded-md object-cover"
          />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <span className="hidden sm:inline">Kitchen Management System</span>
          <span className="sm:hidden">KMS</span>
        </Link>
        <MainNav />
        <div className="ml-auto flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  )
}
