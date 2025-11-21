// src/app/dashboard/behavior/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { 
  AlertTriangle, 
  ArrowLeft, 
  User,
  TrendingUp,
  TrendingDown,
  FileText,
  Award
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

const behaviorFormSchema = z.object({
  student_id: z.string().min(1, {
    message: 'กรุณาเลือกนักเรียน',
  }),
  behavior_type: z.enum(['good', 'bad'], {
    required_error: 'กรุณาเลือกประเภทพฤติกรรม',
  }),
  points: z.coerce.number().min(1, {
    message: 'กรุณากรอกคะแนน (อย่างน้อย 1 คะแนน)',
  }),
  description: z.string().min(5, {
    message: 'กรุณากรอกรายละเอียด (อย่างน้อย 5 ตัวอักษร)',
  }),
})

type Student = {
  id: string
  first_name: string
  last_name: string
  student_number: string | null
  grade_level: string
  behavior_score: number | null
}

export default function NewBehaviorPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const form = useForm<z.infer<typeof behaviorFormSchema>>({
    resolver: zodResolver(behaviorFormSchema),
    defaultValues: {
      student_id: '',
      behavior_type: undefined,
      points: 1,
      description: '',
    },
  })

  // ดึงข้อมูลนักเรียน
  useEffect(() => {
    async function loadStudents() {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_number, grade_level, behavior_score')
        .order('first_name')

      if (error) {
        console.error('Error loading students:', error)
      } else if (data) {
        setStudents(data)
      }
    }
    loadStudents()
  }, [supabase])

  // อัปเดต selectedStudent เมื่อเลือกนักเรียน
  const watchedStudentId = form.watch('student_id')
  useEffect(() => {
    if (watchedStudentId) {
      const student = students.find(s => s.id === watchedStudentId)
      setSelectedStudent(student || null)
    } else {
      setSelectedStudent(null)
    }
  }, [watchedStudentId, students])

  async function onSubmit(values: z.infer<typeof behaviorFormSchema>) {
    setErrorMessage(null)

    // ตรวจสอบ role ก่อนบันทึก
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMessage('กรุณาเข้าสู่ระบบก่อน')
      return
    }

    const userRole = user.user_metadata?.role
    if (userRole !== 'superadmin') {
      setErrorMessage('คุณไม่มีสิทธิ์ในการบันทึกพฤติกรรม')
      return
    }

    // ตรวจสอบว่า behavior_type กับ points สอดคล้องกัน
    // good = points ต้องเป็นลบ (ลดคะแนน)
    // bad = points ต้องเป็นบวก (เพิ่มคะแนน)
    let finalPoints = values.points
    if (values.behavior_type === 'good') {
      finalPoints = -Math.abs(finalPoints) // ทำให้เป็นลบเสมอ
    } else {
      finalPoints = Math.abs(finalPoints) // ทำให้เป็นบวกเสมอ
    }

    try {
      const { error } = await supabase
        .from('behavior_logs')
        .insert([
          {
            student_id: values.student_id,
            behavior_type: values.behavior_type,
            points: finalPoints,
            description: values.description,
            recorded_by: user.id,
          },
        ])

      if (error) {
        console.error('Error inserting behavior log:', error)
        setErrorMessage(error.message)
      } else {
        router.push('/dashboard/behavior')
        router.refresh()
      }
    } catch (error) {
      console.error('Error:', error)
      setErrorMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4 hover:bg-indigo-50">
            <Link href="/dashboard/behavior" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              กลับไปหน้ารายการ
            </Link>
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            บันทึกพฤติกรรมใหม่
          </h1>
          <p className="text-gray-600 mt-2">บันทึกพฤติกรรมดีหรือไม่ดีของนักเรียน</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg text-white">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">ข้อมูลพฤติกรรม</CardTitle>
                <CardDescription>กรอกข้อมูลให้ครบถ้วนเพื่อบันทึกพฤติกรรม</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700">
                        <User className="w-4 h-4 text-indigo-600" />
                        เลือกนักเรียน <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                            <SelectValue placeholder="เลือกนักเรียน" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.first_name} {student.last_name} 
                              {student.student_number && ` (${student.student_number})`} 
                              {' '}- {student.grade_level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedStudent && (
                        <div className="mt-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-700">คะแนนความประพฤติปัจจุบัน</p>
                              <p className="text-xs text-gray-500">คะแนนต่ำ = ดี, คะแนนสูง = แย่</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Award className={`w-5 h-5 ${
                                (selectedStudent.behavior_score || 0) === 0 ? 'text-gray-400' :
                                (selectedStudent.behavior_score || 0) < 10 ? 'text-emerald-500' :
                                (selectedStudent.behavior_score || 0) < 20 ? 'text-yellow-500' : 'text-red-500'
                              }`} />
                              <span className={`text-2xl font-bold ${
                                (selectedStudent.behavior_score || 0) === 0 ? 'text-gray-600' :
                                (selectedStudent.behavior_score || 0) < 10 ? 'text-emerald-600' :
                                (selectedStudent.behavior_score || 0) < 20 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {selectedStudent.behavior_score || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="behavior_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-indigo-600" />
                        ประเภทพฤติกรรม <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                            <SelectValue placeholder="เลือกประเภทพฤติกรรม" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="good">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="w-4 h-4 text-emerald-600" />
                              <span>พฤติกรรมดี (ลดคะแนน)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="bad">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-red-600" />
                              <span>พฤติกรรมไม่ดี (เพิ่มคะแนน)</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700">
                        <Award className="w-4 h-4 text-indigo-600" />
                        จำนวนคะแนน <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          placeholder="เช่น 1, 2, 5"
                          {...field}
                          className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        {form.watch('behavior_type') === 'good' 
                          ? 'ระบบจะแปลงเป็นค่าลบอัตโนมัติ (ลดคะแนน)'
                          : form.watch('behavior_type') === 'bad'
                          ? 'ระบบจะแปลงเป็นค่าบวกอัตโนมัติ (เพิ่มคะแนน)'
                          : 'เลือกประเภทพฤติกรรมก่อน'}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        รายละเอียด <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="อธิบายรายละเอียดของพฤติกรรม..."
                          rows={4}
                          {...field}
                          className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMessage && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">
                      ⚠️ {errorMessage}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" asChild className="hover:bg-gray-50">
                    <Link href="/dashboard/behavior">ยกเลิก</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg"
                  >
                    {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'บันทึกพฤติกรรม'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

