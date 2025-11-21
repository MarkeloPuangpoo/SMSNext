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
import { 
  User, 
  CreditCard, 
  MapPin, 
  Cake, 
  GraduationCap, 
  Award,
  BookOpen,
  Calendar,
  Clock,
  School,
  Mail,
  Phone
} from 'lucide-react'
import LogoutButton from '@/components/shared/LogoutButton'
import ChatWidget from '@/components/shared/ChatWidget'

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

type Schedule = {
  id: string
  day: string
  hour: number
  subject: string | null
  is_lunch: boolean
}

const TIME_SLOTS = [
  { hour: 0, time: '08:20-08:40', short: '08:20' },
  { hour: 1, time: '08:40-09:30', short: '08:40' },
  { hour: 2, time: '09:30-10:20', short: '09:30' },
  { hour: 3, time: '10:20-11:10', short: '10:20' },
  { hour: 4, time: '11:10-12:00', short: '11:10' },
  { hour: 5, time: '12:00-12:50', short: '12:00' },
  { hour: 6, time: '12:50-13:40', short: '12:50' },
  { hour: 7, time: '13:40-14:30', short: '13:40' },
  { hour: 8, time: '14:30-15:20', short: '14:30' },
]

const DAYS = [
  { th: 'จันทร์', en: 'monday', short: 'จ' },
  { th: 'อังคาร', en: 'tuesday', short: 'อ' },
  { th: 'พุธ', en: 'wednesday', short: 'พ' },
  { th: 'พฤหัสบดี', en: 'thursday', short: 'พฤ' },
  { th: 'ศุกร์', en: 'friday', short: 'ศ' }
]

const REQUIRED_SLOTS: Record<string, Record<number, string>> = {
  monday: { 0: 'โฮมรูม', 1: 'แนะแนว' },
  tuesday: { 0: 'โฮมรูม' },
  wednesday: { 0: 'โฮมรูม' },
  thursday: { 0: 'โฮมรูม' },
  friday: { 0: 'โฮมรูม' },
}

