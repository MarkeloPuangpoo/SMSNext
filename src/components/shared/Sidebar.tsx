// src/components/shared/Sidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import LogoutButton from './LogoutButton'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Calendar,
  Settings,
  School,
  AlertTriangle,
  ChevronRight,
  Users,
  Shield,
  MessageSquare
} from 'lucide-react'

interface SidebarProps {
  userEmail?: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const supabase = createSupabaseBrowserClient()
  const pathname = usePathname()

  useEffect(() => {
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserRole(user.user_metadata?.role || null)
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')
      }
    }
    getUserRole()
  }, [supabase])

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

  const menuItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: 'ภาพรวม',
      show: true,
    },
    {
      href: '/dashboard/students',
      icon: GraduationCap,
      label: 'จัดการนักเรียน',
      show: true,
    },
    {
      href: '/dashboard/teachers',
      icon: Users,
      label: 'จัดการครู',
      show: true,
    },
    {
      href: '/dashboard/courses',
      icon: BookOpen,
      label: 'จัดการวิชา',
      show: true,
    },
    {
      href: '/dashboard/schedule',
      icon: Calendar,
      label: 'จัดการตารางเรียน',
      show: userRole === 'superadmin',
      badge: 'Admin',
    },
    {
      href: '/dashboard/behavior',
      icon: AlertTriangle,
      label: 'จัดการพฤติกรรม',
      show: userRole === 'superadmin',
      badge: 'Admin',
    },
    {
      href: '/dashboard/accounts',
      icon: Shield,
      label: 'จัดการบัญชี',
      show: userRole === 'superadmin',
      badge: 'Admin',
    },
    {
      href: '/dashboard/messages',
      icon: MessageSquare,
      label: 'ข้อความ',
      show: true,
    },
    {
      href: '/dashboard/settings',
      icon: Settings,
      label: 'ตั้งค่า',
      show: true,
    },
  ]

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
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
        {menuItems.map((item) => {
          if (!item.show) return null
          const Icon = item.icon
          const active = isActive(item.href) && (item.href === '/dashboard' ? pathname === '/dashboard' : true)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="flex-1">{item.label}</span>

              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-md">
                  {item.badge}
                </span>
              )}

              {active && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </Link>
          )
        })}
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {userRole === 'superadmin' ? 'ผู้ดูแลระบบ' :
                userRole === 'teacher' ? 'ครู' :
                  userRole === 'student' ? 'นักเรียน' : userRole}
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </nav>
  )
}
