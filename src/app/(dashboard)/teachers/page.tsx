// src/app/(dashboard)/teachers/page.tsx

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link" // 👈 (สำคัญ) ต้อง import Link มาใช้

// กำหนด Type ของ teacher (ควรจะตรงกับตารางใน DB)
type Teacher = {
  id: string
  first_name: string
  last_name: string
  department: string | null // Department อาจจะเป็นค่าว่าง (NULL) ได้
  created_at: string
}

// นี่คือ Server Component, เราดึงข้อมูลได้โดยตรง
export default async function TeachersPage() {
  
  // 1. สร้าง Server Client
  const supabase = await createSupabaseServerClient()

  // 2. ดึงข้อมูลครู
  // (ถ้าคุณเปิด RLS, ต้องมี Policy "SELECT" สำหรับตาราง teachers ก่อน)
  const { data: teachers, error } = await supabase
    .from('teachers') // 👈 ชื่อตาราง
    .select('id, first_name, last_name, department, created_at') // 👈 เลือกคอลัมน์
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching teachers:', error)
  }

  // 3. (ทางเลือก) จัดการกรณีไม่มีข้อมูล
  if (!teachers || teachers.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Teacher Management</h1>
        <div className="mt-4">
          <Button asChild>
            <Link href="/dashboard/teachers/new">เพิ่มครูใหม่</Link>
          </Button>
        </div>
        <p className="mt-6 text-gray-500">ยังไม่มีข้อมูลครูในระบบ</p>
      </div>
    )
  }

  return (
    <div>
      {/* ส่วนหัวและปุ่ม "เพิ่ม" */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teacher Management</h1>
        <Button asChild>
          {/* เราจะสร้างหน้านี้ในขั้นตอนต่อไป */}
          <Link href="/dashboard/teachers/new">เพิ่มครูใหม่</Link>
        </Button>
      </div>

      {/* ตารางแสดงผล */}
      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>นามสกุล</TableHead>
              <TableHead>แผนก/สาขา</TableHead>
              <TableHead>วันที่ลงทะเบียน</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((teacher: Teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>{teacher.first_name}</TableCell>
                <TableCell>{teacher.last_name}</TableCell>
                <TableCell>{teacher.department || '-'}</TableCell>
                <TableCell>
                  {new Date(teacher.created_at).toLocaleDateString('th-TH')}
                </TableCell>
                
                {/* --- นี่คือส่วนที่อัปเดต --- */}
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/teachers/${teacher.id}/edit`}>
                      แก้ไข
                    </Link>
                  </Button>
                </TableCell>
                {/* --------------------------- */}

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}