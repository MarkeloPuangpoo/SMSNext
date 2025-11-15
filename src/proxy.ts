// src/proxy.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. สร้าง Supabase client สำหรับ Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // (ฟังก์ชัน get/set/remove สำหรับ Middleware)
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 2. ตรวจสอบ Session (และรีเฟรช token)
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // --- 3. ตรรกะสำหรับผู้ใช้ที่ "ล็อกอินแล้ว" ---
  if (session) {
    if (pathname === '/login' || pathname === '/register') {
      // ตรวจสอบ role และ redirect ไปที่หน้าที่ถูกต้อง
      const userRole = session.user.user_metadata?.role
      if (userRole === 'student') {
        return NextResponse.redirect(new URL('/student/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  // --- 4. ตรรกะสำหรับผู้ใช้ที่ "ยังไม่ล็อกอิน" ---
  if (!session) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/student')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 5. ส่งต่อ response
  return response
}

// Config สำหรับ Proxy (Next.js 16)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}