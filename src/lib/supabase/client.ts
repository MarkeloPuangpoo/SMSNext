// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// ฟังก์ชันนี้จะสร้าง Supabase Client สำหรับ "Client Components"
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}