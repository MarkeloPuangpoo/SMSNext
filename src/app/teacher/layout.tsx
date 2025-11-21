// src/app/teacher/layout.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeacherSidebar from '@/components/shared/TeacherSidebar'

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userRole = user.user_metadata?.role
  if (userRole !== 'teacher') {
    redirect('/login')
  }

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!teacher) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Teacher Sidebar - Hidden on mobile, visible on desktop */}
      <aside className="hidden lg:flex">
        <TeacherSidebar 
          userEmail={user.email}
          teacherName={`${teacher.first_name} ${teacher.last_name}`}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full lg:w-auto">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
