// src/app/dashboard/courses/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  BookOpen,
  Plus,
  Library,
  Hash,
  FileText,
  Users
} from 'lucide-react'
import CoursesTableClient from './CoursesTableClient'

export default async function CoursesPage() {
  const supabase = await createSupabaseServerClient()

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

  // Calculate statistics
  const totalCourses = courses?.length || 0
  const coursesWithCode = courses?.filter(c => c.course_code).length || 0
  const coursesWithDescription = courses?.filter(c => c.description).length || 0
  const uniqueTeachers = new Set(courses?.map(c => c.teacher?.id).filter(Boolean) || []).size

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการวิชา</h1>
          <p className="text-muted-foreground mt-1">ระบบจัดการรายการวิชาทั้งหมด {totalCourses} วิชา</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/courses/new" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            เพิ่มวิชาใหม่
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="วิชาทั้งหมด"
          value={totalCourses}
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatsCard
          title="มีรหัสวิชา"
          value={coursesWithCode}
          icon={<Hash className="w-5 h-5" />}
        />
        <StatsCard
          title="มีคำอธิบาย"
          value={coursesWithDescription}
          icon={<FileText className="w-5 h-5" />}
        />
        <StatsCard
          title="ครูผู้สอน"
          value={uniqueTeachers}
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      <Card>
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Library className="w-5 h-5" />
            รายชื่อวิชา
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CoursesTableClient courses={courses || []} />
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-muted-foreground bg-secondary p-2 rounded-md">
            {icon}
          </div>
        </div>
        <div className="pt-2">
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}
