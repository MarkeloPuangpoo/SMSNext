// src/app/dashboard/page.tsx

// Import Shadcn components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Import Server Client เพื่อดึงข้อมูล
import { createSupabaseServerClient } from "@/lib/supabase/server"

// นี่คือ Server Component, เราสามารถใช้ async/await ได้เลย
export default async function DashboardPage() {

  // สร้าง Server Client
  const supabase = await createSupabaseServerClient()
  
  // --- ตัวอย่างการดึงข้อมูลบน Server ---
  // (ถ้าคุณยังไม่เปิด RLS, ถ้าเปิดแล้วต้องสร้าง Policy ก่อน)
  
  // 1. นับจำนวนนักเรียน
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true }) // head: true คือไม่เอาข้อมูล, เอาแค่ count

  // 2. นับจำนวนครู
  const { count: teacherCount } = await supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true })

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      <p className="text-gray-600 dark:text-gray-400">ยินดีต้อนรับสู่ฐานข้อมูลโรงเรียน</p>
      
      {/* ตารางสถิติ */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* การ์ดนักเรียน */}
        <Card>
          <CardHeader>
            <CardTitle>นักเรียนทั้งหมด</CardTitle>
            <CardDescription>จำนวนนักเรียนทั้งหมดในระบบ</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{studentCount ?? 0}</p>
          </CardContent>
        </Card>

        {/* การ์ดครู */}
        <Card>
          <CardHeader>
            <CardTitle>ครูทั้งหมด</CardTitle>
            <CardDescription>จำนวนครูทั้งหมดในระบบ</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{teacherCount ?? 0}</p>
          </CardContent>
        </Card>

        {/* (เพิ่มการ์ดอื่นๆ ได้ที่นี่) */}

      </div>
    </div>
  )
}

