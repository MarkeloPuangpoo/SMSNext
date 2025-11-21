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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  GraduationCap,
  Users,
  Search,
  Plus,
  Edit,
  User,
  Award,
  School,
  Calendar,
  TrendingUp,
  Sparkles
} from 'lucide-react'
import { Input } from "@/components/ui/input"

type Student = {
  id: string
  first_name: string
  last_name: string
  grade_level: string
  student_number: string | null
  behavior_score: number | null
  created_at: string
}

export default async function StudentsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: students, error } = await supabase
    .from('students')
    .select('id, first_name, last_name, grade_level, student_number, behavior_score, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching students:', error)
  }

  // Calculate statistics
  const totalStudents = students?.length || 0
  const gradeLevels = students?.reduce((acc, student) => {
    const grade = student.grade_level || 'ไม่ระบุ'
    acc[grade] = (acc[grade] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  const uniqueGrades = Object.keys(gradeLevels).length
  const avgBehaviorScore = students?.length
    ? Math.round((students.reduce((sum, s) => sum + (s.behavior_score || 0), 0) / students.length) * 10) / 10
    : 0
  const mostCommonGrade = Object.entries(gradeLevels).sort(([, a], [, b]) => b - a)[0]?.[0] || '-'

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการนักเรียน</h1>
          <p className="text-muted-foreground mt-1">ระบบจัดการข้อมูลนักเรียนทั้งหมด {totalStudents} คน</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/students/new" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            เพิ่มนักเรียนใหม่
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="นักเรียนทั้งหมด"
          value={totalStudents}
          icon={<Users className="w-5 h-5" />}
        />
        <StatsCard
          title="จำนวนชั้นเรียน"
          value={uniqueGrades}
          icon={<School className="w-5 h-5" />}
        />
        <StatsCard
          title="คะแนนความประพฤติเฉลี่ย"
          value={avgBehaviorScore}
          icon={<Award className="w-5 h-5" />}
        />
        <StatsCard
          title="ชั้นเรียนที่มากที่สุด"
          value={mostCommonGrade}
          icon={<GraduationCap className="w-5 h-5" />}
          isText
        />
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="w-5 h-5" />
              รายชื่อนักเรียน
            </CardTitle>
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ค้นหาชื่อหรือเลขนักเรียน..."
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
                  <TableHead>นักเรียน</TableHead>
                  <TableHead>ชั้นเรียน</TableHead>
                  <TableHead className="hidden md:table-cell">คะแนนความประพฤติ</TableHead>
                  <TableHead className="hidden lg:table-cell">วันที่ลงทะเบียน</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!students || students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      ไม่พบข้อมูลนักเรียน
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student: Student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.student_number || 'ไม่มีเลข'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          {student.grade_level || 'ไม่ระบุ'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Link href={`/dashboard/behavior/${student.id}`}>
                          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium hover:bg-muted transition-colors cursor-pointer">
                            <span className={`${(student.behavior_score || 0) === 0 ? 'text-muted-foreground' :
                              (student.behavior_score || 0) < 10 ? 'text-emerald-600' :
                                (student.behavior_score || 0) < 20 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                              {student.behavior_score || 0}
                            </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(student.created_at).toLocaleDateString('th-TH', {
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
                          <Link href={`/dashboard/students/${student.id}/edit`} className="flex items-center gap-2">
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
