// src/components/shared/TeacherSidebar.tsx
'use client'

import Link from 'next/link'
import LogoutButton from './LogoutButton'
import { usePathname } from 'next/navigation'
import { BookOpen, School, Sparkles, ChevronRight, MessageSquare } from 'lucide-react'

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
    <nav className="flex h-full w-64 lg:w-72 flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
      
      {/* Moving gradient balls */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* ส่วนหัว Sidebar */}
      <div className="relative p-4 md:p-6 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2 md:gap-3 mb-2">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-md group-hover:blur-lg transition-all"></div>
            <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-2xl transform group-hover:scale-110 transition-all">
              <School className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-white truncate flex items-center gap-2">
              School DB
              <Sparkles className="w-4 h-4 text-purple-400" />
            </h2>
            <p className="text-xs text-purple-300 font-medium">Management System</p>
          </div>
        </div>
        {teacherName && (
          <div className="mt-2 md:mt-3 px-2 md:px-3 py-1.5 md:py-2 rounded-xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10">
            <p className="text-xs text-gray-400 hidden md:block">Teacher</p>
            <p className="text-xs md:text-sm font-semibold text-white truncate">{teacherName}</p>
          </div>
        )}
      </div>

      {/* เมนูลิงก์ (Navigation Links) */}
      <div className="relative flex-1 space-y-1 md:space-y-1.5 p-3 md:p-4">
        <Link
          href="/teacher/dashboard"
          className={`group flex items-center gap-2 md:gap-3 rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 transition-all duration-200 text-sm md:text-base relative overflow-hidden ${
            isActive('/teacher/dashboard') && !pathname.includes('/messages')
              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white shadow-lg border border-white/10'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          {isActive('/teacher/dashboard') && !pathname.includes('/messages') && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
          )}
          <div className={`relative p-2 rounded-lg flex-shrink-0 ${
            isActive('/teacher/dashboard') && !pathname.includes('/messages')
              ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg'
              : 'bg-white/5 group-hover:bg-white/10'
          }`}>
            <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="relative font-medium truncate flex-1">ห้องเรียนของฉัน</span>
          {isActive('/teacher/dashboard') && !pathname.includes('/messages') && (
            <ChevronRight className="w-4 h-4 text-white animate-pulse flex-shrink-0" />
          )}
        </Link>

        <Link
          href="/teacher/messages"
          className={`group flex items-center gap-2 md:gap-3 rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 transition-all duration-200 text-sm md:text-base relative overflow-hidden ${
            isActive('/teacher/messages')
              ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-white shadow-lg border border-white/10'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          {isActive('/teacher/messages') && (
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10"></div>
          )}
          <div className={`relative p-2 rounded-lg flex-shrink-0 ${
            isActive('/teacher/messages')
              ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg'
              : 'bg-white/5 group-hover:bg-white/10'
          }`}>
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="relative font-medium truncate flex-1">ข้อความ</span>
          {isActive('/teacher/messages') && (
            <ChevronRight className="w-4 h-4 text-white animate-pulse flex-shrink-0" />
          )}
        </Link>
      </div>

      {/* ส่วนท้าย (User Info & Logout) */}
      <div className="relative border-t border-white/10 p-3 md:p-4 backdrop-blur-sm">
        <div className="mb-2 md:mb-3 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 p-3 md:p-4 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-md"></div>
              <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg">
                {teacherName ? teacherName.charAt(0).toUpperCase() : 'T'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 bg-green-500 rounded-full border-2 border-gray-900"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5 hidden md:block">Logged in as</p>
              <p className="truncate text-xs md:text-sm font-semibold text-white" title={userEmail}>
                {userEmail || 'Loading...'}
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            <span className="text-xs font-semibold text-purple-300">Teacher</span>
          </div>
        </div>
        
        <LogoutButton />
      </div>
    </nav>
  )
}
