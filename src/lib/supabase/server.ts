// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 1. เปลี่ยนฟังก์ชันนี้ให้เป็น "async"
export async function createSupabaseServerClient() {
  
  // 2. ใช้ "await" เพื่อรอให้ cookies() ทำงานเสร็จ
  const cookieStore = await cookies() 

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // 3. ตอนนี้ 'get' จะทำงานถูกต้อง
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // 4. 'set' ก็จะทำงานถูกต้อง (และจะ error ใน try-catch ตามปกติ)
            cookieStore.set(name, value, options)
          } catch (error) {
            // (Server Components เป็น Read-Only, นี่คือพฤติกรรมปกติ)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // 5. 'remove' ก็เช่นกัน
            cookieStore.set(name, '', options)
          } catch (error) {
            // (Server Components เป็น Read-Only, นี่คือพฤติกรรมปกติ)
          }
        },
      },
    }
  )
}