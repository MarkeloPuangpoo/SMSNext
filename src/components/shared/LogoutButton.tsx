// src/components/shared/LogoutButton.tsx
'use client' // 👈 สำคัญมาก! ต้องเป็น Client Component

import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LogoutButton() {
  const router = useRouter()
  // ใช้ Browser Client สำหรับการโต้ตอบฝั่ง Client
  const supabase = createSupabaseBrowserClient()

  const handleLogout = async () => {
    // 1. เรียก Supabase ให้ออกจากระบบ
    await supabase.auth.signOut()
    
    // 2. สั่ง Refresh หน้าเว็บทั้งหมด
    //    เพื่อให้ Server Components โหลดใหม่ (และ middleware ทำงาน)
    router.refresh()
    
    // (Middleware จะดักจับว่าเราไม่มี session แล้ว และจะเด้งไป /login เอง)
    // หรือจะสั่ง push ไปเลยก็ได้
    // router.push('/login') 
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-2 w-full"
      onClick={handleLogout}
    >
      <span>ออกจากระบบ</span>
    </Button>
  )
}