// src/app/teacher/layout.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeacherSidebar from '@/components/shared/TeacherSidebar'

export default async function TeacherLayout({
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

  // 4. ตรวจสอบ role - ถ้าไม่ใช่ teacher ให้ redirect
  const userRole = user.user_metadata?.role
  if (userRole !== 'teacher') {
    redirect('/login')
  }

  // 5. ดึงข้อมูลครู
  const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!teacher) {
    redirect('/login')
  }

  // 6. Struktur Layout
  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900">
      {/* Teacher Sidebar */}
      <TeacherSidebar 
        userEmail={user.email}
        teacherName={`${teacher.first_name} ${teacher.last_name}`}
      />

      {/* Area Konten Utama */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

