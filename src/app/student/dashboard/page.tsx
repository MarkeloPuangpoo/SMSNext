// src/app/student/dashboard/page.tsx
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
import LogoutButton from '@/components/shared/LogoutButton'

type StudentData = {
  id: string
  first_name: string
  last_name: string
  national_id: string
  student_number: string
  address: string
  birth_date: string
  grade_level: string
  behavior_score: number
  created_at: string
}

type Enrollment = {
  id: string
  grade: string | null
  course: {
    id: string
    course_name: string
    course_code: string | null
    description: string | null
    teacher: {
      first_name: string
      last_name: string
    } | null
  }
}

export default function StudentDashboardPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStudentData() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // ดึงข้อมูลนักเรียน
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (studentError || !studentData) {
        console.error('Error loading student data:', studentError)
        router.push('/login')
        return
      }

      setStudent(studentData as StudentData)

      // ดึงข้อมูล enrollments พร้อม courses และ teachers
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          id,
          grade,
          course:courses (
            id,
            course_name,
            course_code,
            description,
            teacher:teachers (
              first_name,
              last_name
            )
          )
        `)
        .eq('student_id', studentData.id)

      if (enrollmentError) {
        console.error('Error loading enrollments:', enrollmentError)
      } else {
        setEnrollments(enrollmentData as Enrollment[])
      }

      setLoading(false)
    }

    loadStudentData()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  if (!student) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard นักเรียน</h1>
          <LogoutButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* ข้อมูลส่วนตัว */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลส่วนตัว</CardTitle>
              <CardDescription>ข้อมูลโปรไฟล์ของคุณ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">ชื่อ-นามสกุล</p>
                <p className="font-medium">{student.first_name} {student.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">เลขบัตรประชาชน</p>
                <p className="font-medium">{student.national_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">เลขนักเรียน</p>
                <p className="font-medium">{student.student_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">ที่อยู่</p>
                <p className="font-medium">{student.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">วันเกิด</p>
                <p className="font-medium">
                  {new Date(student.birth_date).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">ชั้นเรียน</p>
                <p className="font-medium">{student.grade_level}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">คะแนนความประพฤติ</p>
                <p className="font-medium">{student.behavior_score || 100}</p>
              </div>
            </CardContent>
          </Card>

          {/* สรุปข้อมูล */}
          <Card>
            <CardHeader>
              <CardTitle>สรุปข้อมูล</CardTitle>
              <CardDescription>สถิติการเรียนของคุณ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">จำนวนวิชาที่ลงทะเบียน</p>
                <p className="text-3xl font-bold">{enrollments.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">ชั้นเรียน</p>
                <p className="text-2xl font-semibold">{student.grade_level}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ตารางเรียน */}
        <Card>
          <CardHeader>
            <CardTitle>ตารางเรียน</CardTitle>
            <CardDescription>วิชาที่ลงทะเบียนในห้อง {student.grade_level}</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                ยังไม่มีวิชาที่ลงทะเบียน
              </p>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รหัสวิชา</TableHead>
                      <TableHead>ชื่อวิชา</TableHead>
                      <TableHead>ครูผู้สอน</TableHead>
                      <TableHead>เกรด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          {enrollment.course.course_code || '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{enrollment.course.course_name}</p>
                            {enrollment.course.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {enrollment.course.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {enrollment.course.teacher ? (
                            `${enrollment.course.teacher.first_name} ${enrollment.course.teacher.last_name}`
                          ) : (
                            '-'
                          )}
                        </TableCell>
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
      </div>
    </div>
  )
}
