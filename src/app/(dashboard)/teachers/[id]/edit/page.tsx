// src/app/(dashboard)/teachers/[id]/edit/page.tsx
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
  Building2,
  GraduationCap,
  Loader2
} from 'lucide-react'

// Schema สำหรับ Validate
const teacherFormSchema = z.object({
  first_name: z.string().min(2, {
    message: 'ชื่อจริงต้องมีอย่างน้อย 2 ตัวอักษร',
  }),
  last_name: z.string().min(2, {
    message: 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร',
  }),
  department: z.string().optional(),
  grade_level: z.string().min(1, {
    message: 'กรุณาเลือกห้องเรียน',
  }),
})

export default function EditTeacherPage() {
  const router = useRouter()
  const params = useParams()
  const teacherId = params.id as string

  const supabase = createSupabaseBrowserClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<z.infer<typeof teacherFormSchema>>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      department: '',
      grade_level: '',
    },
  })

  // ดึงข้อมูลครูคนนี้มาแสดง
  useEffect(() => {
    async function getTeacherData() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('teachers')
        .select('first_name, last_name, department, grade_level')
        .eq('id', teacherId)
        .single()

      if (error || !data) {
        console.error('Error fetching teacher:', error)
        setErrorMessage('ไม่พบข้อมูลครู หรือเกิดข้อผิดพลาด')
        setIsLoading(false)
      } else {
        // เติมข้อมูลลงในฟอร์ม
        form.setValue('first_name', data.first_name)
        form.setValue('last_name', data.last_name)
        form.setValue('department', data.department || '')
        form.setValue('grade_level', data.grade_level || '')
        setIsLoading(false)
        setErrorMessage(null)
      }
    }

    if (teacherId) {
      getTeacherData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId])

  // ฟังก์ชัน xử lý การ Submit ฟอร์ม
  async function onSubmit(values: z.infer<typeof teacherFormSchema>) {
    setErrorMessage(null)

    // เรียกใช้ Supabase เพื่อ "อัปเดต" ข้อมูล
    const { error } = await supabase
      .from('teachers')
      .update({
        first_name: values.first_name,
        last_name: values.last_name,
        department: values.department || null,
        grade_level: values.grade_level,
      })
      .eq('id', teacherId)

    if (error) {
      console.error('Error updating teacher:', error)
      setErrorMessage(error.message)
    } else {
      // ถ้าสำเร็จ
      router.push('/dashboard/teachers')
      router.refresh()
    }
  }

  // แสดงผลตอนโหลด...
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูลครู...</p>
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
            <Link href="/dashboard/teachers" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              กลับไปหน้ารายชื่อ
            </Link>
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            แก้ไขข้อมูลครู
          </h1>
          <p className="text-gray-600 mt-2">อัปเดตข้อมูลครูในระบบ</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg text-white">
                <Edit className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">ข้อมูลครู</CardTitle>
                <CardDescription>แก้ไขข้อมูลครูที่ต้องการเปลี่ยนแปลง</CardDescription>
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
                            placeholder="สมศรี" 
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
                            placeholder="สอนดี" 
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
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        แผนก / สาขา (ถ้ามี)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="เช่น คณิตศาสตร์, วิทยาศาสตร์" 
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
                        ชั้นเรียน <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="เช่น 1/1, 2/3, 3/5" 
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
                    <Link href="/dashboard/teachers">ยกเลิก</Link>
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
