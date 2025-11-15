// src/components/shared/TeacherSidebar.tsx
import Link from 'next/link'
import LogoutButton from './LogoutButton'

interface TeacherSidebarProps {
  userEmail?: string
  teacherName?: string
}

export default function TeacherSidebar({ userEmail, teacherName }: TeacherSidebarProps) {
  return (
    <nav className="flex h-full w-64 flex-col border-r bg-white dark:border-gray-700 dark:bg-gray-950">
      {/* ส่วนหัว Sidebar */}
      <div className="p-4">
        <h2 className="text-2xl font-bold text-blue-600">School DB</h2>
        <p className="text-sm text-gray-500">Dashboard ครู</p>
        {teacherName && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {teacherName}
          </p>
        )}
      </div>

      {/* เมนูลิงก์ (Navigation Links) */}
      <div className="flex-1 space-y-2 p-4">
        <Link
          href="/teacher/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <span>📚</span>
          <span>ห้องเรียนของฉัน</span>
        </Link>
      </div>

      {/* ส่วนท้าย (User Info & Logout) */}
      <div className="border-t p-4 dark:border-gray-700">
        <p className="truncate text-sm text-gray-600 dark:text-gray-400" title={userEmail}>
          {userEmail || 'Loading...'}
        </p>
        
        {/* ปุ่ม Logout */}
        <LogoutButton />
      </div>
    </nav>
  )
}

