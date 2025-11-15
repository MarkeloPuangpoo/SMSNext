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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// เวลาของแต่ละชั่วโมง
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
  { id: 'monday', name: 'จันทร์' },
  { id: 'tuesday', name: 'อังคาร' },
  { id: 'wednesday', name: 'พุธ' },
  { id: 'thursday', name: 'พฤหัสบดี' },
  { id: 'friday', name: 'ศุกร์' },
]

// ช่องบังคับ (โฮมรูมทุกวัน, แนะแนววันจันทร์)
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

  // ดึงข้อมูล courses
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

  // ดึงรายชื่อชั้นเรียนที่มีอยู่
  useEffect(() => {
    async function loadGrades() {
      const { data } = await supabase
        .from('students')
        .select('grade_level')
        .order('grade_level')
      
      if (data) {
        const uniqueGrades = Array.from(new Set(data.map(s => s.grade_level).filter(Boolean)))
        setAvailableGrades(uniqueGrades as string[])
        // ตั้งค่า selectedGrade เป็นค่าแรกถ้ายังไม่มี
        if (uniqueGrades.length > 0 && !selectedGrade) {
          setSelectedGrade(uniqueGrades[0] as string)
        }
      }
    }
    loadGrades()
  }, [supabase, selectedGrade])

  // ดึงข้อมูลตารางเรียน
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
        // แปลงข้อมูลเป็นรูปแบบ ScheduleData
        const scheduleData: ScheduleData = {}
        DAYS.forEach(day => {
          scheduleData[day.id] = {}
          TIME_SLOTS.forEach(slot => {
            scheduleData[day.id][slot.hour] = null
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

  // ตรวจสอบว่าช่องนี้เป็นพักเที่ยงหรือไม่
  const isLunchBreak = (hour: number, gradeLevel: string) => {
    const grade = parseInt(gradeLevel.split('/')[0])
    // ม.1-ม.3 พักเที่ยงที่ชั่วโมง 4, ม.4-ม.6 พักเที่ยงที่ชั่วโมง 5
    if (grade >= 1 && grade <= 3) {
      return hour === 4
    } else if (grade >= 4 && grade <= 6) {
      return hour === 5
    }
    return false
  }

  // ตรวจสอบว่าช่องนี้เป็นช่องบังคับหรือไม่
  const isRequiredSlot = (day: string, hour: number) => {
    return REQUIRED_SLOTS[day] && REQUIRED_SLOTS[day][hour] !== undefined
  }

  // ตรวจสอบว่าช่องนี้สามารถแก้ไขได้หรือไม่
  const isEditable = (day: string, hour: number) => {
    // ช่องบังคับไม่สามารถแก้ไขได้
    if (isRequiredSlot(day, hour)) {
      return false
    }
    // ช่องพักเที่ยงไม่สามารถแก้ไขได้
    if (isLunchBreak(hour, selectedGrade)) {
      return false
    }
    return true
  }

  // อัปเดตช่องตารางเรียน
  const updateSlot = async (day: string, hour: number, subject: string | null) => {
    if (!isEditable(day, hour)) {
      return
    }

    const currentSlot = schedule[day]?.[hour]
    const isLunch = isLunchBreak(hour, selectedGrade)

    // ถ้ามี subject ให้บันทึก/อัปเดต
    if (subject && subject.trim() !== '') {
      if (currentSlot?.id) {
        // อัปเดต
        const { error } = await supabase
          .from('schedules')
          .update({
            subject: subject.trim(),
            is_lunch: false,
          })
          .eq('id', currentSlot.id)

        if (error) {
          console.error('Error updating schedule:', error)
          return
        }
      } else {
        // สร้างใหม่
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
          return
        }
      }
    } else {
      // ถ้าไม่มี subject ให้ลบ
      if (currentSlot?.id) {
        const { error } = await supabase
          .from('schedules')
          .delete()
          .eq('id', currentSlot.id)

        if (error) {
          console.error('Error deleting schedule:', error)
          return
        }
      }
    }

    // Reload schedule
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


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">จัดการตารางเรียน</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            จัดการตารางเรียนสำหรับแต่ละชั้นเรียน
          </p>
        </div>
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="เลือกชั้นเรียน" />
          </SelectTrigger>
          <SelectContent>
            {availableGrades.map(grade => (
              <SelectItem key={grade} value={grade}>
                ม.{grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ตารางเรียนชั้น {selectedGrade}</CardTitle>
          <CardDescription>
            {parseInt(selectedGrade.split('/')[0]) >= 4 
              ? 'พักเที่ยง: ชั่วโมงที่ 5 (12:00-12:50)'
              : 'พักเที่ยง: ชั่วโมงที่ 4 (11:10-12:00)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ชั่วโมงที่</TableHead>
                  <TableHead className="w-32">เวลา</TableHead>
                  {DAYS.map(day => (
                    <TableHead key={day.id} className="min-w-32">
                      {day.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {TIME_SLOTS.map(slot => {
                  const isLunch = isLunchBreak(slot.hour, selectedGrade)
                  return (
                    <TableRow key={slot.hour}>
                      <TableCell className="font-medium">{slot.hour}</TableCell>
                      <TableCell className="text-sm">{slot.time}</TableCell>
                      {DAYS.map(day => {
                        const currentSlot = schedule[day.id]?.[slot.hour]
                        const isRequired = isRequiredSlot(day.id, slot.hour)
                        const editable = isEditable(day.id, slot.hour)
                        const requiredText = REQUIRED_SLOTS[day.id]?.[slot.hour]

                        return (
                          <TableCell key={day.id}>
                            {isLunch ? (
                              <div className="text-center text-gray-500 dark:text-gray-400">
                                พักเที่ยง
                              </div>
                            ) : isRequired ? (
                              <div className="font-medium text-blue-600 dark:text-blue-400">
                                {requiredText}
                              </div>
                            ) : editable ? (
                              <Select
                                value={currentSlot?.subject || 'empty'}
                                onValueChange={(value) => updateSlot(day.id, slot.hour, value === 'empty' ? null : value)}
                              >
                                <SelectTrigger className="w-full">
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
                              <div className="text-gray-400">-</div>
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
        </CardContent>
      </Card>
    </div>
  )
}

