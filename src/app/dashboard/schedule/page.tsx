// src/app/dashboard/schedule/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Clock,
  GraduationCap,
  BookOpen,
  Coffee,
  Lock,
  Loader2
} from 'lucide-react'

const TIME_SLOTS = [
  { hour: 0, time: '08:20-08:40' },
  { hour: 1, time: '08:40-09:30' },
  { hour: 2, time: '09:30-10:20' },
  { hour: 3, time: '10:20-11:10' },
  { hour: 4, time: '11:10-12:00' },
  { hour: 5, time: '12:00-12:50' },
  { hour: 6, time: '12:50-13:40' },
  { hour: 7, time: '13:40-14:30' },
  { hour: 8, time: '14:30-15:20' },
]

const DAYS = [
  { id: 'monday', name: 'จันทร์', short: 'จ' },
  { id: 'tuesday', name: 'อังคาร', short: 'อ' },
  { id: 'wednesday', name: 'พุธ', short: 'พ' },
  { id: 'thursday', name: 'พฤหัสบดี', short: 'พฤ' },
  { id: 'friday', name: 'ศุกร์', short: 'ศ' },
]

const REQUIRED_SLOTS: Record<string, Record<number, string>> = {
  monday: { 0: 'โฮมรูม', 1: 'แนะแนว' },
  tuesday: { 0: 'โฮมรูม' },
  wednesday: { 0: 'โฮมรูม' },
  thursday: { 0: 'โฮมรูม' },
  friday: { 0: 'โฮมรูม' },
}

type ScheduleSlot = {
  id?: string
  day: string
  hour: number
  subject: string | null
  grade_level: string | null
  is_lunch: boolean
}

type ScheduleData = {
  [day: string]: {
    [hour: number]: ScheduleSlot | null
  }
}