export default function StudentDashboardPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStudentData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

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
        } else if (enrollmentData) {
          const formattedEnrollments: Enrollment[] = enrollmentData.map((item: any) => ({
            id: item.id,
            grade: item.grade,
            course: {
              id: item.course?.id || '',
              course_name: item.course?.course_name || '',
              course_code: item.course?.course_code || null,
              description: item.course?.description || null,
              teacher: item.course?.teacher ? {
                first_name: item.course.teacher.first_name,
                last_name: item.course.teacher.last_name,
              } : null,
            },
          }))
          setEnrollments(formattedEnrollments)
        }

        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedules')
          .select('*')
          .eq('grade_level', studentData.grade_level)

        if (scheduleError) {
          console.error('Error loading schedules:', scheduleError)
        } else if (scheduleData) {
          setSchedules(scheduleData)
        }
      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStudentData()
  }, [router, supabase])

  const isLunchBreak = (hour: number, gradeLevel: string) => {
    if (!gradeLevel) return false
    const grade = parseInt(gradeLevel.split('/')[0])
    if (grade >= 1 && grade <= 3) {
      return hour === 4
    } else if (grade >= 4 && grade <= 6) {
      return hour === 5
    }
    return false
  }

  const getScheduleForSlot = (dayEn: string, hour: number) => {
    if (!student) return null

    if (REQUIRED_SLOTS[dayEn] && REQUIRED_SLOTS[dayEn][hour] !== undefined) {
      return {
        subject: REQUIRED_SLOTS[dayEn][hour],
        is_lunch: false,
        is_required: true
      }
    }
    
    if (isLunchBreak(hour, student.grade_level)) {
      return {
        subject: null,
        is_lunch: true,
        is_required: false
      }
    }
    
    const schedule = schedules.find(s => s.day === dayEn && s.hour === hour)
    if (schedule) {
      return {
        subject: schedule.subject,
        is_lunch: schedule.is_lunch,
        is_required: false
      }
    }
    
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return null
  }

  const birthDate = new Date(student.birth_date)
  const age = new Date().getFullYear() - birthDate.getFullYear()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTRjMy4zMTMgMCA2IDIuNjg3IDYgNnMtMi42ODcgNi02IDYtNi0yLjY4Ny02LTYgMi42ODctNiA2LTZ6TTI0IDQ0YzMuMzEzIDAgNiAyLjY4NyA2IDZzLTIuNjg3IDYtNiA2LTYtMi42ODctNi02IDIuNjg3LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                  <GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                    {student.first_name} {student.last_name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-blue-50">
                    <span className="flex items-center gap-1.5">
                      <School className="w-4 h-4" />
                      ห้อง {student.grade_level}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      เลขประจำตัว {student.student_number}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-7xl">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 -mt-8 md:-mt-12 relative z-10">
          <Card className="border-0 shadow-xl bg-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 font-semibold mb-2">จำนวนวิชา</p>
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{enrollments.length}</p>
                  <p className="text-xs text-gray-500 mt-1">วิชา</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 font-semibold mb-2">คะแนนความประพฤติ</p>
                  <p className={`text-3xl md:text-4xl font-bold ${
                    (student.behavior_score || 0) === 0 ? 'text-gray-600' :
                    (student.behavior_score || 0) < 10 ? 'text-emerald-600' :
                    (student.behavior_score || 0) < 20 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {student.behavior_score || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">คะแนน</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                  <Award className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 font-semibold mb-2">อายุ</p>
                  <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">{age}</p>
                  <p className="text-xs text-gray-500 mt-1">ปี</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                  <Cake className="w-7 h-7 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 md:mb-8">
          {/* Profile Card */}
          <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white p-8 border-b-4 border-blue-200">
              <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-bold">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <User className="w-7 h-7" />
                </div>
                ข้อมูลส่วนตัว
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">ชื่อ-นามสกุล</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">
                    {student.first_name} {student.last_name}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">เลขบัตรประชาชน</p>
                  <p className="text-base md:text-lg font-mono text-gray-900 break-all">
                    {student.national_id}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">เลขนักเรียน</p>
                  <p className="text-base md:text-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    {student.student_number}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">วันเกิด</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">
                    {birthDate.toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">ที่อยู่</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900 break-words">
                    {student.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-3xl overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-2xl md:text-3xl font-bold">สรุปข้อมูล</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-8 pt-0">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/30 transition-all">
                <p className="text-sm text-purple-50 mb-2 font-semibold">จำนวนวิชา</p>
                <p className="text-4xl md:text-5xl font-bold">{enrollments.length}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/30 transition-all">
                <p className="text-sm text-purple-50 mb-2 font-semibold">คะแนนความประพฤติ</p>
                <p className={`text-4xl md:text-5xl font-bold ${
                  (student.behavior_score || 0) === 0 ? 'text-white' :
                  (student.behavior_score || 0) < 10 ? 'text-emerald-100' :
                  (student.behavior_score || 0) < 20 ? 'text-yellow-100' : 'text-red-200'
                }`}>
                  {student.behavior_score || 0}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/30 transition-all">
                <p className="text-sm text-purple-50 mb-2 font-semibold">ห้องเรียน</p>
                <p className="text-3xl md:text-4xl font-bold">{student.grade_level}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Section */}
        <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden mb-6 md:mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white p-8 border-b-4 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-bold mb-2">
                    ตารางเรียนประจำสัปดาห์
                  </CardTitle>
                  <CardDescription className="text-blue-50 text-base">
                    ห้อง {student.grade_level} | เทอมปัจจุบัน
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-2">
                      <TableHead className="font-bold w-20 md:w-28 text-xs md:text-sm sticky left-0 bg-gray-50 z-10">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>เวลา</span>
                        </div>
                      </TableHead>
                      {DAYS.map((day) => (
                        <TableHead key={day.en} className="font-bold text-center text-xs md:text-sm min-w-[120px]">
                          <div className="flex flex-col items-center">
                            <span className="hidden md:inline">{day.th}</span>
                            <span className="md:hidden">{day.short}</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TIME_SLOTS.map(({ hour, time, short }) => (
                      <TableRow key={hour} className="hover:bg-blue-50/50 transition-colors">
                        <TableCell className="font-semibold bg-gray-50 text-xs md:text-sm sticky left-0 z-10 border-r-2">
                          <div className="flex flex-col">
                            <span className="hidden md:inline">{time}</span>
                            <span className="md:hidden">{short}</span>
                          </div>
                        </TableCell>
                        {DAYS.map((day) => {
                          const schedule = getScheduleForSlot(day.en, hour)
                          return (
                            <TableCell key={`${day.en}-${hour}`} className="text-center p-2 md:p-3">
                              {schedule?.is_lunch ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-xs md:text-sm font-medium">
                                  <span>🍽️</span>
                                  <span className="hidden md:inline">พักเที่ยง</span>
                                </div>
                              ) : schedule?.subject ? (
                                <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium ${
                                  (schedule as any).is_required 
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}>
                                  <span className="line-clamp-1">{schedule.subject}</span>
                                </div>
                              ) : (
                                <span className="text-gray-300 text-xs">-</span>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Section */}
        <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white p-8 border-b-4 border-teal-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold mb-2">
                  รายวิชาที่ลงทะเบียน
                </CardTitle>
                <CardDescription className="text-teal-50 text-base">
                  วิชาทั้งหมดในเทอมนี้ ({enrollments.length} วิชา)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {enrollments.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">ยังไม่มีวิชาที่ลงทะเบียน</p>
                <p className="text-gray-400 text-sm mt-2">กรุณาติดต่อครูที่ปรึกษา</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg md:text-xl mb-1 line-clamp-2 text-gray-900">
                            {enrollment.course.course_name}
                          </CardTitle>
                          {enrollment.course.course_code && (
                            <p className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-mono font-semibold">
                              {enrollment.course.course_code}
                            </p>
                          )}
                        </div>
                        {enrollment.grade && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center shadow-md">
                              <span className="text-emerald-700 font-bold text-lg">{enrollment.grade}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {enrollment.course.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {enrollment.course.description}
                        </p>
                      )}
                      {enrollment.course.teacher && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 pt-3 border-t">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {enrollment.course.teacher.first_name} {enrollment.course.teacher.last_name}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}
