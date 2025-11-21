// src/app/dashboard/layout.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/shared/Sidebar'

export default async function DashboardLayout({
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
  if (userRole === 'teacher') {
    redirect('/teacher/dashboard')
  }

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside className="hidden lg:flex h-full">
        <Sidebar userEmail={user.email} />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full lg:w-auto bg-secondary/20">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