export default function SchedulePage() {
  const supabase = createSupabaseBrowserClient()
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [schedule, setSchedule] = useState<ScheduleData>({})
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Array<{ id: string; course_name: string }>>([])
  const [availableGrades, setAvailableGrades] = useState<string[]>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadCourses() {
      const { data } = await supabase
        .from('courses')
        .select('id, course_name')
        .order('course_name')

      if (data) {
        setCourses(data)
      }
    }
    loadCourses()
  }, [supabase])

  useEffect(() => {
    async function loadGrades() {
      const { data } = await supabase
        .from('students')
        .select('grade_level')
        .order('grade_level')

      if (data) {
        const uniqueGrades = Array.from(new Set(data.map(s => s.grade_level).filter(Boolean)))
        setAvailableGrades(uniqueGrades as string[])
        if (uniqueGrades.length > 0 && !selectedGrade) {
          setSelectedGrade(uniqueGrades[0] as string)
        }
      }
    }
    loadGrades()
  }, [supabase, selectedGrade])

  useEffect(() => {
    if (!selectedGrade) return

    async function loadSchedule() {
      setLoading(true)
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('grade_level', selectedGrade)
        .order('day')
        .order('hour')

      if (error) {
        console.error('Error loading schedule:', error)
      } else {
        const scheduleData: ScheduleData = {}
        DAYS.forEach(d => {
          scheduleData[d.id] = {}
          TIME_SLOTS.forEach(slot => {
            scheduleData[d.id][slot.hour] = null
          })
        })

        if (data) {
          data.forEach((item: any) => {
            if (!scheduleData[item.day]) {
              scheduleData[item.day] = {}
            }
            scheduleData[item.day][item.hour] = item
          })
        }

        setSchedule(scheduleData)
      }
      setLoading(false)
    }

    loadSchedule()
  }, [selectedGrade, supabase])

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

  const isRequiredSlot = (day: string, hour: number) => {
    return REQUIRED_SLOTS[day] && REQUIRED_SLOTS[day][hour] !== undefined
  }

  const isEditable = (day: string, hour: number) => {
    if (isRequiredSlot(day, hour)) {
      return false
    }
    if (isLunchBreak(hour, selectedGrade)) {
      return false
    }
    return true
  }

  const updateSlot = async (day: string, hour: number, subject: string | null) => {
    if (!isEditable(day, hour)) {
      return
    }

    const currentSlot = schedule[day]?.[hour]
    const isLunch = isLunchBreak(hour, selectedGrade)

    if (subject && subject.trim() !== '') {
      if (currentSlot?.id) {
        const { error } = await supabase
          .from('schedules')
          .update({
            subject: subject.trim(),
            is_lunch: false,
          })
          .eq('id', currentSlot.id)

        if (error) {
          console.error('Error updating schedule:', error)
          setStatusMessage('อัปเดตตารางเรียนล้มเหลว')
          return
        }
        setStatusMessage('อัปเดตตารางเรียนสำเร็จ')
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert({
            day,
            hour,
            subject: subject.trim(),
            grade_level: selectedGrade,
            is_lunch: false,
          })

        if (error) {
          console.error('Error creating schedule:', error)
          setStatusMessage('เพิ่มตารางเรียนล้มเหลว')
          return
        }
        setStatusMessage('เพิ่มตารางเรียนสำเร็จ')
      }
    } else {
      if (currentSlot?.id) {
        const { error } = await supabase
          .from('schedules')
          .delete()
          .eq('id', currentSlot.id)

        if (error) {
          console.error('Error deleting schedule:', error)
          setStatusMessage('ลบตารางเรียนล้มเหลว')
          return
        }
        setStatusMessage('ลบตารางเรียนสำเร็จ')
      }
    }

    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('grade_level', selectedGrade)
      .order('day')
      .order('hour')

    if (data) {
      const scheduleData: ScheduleData = {}
      DAYS.forEach(d => {
        scheduleData[d.id] = {}
        TIME_SLOTS.forEach(slot => {
          scheduleData[d.id][slot.hour] = null
        })
      })

      data.forEach((item: any) => {
        if (!scheduleData[item.day]) {
          scheduleData[item.day] = {}
        }
        scheduleData[item.day][item.hour] = item
      })

      setSchedule(scheduleData)
    }
  }

  // Calculate statistics
  const totalSlots = TIME_SLOTS.length * DAYS.length
  const filledSlots = Object.values(schedule).reduce((acc, day) => {
    return acc + Object.values(day).filter(slot => slot !== null && slot.subject).length
  }, 0)
  const requiredSlots = Object.values(REQUIRED_SLOTS).reduce((acc, day) => acc + Object.keys(day).length, 0)
  const lunchSlots = DAYS.length

  if (loading && !selectedGrade) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการตารางเรียน</h1>
          <p className="text-muted-foreground mt-1">จัดการตารางเรียนสำหรับแต่ละชั้นเรียน</p>
        </div>
        <div className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-muted-foreground" />
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-full sm:w-56" aria-label="เลือกชั้นเรียน">
              <SelectValue placeholder="เลือกชั้นเรียน" />
            </SelectTrigger>
            <SelectContent>
              {availableGrades.map(grade => (
                <SelectItem key={grade} value={grade}>
                  ชั้น {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      {selectedGrade && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="ช่องว่างทั้งหมด"
            value={totalSlots}
            icon={<Calendar className="w-5 h-5" />}
          />
          <StatsCard
            title="วิชาที่กำหนด"
            value={filledSlots}
            icon={<BookOpen className="w-5 h-5" />}
          />
          <StatsCard
            title="ช่องบังคับ"
            value={requiredSlots}
            icon={<Lock className="w-5 h-5" />}
          />
          <StatsCard
            title="พักเที่ยง"
            value={lunchSlots}
            icon={<Coffee className="w-5 h-5" />}
          />
        </div>
      )}

      {/* Schedule Table Card */}
      {selectedGrade && (
        <Card>
          <CardHeader className="border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-secondary rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">ตารางเรียนชั้น {selectedGrade}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {selectedGrade && parseInt(selectedGrade.split('/')[0]) >= 4
                    ? 'พักเที่ยง: ชั่วโมงที่ 5 (12:00-12:50)'
                    : 'พักเที่ยง: ชั่วโมงที่ 4 (11:10-12:00)'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <p className="text-muted-foreground">กำลังโหลดตารางเรียน...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-16 md:w-20 font-semibold text-center">ชั่วโมง</TableHead>
                      <TableHead className="w-28 md:w-36 font-semibold">เวลา</TableHead>
                      {DAYS.map(day => (
                        <TableHead key={day.id} className="min-w-32 md:min-w-40 font-semibold text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm md:text-base">{day.name}</span>
                            <span className="text-xs text-muted-foreground hidden md:inline">({day.short})</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TIME_SLOTS.map(slot => {
                      const isLunch = isLunchBreak(slot.hour, selectedGrade)
                      return (
                        <TableRow
                          key={slot.hour}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-bold text-center">
                            {slot.hour}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {slot.time}
                            </div>
                          </TableCell>
                          {DAYS.map(day => {
                            const currentSlot = schedule[day.id]?.[slot.hour]
                            const isRequired = isRequiredSlot(day.id, slot.hour)
                            const editable = isEditable(day.id, slot.hour)
                            const requiredText = REQUIRED_SLOTS[day.id]?.[slot.hour]

                            return (
                              <TableCell key={day.id} className="p-2">
                                {isLunch ? (
                                  <div className="flex items-center justify-center p-2 rounded-lg bg-orange-50 border border-orange-100">
                                    <div className="flex items-center gap-2 text-orange-700 font-medium text-xs md:text-sm">
                                      <Coffee className="w-3 h-3 md:w-4 md:h-4" />
                                      <span className="hidden sm:inline">พักเที่ยง</span>
                                      <span className="sm:hidden">พัก</span>
                                    </div>
                                  </div>
                                ) : isRequired ? (
                                  <div className="flex items-center justify-center p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs md:text-sm">
                                      <Lock className="w-3 h-3 md:w-4 md:h-4" />
                                      <span>{requiredText}</span>
                                    </div>
                                  </div>
                                ) : editable ? (
                                  <Select
                                    value={currentSlot?.subject || 'empty'}
                                    onValueChange={(value) => updateSlot(day.id, slot.hour, value === 'empty' ? null : value)}
                                  >
                                    <SelectTrigger className="w-full text-xs md:text-sm" aria-label={`เลือกวิชา วัน ${day.name} ชั่วโมง ${slot.hour}`}>
                                      <SelectValue placeholder="เลือกวิชา" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="empty">-- ว่าง --</SelectItem>
                                      {courses.map(course => (
                                        <SelectItem key={course.id} value={course.course_name}>
                                          {course.course_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="text-muted-foreground/30 text-xs md:text-sm text-center">-</div>
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedGrade && availableGrades.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <Calendar className="w-20 h-20 text-muted-foreground/20 relative z-10" />
            </div>
            <h3 className="text-xl font-semibold mb-2">ยังไม่มีชั้นเรียน</h3>
            <p className="text-muted-foreground text-center max-w-md">
              กรุณาเพิ่มนักเรียนก่อนเพื่อสร้างชั้นเรียน
            </p>
          </CardContent>
        </Card>
      )}
      <div aria-live="polite" role="status" className="sr-only">{statusMessage || ''}</div>
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
