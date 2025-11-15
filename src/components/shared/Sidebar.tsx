// src/components/shared/Sidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

// เราจะรับ userEmail มาจาก layout.tsx
interface SidebarProps {
  userEmail?: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const [userRole, setUserRole] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserRole(user.user_metadata?.role || null)
      }
    }
    getUserRole()
  }, [supabase])

  return (
    <nav className="flex h-full w-64 flex-col border-r bg-white dark:border-gray-700 dark:bg-gray-950">
      {/* ส่วนหัว Sidebar (Logo/ชื่อเว็บ) */}
      <div className="p-4">
        <h2 className="text-2xl font-bold text-blue-600">School DB</h2>
        <p className="text-sm text-gray-500">Dashboard</p>
      </div>

      {/* เมนูลิงก์ (Navigation Links) */}
      <div className="flex-1 space-y-2 p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <span>📊</span>
          <span>Overview</span>
        </Link>
        <Link
          href="/dashboard/students"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <span>🎓</span>
          <span>Students</span>
        </Link>
        <Link
          href="/dashboard/teachers"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <span>👩‍🏫</span>
          <span>Teachers</span>
        </Link>
        <Link
          href="/dashboard/courses"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <span>📚</span>
          <span>จัดการวิชา</span>
        </Link>
        {userRole === 'superadmin' && (
          <Link
            href="/dashboard/schedule"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <span>📅</span>
            <span>จัดการตารางเรียน</span>
          </Link>
        )}
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <span>⚙️</span>
          <span>Settings</span>
        </Link>
      </div>

      {/* ส่วนท้าย (User Info & Logout) */}
      <div className="border-t p-4 dark:border-gray-700">
        <p className="truncate text-sm text-gray-600 dark:text-gray-400" title={userEmail}>
          {userEmail || 'Loading...'}
        </p>
        
        {/* ปุ่ม Logout (Client Component) */}
        <LogoutButton />
      </div>
    </nav>
  )
}
