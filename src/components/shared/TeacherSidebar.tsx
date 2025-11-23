// src/components/shared/TeacherSidebar.tsx
'use client'

import Link from 'next/link'
import LogoutButton from './LogoutButton'
import { usePathname } from 'next/navigation'
import { BookOpen, School, ChevronRight, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeacherSidebarProps {
  userEmail?: string
  teacherName?: string
}

export default function TeacherSidebar({ userEmail, teacherName }: TeacherSidebarProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  return (
    <nav className="flex h-full w-64 lg:w-72 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo & Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground tracking-tight">
              SchoolDB
            </h2>
            <p className="text-xs text-muted-foreground">
              Teacher Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
        <Link
          href="/teacher/dashboard"
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive('/teacher/dashboard') && !pathname.includes('/messages')
              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <BookOpen className={cn("w-5 h-5", isActive('/teacher/dashboard') && !pathname.includes('/messages') ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
          <span className="flex-1">ห้องเรียนของฉัน</span>
          {isActive('/teacher/dashboard') && !pathname.includes('/messages') && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </Link>

        <Link
          href="/teacher/messages"
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive('/teacher/messages')
              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <MessageSquare className={cn("w-5 h-5", isActive('/teacher/messages') ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
          <span className="flex-1">ข้อความ</span>
          {isActive('/teacher/messages') && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </Link>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground">
            {teacherName ? teacherName.charAt(0).toUpperCase() : 'T'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {teacherName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              ครู
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </nav>
  )
}
