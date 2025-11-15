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
              enrollments: enrollmentsData || []
            }
          })
        )
        setCourses(coursesWithStudents as Course[])
      } else {
        setCourses([])
      }

      setLoading(false)
    }

    loadTeacherData()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  if (!teacher) {
    return null
  }

  // นับจำนวนนักเรียนทั้งหมดในห้องเรียน
  const totalStudents = students.length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard ครู</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            ยินดีต้อนรับ {teacher.first_name} {teacher.last_name}
            {teacher.department && ` - ${teacher.department}`}
            {teacher.grade_level && ` - ห้อง ${teacher.grade_level}`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* สรุปข้อมูล */}
          <Card>
            <CardHeader>
              <CardTitle>จำนวนวิชา</CardTitle>
              <CardDescription>วิชาที่สอนทั้งหมด</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{courses.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>จำนวนนักเรียน</CardTitle>
              <CardDescription>นักเรียนทั้งหมดในห้อง {teacher.grade_level}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalStudents}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>แผนก</CardTitle>
              <CardDescription>แผนกที่สังกัด</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{teacher.department || '-'}</p>
            </CardContent>
          </Card>
        </div>

        {/* รายชื่อนักเรียนในห้องเรียน */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>รายชื่อนักเรียนในห้อง {teacher.grade_level}</CardTitle>
            <CardDescription>
              นักเรียนทั้งหมดในห้องเรียนที่คุณสอน
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                ยังไม่มีนักเรียนในห้องเรียนนี้
              </p>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลขนักเรียน</TableHead>
                      <TableHead>ชื่อ-นามสกุล</TableHead>
                      <TableHead>เลขบัตรประชาชน</TableHead>
                      <TableHead>ที่อยู่</TableHead>
                      <TableHead>คะแนนความประพฤติ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.student_number}</TableCell>
                        <TableCell>
                          {student.first_name} {student.last_name}
                        </TableCell>
                        <TableCell>{student.national_id}</TableCell>
                        <TableCell className="max-w-xs truncate">{student.address}</TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {student.behavior_score || 100}
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
            <CardHeader>
              <CardTitle>วิชาที่สอน</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                ยังไม่มีวิชาที่สอน
              </p>
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="mb-6">
              <CardHeader>
                <CardTitle>{course.course_name}</CardTitle>
                <CardDescription>
                  {course.course_code && `รหัสวิชา: ${course.course_code}`}
                  {course.description && ` - ${course.description}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {course.enrollments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    ยังไม่มีนักเรียนลงทะเบียนในวิชานี้
                  </p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>เลขนักเรียน</TableHead>
                          <TableHead>ชื่อ-นามสกุล</TableHead>
                          <TableHead>ชั้นเรียน</TableHead>
                          <TableHead>เกรด</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {course.enrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell>{enrollment.student.student_number}</TableCell>
                            <TableCell>
                              {enrollment.student.first_name} {enrollment.student.last_name}
                            </TableCell>
                            <TableCell>{enrollment.student.grade_level}</TableCell>
                            <TableCell>
                              <span className="font-medium">
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
    </div>
  )
}

