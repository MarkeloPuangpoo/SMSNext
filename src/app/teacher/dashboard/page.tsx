// src/app/teacher/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BookOpen, Users, Building2, GraduationCap, Loader2 } from 'lucide-react'

type TeacherData = {
  id: string
  first_name: string
  last_name: string
  department: string | null
  grade_level: string
}

type Student = {
  id: string
  first_name: string
  last_name: string
  student_number: string
  grade_level: string
  national_id: string
  address: string
  birth_date: string
  behavior_score: number
}

type Course = {
  id: string
  course_name: string
  course_code: string | null
  description: string | null
  enrollments: {
    id: string
    student: {
      id: string
      first_name: string
      last_name: string
      student_number: string
      grade_level: string
    }
    grade: string | null
  }[]
}

export default function TeacherDashboardPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [teacher, setTeacher] = useState<TeacherData | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTeacherData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        // ดึงข้อมูลครู
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (teacherError || !teacherData) {
          console.error('Error loading teacher data:', teacherError)
          router.push('/login')
          return
        }

        setTeacher(teacherData as TeacherData)

        // ดึงข้อมูลนักเรียนในห้องเรียนที่ครูสอน
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            first_name,
            last_name,
            student_number,
            grade_level,
            national_id,
            address,
            birth_date,
            behavior_score
          `)
          .eq('grade_level', teacherData.grade_level)
          .order('student_number', { ascending: true })

        if (studentsError) {
          console.error('Error loading students:', studentsError)
        } else {
          setStudents(studentsData as Student[])
        }

        // ดึงข้อมูล courses ที่ครูสอน
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            id,
            course_name,
            course_code,
            description
          `)
          .eq('teacher_id', teacherData.id)

        if (coursesError) {
          console.error('Error loading courses:', coursesError)
        } else if (coursesData && coursesData.length > 0) {
          // สำหรับแต่ละ course ดึง enrollments ของนักเรียนในห้องเรียนนี้
          const coursesWithStudents = await Promise.all(
            coursesData.map(async (course) => {
              const { data: enrollmentsData } = await supabase
                .from('enrollments')
                .select(`
                  id,
                  grade,
                  student:students!enrollments_student_id_fkey (
                    id,
                    first_name,
                    last_name,
                    student_number,
                    grade_level
                  )
                `)
                .eq('course_id', course.id)
                .in('student_id', (studentsData || []).map(s => s.id))

              return {
                ...course,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                enrollments: (enrollmentsData || []).map((e: any) => ({
                  ...e,
                  student: Array.isArray(e.student) ? e.student[0] : e.student
                }))
              }
            })
          )
          setCourses(coursesWithStudents as Course[])
        } else {
          setCourses([])
        }
      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTeacherData()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!teacher) {
    return null
  }

  const totalStudents = students.length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard ครู</h1>
        <p className="text-muted-foreground mt-1">
          ยินดีต้อนรับ {teacher.first_name} {teacher.last_name}
          {teacher.department && ` - ${teacher.department}`}
          {teacher.grade_level && ` - ห้อง ${teacher.grade_level}`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="จำนวนวิชา"
          value={courses.length}
          subtext="วิชา"
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatsCard
          title="จำนวนนักเรียน"
          value={totalStudents}
          subtext="คน"
          icon={<Users className="w-5 h-5" />}
        />
        <StatsCard
          title="แผนก"
          value={teacher.department || '-'}
          subtext="สังกัด"
          icon={<Building2 className="w-5 h-5" />}
          isTextValue
        />
      </div>

      {/* รายชื่อนักเรียนในห้องเรียน */}
      <Card>
        <CardHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            <div>
              <CardTitle className="text-xl">รายชื่อนักเรียนในห้อง {teacher.grade_level}</CardTitle>
              <CardDescription>นักเรียนทั้งหมดในห้องเรียนที่คุณสอน</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              ยังไม่มีนักเรียนในห้องเรียนนี้
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>เลขนักเรียน</TableHead>
                    <TableHead>ชื่อ-นามสกุล</TableHead>
                    <TableHead className="hidden md:table-cell">เลขบัตรประชาชน</TableHead>
                    <TableHead className="hidden lg:table-cell">ที่อยู่</TableHead>
                    <TableHead>คะแนน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.student_number}</TableCell>
                      <TableCell>
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{student.national_id}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs truncate text-muted-foreground">{student.address}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${(student.behavior_score || 0) === 0 ? 'bg-secondary text-secondary-foreground' :
                          (student.behavior_score || 0) < 10 ? 'bg-emerald-50 text-emerald-700' :
                            (student.behavior_score || 0) < 20 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                          }`}>
                          {student.behavior_score || 0}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* รายการวิชาที่สอน */}
      {courses.length === 0 ? (
        <Card>
          <CardHeader className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <CardTitle className="text-xl">วิชาที่สอน</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center text-muted-foreground">
            ยังไม่มีวิชาที่สอน
          </CardContent>
        </Card>
      ) : (
        courses.map((course) => (
          <Card key={course.id}>
            <CardHeader className="border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <div>
                  <CardTitle className="text-xl">{course.course_name}</CardTitle>
                  <CardDescription>
                    {course.course_code && `รหัสวิชา: ${course.course_code}`}
                    {course.description && ` - ${course.description}`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {course.enrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ยังไม่มีนักเรียนลงทะเบียนในวิชานี้
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>เลขนักเรียน</TableHead>
                        <TableHead>ชื่อ-นามสกุล</TableHead>
                        <TableHead>ชั้นเรียน</TableHead>
                        <TableHead className="text-center">เกรด</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {course.enrollments.map((enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">{enrollment.student.student_number}</TableCell>
                          <TableCell>
                            {enrollment.student.first_name} {enrollment.student.last_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{enrollment.student.grade_level}</TableCell>
                          <TableCell className="text-center">
                            <span className="inline-block px-2 py-1 rounded-md bg-secondary text-sm font-medium">
                              {enrollment.grade || '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function StatsCard({ title, value, subtext, icon, isTextValue = false }: { title: string, value: string | number, subtext: string, icon: React.ReactNode, isTextValue?: boolean }) {
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
          <div className={`font-bold ${isTextValue ? 'text-xl' : 'text-2xl'}`}>{value}</div>
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  )
}
