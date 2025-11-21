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
import { BookOpen, Users, Building2, GraduationCap } from 'lucide-react'

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
                enrollments: enrollmentsData || []
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (!teacher) {
    return null
  }

  const totalStudents = students.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Dashboard ครู
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            ยินดีต้อนรับ {teacher.first_name} {teacher.last_name}
            {teacher.department && ` - ${teacher.department}`}
            {teacher.grade_level && ` - ห้อง ${teacher.grade_level}`}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="border-0 shadow-xl bg-white overflow-hidden hover:shadow-2xl transition-all">
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 font-semibold mb-2">จำนวนวิชา</p>
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{courses.length}</p>
                  <p className="text-xs text-gray-500 mt-1">วิชา</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white overflow-hidden hover:shadow-2xl transition-all">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 font-semibold mb-2">จำนวนนักเรียน</p>
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{totalStudents}</p>
                  <p className="text-xs text-gray-500 mt-1">คน</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white overflow-hidden hover:shadow-2xl transition-all sm:col-span-2 lg:col-span-1">
            <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 font-semibold mb-2">แผนก</p>
                  <p className="text-lg md:text-xl font-semibold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent break-words">{teacher.department || '-'}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* รายชื่อนักเรียนในห้องเรียน */}
        <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden mb-6 md:mb-8">
          <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-8 border-b-4 border-purple-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold mb-2">
                  รายชื่อนักเรียนในห้อง {teacher.grade_level}
                </CardTitle>
                <CardDescription className="text-purple-50 text-base">นักเรียนทั้งหมดในห้องเรียนที่คุณสอน</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">ยังไม่มีนักเรียนในห้องเรียนนี้</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 md:mx-0">
                <div className="inline-block min-w-full align-middle px-6 md:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="text-xs md:text-sm">เลขนักเรียน</TableHead>
                        <TableHead className="text-xs md:text-sm">ชื่อ-นามสกุล</TableHead>
                        <TableHead className="text-xs md:text-sm hidden md:table-cell">เลขบัตรประชาชน</TableHead>
                        <TableHead className="text-xs md:text-sm hidden lg:table-cell">ที่อยู่</TableHead>
                        <TableHead className="text-xs md:text-sm">คะแนน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id} className="hover:bg-indigo-50/50 transition-colors">
                          <TableCell className="font-semibold text-xs md:text-sm bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{student.student_number}</TableCell>
                          <TableCell className="text-xs md:text-sm font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm hidden md:table-cell break-all text-gray-600">{student.national_id}</TableCell>
                          <TableCell className="text-xs md:text-sm hidden lg:table-cell max-w-xs truncate text-gray-600">{student.address}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs md:text-sm font-bold ${
                              (student.behavior_score || 0) === 0 ? 'bg-gray-100 text-gray-700' :
                              (student.behavior_score || 0) < 10 ? 'bg-emerald-100 text-emerald-700' :
                              (student.behavior_score || 0) < 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {student.behavior_score || 0}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* รายการวิชาที่สอน */}
        {courses.length === 0 ? (
          <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white p-8 border-b-4 border-teal-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold">วิชาที่สอน</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-emerald-600" />
                </div>
                <p className="text-gray-500 text-lg font-medium">ยังไม่มีวิชาที่สอน</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden mb-6 md:mb-8">
              <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white p-8 border-b-4 border-teal-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl md:text-3xl font-bold mb-2">{course.course_name}</CardTitle>
                    <CardDescription className="text-teal-50 text-base">
                      {course.course_code && `รหัสวิชา: ${course.course_code}`}
                      {course.description && ` - ${course.description}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {course.enrollments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">ยังไม่มีนักเรียนลงทะเบียนในวิชานี้</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-6 md:mx-0">
                    <div className="inline-block min-w-full align-middle px-6 md:px-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="text-xs md:text-sm">เลขนักเรียน</TableHead>
                            <TableHead className="text-xs md:text-sm">ชื่อ-นามสกุล</TableHead>
                            <TableHead className="text-xs md:text-sm">ชั้นเรียน</TableHead>
                            <TableHead className="text-xs md:text-sm text-center">เกรด</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {course.enrollments.map((enrollment) => (
                            <TableRow key={enrollment.id} className="hover:bg-emerald-50/50 transition-colors">
                              <TableCell className="text-xs md:text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{enrollment.student.student_number}</TableCell>
                              <TableCell className="text-xs md:text-sm font-medium text-gray-900">
                                {enrollment.student.first_name} {enrollment.student.last_name}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm text-gray-600">{enrollment.student.grade_level}</TableCell>
                              <TableCell className="text-center">
                                <span className="inline-block px-3 py-1.5 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700 font-bold text-xs md:text-sm shadow-sm">
                                  {enrollment.grade || '-'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
