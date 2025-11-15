// src/app/student/layout.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentLayout({
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

  // ตรวจสอบว่าเป็น student หรือไม่
  const userRole = user.user_metadata?.role
  if (userRole !== 'student') {
    redirect('/dashboard')
  }

  return <>{children}</>
}

