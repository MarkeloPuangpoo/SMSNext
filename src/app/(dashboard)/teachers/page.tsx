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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  BookOpen,
  Users,
  Search,
  Plus,
  Edit,
  User,
  Building2,
  GraduationCap,
  Calendar
} from 'lucide-react'
import { Input } from "@/components/ui/input"

type Teacher = {
  id: string
  first_name: string
  last_name: string
  department: string | null
  grade_level: string | null
  created_at: string
}

export default async function TeachersPage() {
  const supabase = await createSupabaseServerClient()

  const { data: teachers, error } = await supabase
    .from('teachers')
    .select('id, first_name, last_name, department, grade_level, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching teachers:', error)
  }

  // Calculate statistics
  const totalTeachers = teachers?.length || 0
  const departments = teachers?.reduce((acc, teacher) => {
    const dept = teacher.department || 'ไม่ระบุ'
    acc[dept] = (acc[dept] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  const uniqueDepartments = Object.keys(departments).length
  const uniqueGrades = new Set(teachers?.map(t => t.grade_level).filter(Boolean) || []).size
  const mostCommonDept = Object.entries(departments).sort(([, a], [, b]) => b - a)[0]?.[0] || '-'

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการครู</h1>
          <p className="text-muted-foreground mt-1">ระบบจัดการข้อมูลครูผู้สอนทั้งหมด {totalTeachers} คน</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teachers/new" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            เพิ่มครูใหม่
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="ครูทั้งหมด"
          value={totalTeachers}
          icon={<Users className="w-5 h-5" />}
        />
        <StatsCard
          title="จำนวนแผนก"
          value={uniqueDepartments}
          icon={<Building2 className="w-5 h-5" />}
        />
        <StatsCard
          title="จำนวนชั้นเรียน"
          value={uniqueGrades}
          icon={<GraduationCap className="w-5 h-5" />}
        />
        <StatsCard
          title="แผนกที่มากที่สุด"
          value={mostCommonDept}
          icon={<BookOpen className="w-5 h-5" />}
          isText
        />
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="w-5 h-5" />
              รายชื่อครู
            </CardTitle>
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ค้นหาครู..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>แผนก/สาขา</TableHead>
                  <TableHead>ชั้นเรียน</TableHead>
                  <TableHead className="hidden lg:table-cell">วันที่ลงทะเบียน</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!teachers || teachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      ไม่พบข้อมูลครู
                    </TableCell>
                  </TableRow>
                ) : (
                  teachers.map((teacher: Teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                            {teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{teacher.first_name} {teacher.last_name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {teacher.department ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {teacher.department}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {teacher.grade_level ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            {teacher.grade_level}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(teacher.created_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/dashboard/teachers/${teacher.id}/edit`} className="flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">แก้ไข</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({ title, value, icon, isText = false }: { title: string, value: number | string, icon: React.ReactNode, isText?: boolean }) {
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
          <div className={`font-bold ${isText ? 'text-xl truncate' : 'text-2xl'}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}
