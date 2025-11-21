// src/app/dashboard/courses/[id]/edit/page.tsx
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
  BookOpen, 
  ArrowLeft, 
  Edit,
  Hash,
  User,
  FileText,
  Loader2
} from 'lucide-react'

const courseFormSchema = z.object({
  course_name: z.string().min(2, {
    message: 'ชื่อวิชาต้องมีอย่างน้อย 2 ตัวอักษร',
  }),
  course_code: z.string().optional(),
  description: z.string().optional(),
  teacher_id: z.string().min(1, {
    message: 'กรุณาเลือกครูผู้สอน',
  }),
})

type Teacher = {
  id: string
  first_name: string
  last_name: string
}

type Course = {
  course_name: string
  course_code: string | null
  description: string | null
  teacher_id: string
}

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const supabase = createSupabaseBrowserClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [teachers, setTeachers] = useState<Teacher[]>([])

  const form = useForm<z.infer<typeof courseFormSchema>>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      course_name: '',
      course_code: '',
      description: '',
      teacher_id: '',
    },
  })

  // ดึงข้อมูลครู
  useEffect(() => {
    async function loadTeachers() {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, first_name, last_name')
        .order('first_name')

      if (error) {
        console.error('Error loading teachers:', error)
      } else if (data) {
        setTeachers(data)
      }
    }
    loadTeachers()
  }, [supabase])

  // ดึงข้อมูลวิชา
  useEffect(() => {
    async function getCourseData() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select('course_name, course_code, description, teacher_id')
        .eq('id', courseId)
        .single()

      if (error || !data) {
        console.error('Error fetching course:', error)
        setErrorMessage('ไม่พบข้อมูลวิชา หรือเกิดข้อผิดพลาด')
        setIsLoading(false)
      } else {
        // เติมข้อมูลลงในฟอร์ม
        form.setValue('course_name', data.course_name)
        form.setValue('course_code', data.course_code || '')
        form.setValue('description', data.description || '')
        form.setValue('teacher_id', data.teacher_id)
        setIsLoading(false)
        setErrorMessage(null)
      }
    }

    if (courseId) {
      getCourseData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  // ฟังก์ชัน xử lý การ Submit ฟอร์ม
  async function onSubmit(values: z.infer<typeof courseFormSchema>) {
    setErrorMessage(null)

    const { error } = await supabase
      .from('courses')
      .update({
        course_name: values.course_name,
        course_code: values.course_code || null,
        description: values.description || null,
        teacher_id: values.teacher_id,
      })
      .eq('id', courseId)

    if (error) {
      console.error('Error updating course:', error)
      setErrorMessage(error.message)
    } else {
      router.push('/dashboard/courses')
      router.refresh()
    }
  }

  // แสดงผลตอนโหลด...
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูลวิชา...</p>
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
            <Link href="/dashboard/courses" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              กลับไปหน้ารายการ
            </Link>
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            แก้ไขข้อมูลวิชา
          </h1>
          <p className="text-gray-600 mt-2">อัปเดตข้อมูลวิชาในระบบ</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg text-white">
                <Edit className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">ข้อมูลวิชา</CardTitle>
                <CardDescription>แก้ไขข้อมูลวิชาที่ต้องการเปลี่ยนแปลง</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="course_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        ชื่อวิชา <span className="text-red-500">*</span>
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
                  name="course_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700">
                        <Hash className="w-4 h-4 text-indigo-600" />
                        รหัสวิชา (ถ้ามี)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="เช่น MATH101, SCI201" 
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
                  name="teacher_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700">
                        <User className="w-4 h-4 text-indigo-600" />
                        ครูผู้สอน <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                            <SelectValue placeholder="เลือกครูผู้สอน" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.first_name} {teacher.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        คำอธิบาย (ถ้ามี)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับวิชา" 
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
                    <Link href="/dashboard/courses">ยกเลิก</Link>
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
