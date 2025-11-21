// src/components/shared/LogoutButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      onClick={handleLogout}
    >
      <LogOut className="w-4 h-4 mr-2" />
      <span className="font-medium">ออกจากระบบ</span>
    </Button>
  )
}
