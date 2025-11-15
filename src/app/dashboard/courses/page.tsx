// src/app/dashboard/courses/page.tsx
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
import Link from "next/link"
import DeleteCourseButton from "./DeleteCourseButton"

// กำหนด Type ของ course
type Course = {
  id: string
  course_name: string
  course_code: string | null
  description: string | null
  teacher: {
    id: string
    first_name: string
    last_name: string
  } | null
}

// นี่คือ Server Component, เราดึงข้อมูลได้โดยตรง
export default async function CoursesPage() {
  const supabase = await createSupabaseServerClient()

  // ดึงข้อมูล courses พร้อม teacher
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      course_name,
      course_code,
      description,
      teacher:teachers (
        id,
        first_name,
        last_name
      )
    `)
    .order('course_name')

  if (error) {
    console.error('Error fetching courses:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">จัดการวิชา</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            จัดการรายการวิชาทั้งหมดในระบบ
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/courses/new">เพิ่มวิชาใหม่</Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อวิชา</TableHead>
              <TableHead>รหัสวิชา</TableHead>
              <TableHead>ครูผู้สอน</TableHead>
              <TableHead>คำอธิบาย</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!courses || courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  ยังไม่มีข้อมูลวิชา
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course: Course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.course_name}</TableCell>
                  <TableCell>{course.course_code || '-'}</TableCell>
                  <TableCell>
                    {course.teacher 
                      ? `${course.teacher.first_name} ${course.teacher.last_name}`
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {course.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/courses/${course.id}/edit`}>
                          แก้ไข
                        </Link>
                      </Button>
                      <DeleteCourseButton courseId={course.id} courseName={course.course_name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
