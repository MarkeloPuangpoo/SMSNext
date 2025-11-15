// src/app/dashboard/layout.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Import Sidebar component
import Sidebar from '@/components/shared/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. สร้าง Server Client
  const supabase = await createSupabaseServerClient()

  // 2. ดึงข้อมูล User ที่กำลัง login
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. ถ้าไม่มี user, redirect ไปหน้า login
  if (!user) {
    redirect('/login')
  }

  // 4. Struktur Layout
  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar userEmail={user.email} />

      {/* Area Konten Utama */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

