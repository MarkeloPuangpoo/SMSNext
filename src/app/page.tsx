// src/app/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function HomePage() {
  
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold text-blue-600">
          SchoolDB
        </h1>
        <p className="mt-4 text-xl text-gray-700 dark:text-gray-300">
          ยินดีต้อนรับสู่ Dashboard ฐานข้อมูลโรงเรียน
        </p>

        <div className="mt-10 flex gap-4 justify-center">
          {user ? (
            // --- กรณีล็อกอินอยู่ ---
            <Button asChild size="lg">
              <Link href="/dashboard">ไปที่ Dashboard</Link>
            </Button>
          ) : (
            // --- กรณีที่ยังไม่ล็อกอิน ---
            <>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/register">สมัครสมาชิก</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}