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
    const userRole = session.user.user_metadata?.role

    // --- A. Guest ---
    if (userRole === 'guest') {
      // ถ้าเป็น guest, ให้ไปหน้า welcome เท่านั้น
      // และห้ามเข้าหน้าอื่น (ยกเว้น API)
      if (pathname !== '/guest/welcome' && !pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL('/guest/welcome', request.url))
      }
    } 
    
    // --- B. Student ---
    else if (userRole === 'student') {
      // ถ้าเป็น student และพยายามเข้าหน้า guest/login/register/admin
      if (pathname.startsWith('/guest') || pathname === '/login' || pathname === '/register' || pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/student/dashboard', request.url))
      }
    } 
    
    // --- C. Teacher ---
    else if (userRole === 'teacher') {
      // ถ้าเป็น teacher และพยายามเข้าหน้า guest/login/register/student/dashboard หลัก
      if (pathname.startsWith('/guest') || pathname === '/login' || pathname === '/register' || pathname.startsWith('/student')) {
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      }
      // จำกัดสิทธิ์ครู - ไม่ให้เข้าถึง dashboard หลัก
      if (pathname.startsWith('/dashboard') && !pathname.startsWith('/teacher')) {
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
      }
    }
    
    // --- D. Admin/Superadmin ---
    else if (userRole === 'superadmin' || !userRole) {
      // ถ้าเป็น admin/superadmin และพยายามเข้าหน้า guest/login/register/student/teacher
      if (pathname.startsWith('/guest') || pathname === '/login' || pathname === '/register' || pathname.startsWith('/student') || pathname.startsWith('/teacher')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      // จำกัดสิทธิ์ admin/อื่นๆ - ไม่ให้เข้าถึง teacher dashboard
      if (pathname.startsWith('/teacher')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    
    // --- E. กรณีอื่นๆ (เช่น User ที่เพิ่งสมัครแต่ Trigger ยังไม่ทำงาน) ---
    else {
       // ถ้า login แล้ว แต่ดันไม่มี role หรือพยายามเข้าหน้า login/register
       if (pathname === '/login' || pathname === '/register') {
          // ให้เด้งไปหน้า dashboard (เป็น default)
          return NextResponse.redirect(new URL('/dashboard', request.url))
       }
    }
  }

  // --- 4. ตรรกะสำหรับผู้ใช้ที่ "ยังไม่ล็อกอิน" ---
  if (!session) {
    // ถ้ายังไม่ login และพยายามเข้าหน้าที่ต้อง login
    // (เพิ่ม /guest เข้าไปด้วย)
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/student') || pathname.startsWith('/teacher') || pathname.startsWith('/guest')) {
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