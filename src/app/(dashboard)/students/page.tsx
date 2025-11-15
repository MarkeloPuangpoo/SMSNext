// src/app/(dashboard)/students/page.tsx

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

// เราจะกำหนด Type ของ student (ควรจะตรงกับตารางใน DB)
type Student = {
  id: string
  first_name: string
  last_name: string
  grade_level: number
  created_at: string
}

// นี่คือ Server Component, เราดึงข้อมูลได้โดยตรง
export default async function StudentsPage() {
  
  // 1. สร้าง Server Client
  const supabase = await createSupabaseServerClient()

  // 2. ดึงข้อมูลนักเรียน
  // (ถ้าคุณเปิด RLS, ต้องมี Policy "SELECT" สำหรับตาราง students ก่อน)
  const { data: students, error } = await supabase
    .from('students') // 👈 ชื่อตาราง
    .select('id, first_name, last_name, grade_level, created_at') // 👈 เลือกคอลัมน์
    .order('created_at', { ascending: false }) // 👈 เรียงตามวันที่สร้าง

  // (จัดการ Error เบื้องต้น)
  if (error) {
    console.error('Error fetching students:', error)
    // คุณอาจจะแสดงผลหน้า Error ที่นี่
  }

  // 3. (ทางเลือก) จัดการกรณีไม่มีข้อมูล
  if (!students || students.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Student Management</h1>
        <div className="mt-4">
          <Button asChild>
            <Link href="/dashboard/students/new">เพิ่มนักเรียนใหม่</Link>
          </Button>
        </div>
        <p className="mt-6 text-gray-500">ยังไม่มีข้อมูลนักเรียนในระบบ</p>
      </div>
    )
  }

  return (
    <div>
      {/* ส่วนหัวและปุ่ม "เพิ่ม" */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Student Management</h1>
        <Button asChild>
          {/* เราจะสร้างหน้านี้ในขั้นตอนต่อไป */}
          <Link href="/dashboard/students/new">เพิ่มนักเรียนใหม่</Link>
        </Button>
      </div>

      {/* ตารางแสดงผล */}
      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>นามสกุล</TableHead>
              <TableHead>ระดับชั้น</TableHead>
              <TableHead>วันที่ลงทะเบียน</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student: Student) => (
              <TableRow key={student.id}>
                <TableCell>{student.first_name}</TableCell>
                <TableCell>{student.last_name}</TableCell>
                <TableCell>{student.grade_level}</TableCell>
                <TableCell>
                  {new Date(student.created_at).toLocaleDateString('th-TH')}
                </TableCell>
                
                {/* --- นี่คือส่วนที่อัปเดต --- */}
                <TableCell className="text-right">
                  {/* เราใช้ `asChild` เพื่อให้ Button ทำหน้าที่เป็น Link */}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/students/${student.id}/edit`}>
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