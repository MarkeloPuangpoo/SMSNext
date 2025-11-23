// src/app/(dashboard)/students/[id]/edit/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import {
  User,
  ArrowLeft,
  Edit,
  CreditCard,
  Hash,
  MapPin,
  Calendar,
  GraduationCap,
  Award,
  Loader2
} from 'lucide-react'

// Schema สำหรับ Validate
const studentFormSchema = z.object({
  first_name: z.string().min(2, {
    message: 'ชื่อจริงต้องมีอย่างน้อย 2 ตัวอักษร',
  }),
  last_name: z.string().min(2, {
    message: 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร',
  }),
  national_id: z.string().min(13, {
    message: 'เลขบัตรประชาชนต้องมี 13 หลัก',
  }).max(13, {
    message: 'เลขบัตรประชาชนต้องมี 13 หลัก',
  }),
  student_number: z.string().min(1, {
    message: 'กรุณากรอกเลขนักเรียน',
  }),
  address: z.string().min(5, {
    message: 'กรุณากรอกที่อยู่',
  }),
  birth_date: z.string().min(1, {
    message: 'กรุณาเลือกวันเกิด',
  }),
  grade_level: z.string().min(1, {
    message: 'กรุณากรอกชั้นเรียน (เช่น 1/1, 2/3)',
  }),
  behavior_score: z.coerce.number().min(0).max(100).optional(),
})

// Type สำหรับ Student
type Student = {
  first_name: string
  last_name: string
  national_id: string
  student_number: string
  address: string
  birth_date: string
  grade_level: string
  behavior_score: number | null
}

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const supabase = createSupabaseBrowserClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      national_id: '',
      student_number: '',
      address: '',
      birth_date: '',
      grade_level: '',
      behavior_score: 0,
    },
  })

  // ดึงข้อมูลนักเรียนคนนี้มาแสดง
  useEffect(() => {
    async function getStudentData() {
      setIsLoading(true)
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (fetchError || !data) {
        console.error('Error fetching student:', fetchError)
        setErrorMessage('ไม่พบข้อมูลนักเรียน หรือเกิดข้อผิดพลาด')
        setIsLoading(false)
      } else {
        // เติมข้อมูลลงในฟอร์ม
        form.setValue('first_name', data.first_name)
        form.setValue('last_name', data.last_name)
        form.setValue('national_id', data.national_id || '')
        form.setValue('student_number', data.student_number || '')
        form.setValue('address', data.address || '')
        form.setValue('birth_date', data.birth_date ? new Date(data.birth_date).toISOString().split('T')[0] : '')
        form.setValue('grade_level', data.grade_level || '')
        form.setValue('behavior_score', data.behavior_score || 0)
        setIsLoading(false)
        setErrorMessage(null)
      }
    }

    if (studentId) {
      getStudentData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  // ฟังก์ชัน xử lý การ Submit ฟอร์ม
  async function onSubmit(values: z.infer<typeof studentFormSchema>) {
    setErrorMessage(null)

    // เรียกใช้ Supabase เพื่อ "อัปเดต" ข้อมูล
    const { error: updateError } = await supabase
      .from('students')
      .update({
        first_name: values.first_name,
        last_name: values.last_name,
        national_id: values.national_id,
        student_number: values.student_number,
        address: values.address,
        birth_date: values.birth_date,
        grade_level: values.grade_level,
        behavior_score: values.behavior_score || 0,
      })
      .eq('id', studentId)

    if (updateError) {
      console.error('Error updating student:', updateError)
      setErrorMessage(updateError.message)
    } else {
      // ถ้าสำเร็จ
      router.push('/dashboard/students')
      router.refresh()
    }
  }

  // แสดงผลตอนโหลด...
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูลนักเรียน...</p>
        </div>
      </div>
    )
  }

  // แสดงผลฟอร์ม
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4 hover:bg-indigo-50">
            <Link href="/dashboard/students" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              กลับไปหน้ารายชื่อ
            </Link>
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            แก้ไขข้อมูลนักเรียน
          </h1>
          <p className="text-gray-600 mt-2">อัปเดตข้อมูลนักเรียนในระบบ</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg text-white">
                <Edit className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">ข้อมูลนักเรียน</CardTitle>
                <CardDescription>แก้ไขข้อมูลนักเรียนที่ต้องการเปลี่ยนแปลง</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4 text-indigo-600" />
                          ชื่อจริง
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="สมชาย"
                            {...field}
                            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4 text-indigo-600" />
                          นามสกุล
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ใจดี"
                            {...field}
                            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="national_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        เลขบัตรประชาชน
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1234567890123"
                          maxLength={13}
                          {...field}
                          className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="student_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700">
                        <Hash className="w-4 h-4 text-indigo-600" />
                        เลขนักเรียน
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345"
                          {...field}
                          className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        ที่อยู่
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 ถนน..."
                          {...field}
                          className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          วันเกิด
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grade_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700">
                          <GraduationCap className="w-4 h-4 text-indigo-600" />
                          ชั้นเรียน
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="1/1"
                            {...field}
                            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="behavior_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700">
                        <Award className="w-4 h-4 text-indigo-600" />
                        คะแนนความประพฤติ (0-100)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
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
                    <Link href="/dashboard/students">ยกเลิก</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg"
                  >
                    {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
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
