// src/components/shared/Navbar.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import LogoutButton from './LogoutButton'

interface NavbarProps {
  userEmail?: string
}

export default function Navbar({ userEmail }: NavbarProps) {
  return (
    <nav className="border-b bg-white dark:bg-gray-950">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600">
            School DB
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {userEmail}
            </span>
          )}
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}

