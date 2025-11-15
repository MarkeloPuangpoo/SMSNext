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
      <div className="flex items-center justify-center p-10">
        <p>กำลังโหลดข้อมูลวิชา...</p>
      </div>
    )
  }

  // แสดงผลฟอร์ม
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">แก้ไขข้อมูลวิชา</CardTitle>
          <CardDescription>
            อัปเดตข้อมูลวิชาในระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="course_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อวิชา</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น คณิตศาสตร์, วิทยาศาสตร์" {...field} />
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
                    <FormLabel>รหัสวิชา (ถ้ามี)</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น MATH101, SCI201" {...field} />
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
                    <FormLabel>ครูผู้สอน</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>คำอธิบาย (ถ้ามี)</FormLabel>
                    <FormControl>
                      <Input placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับวิชา" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {errorMessage && (
                <p className="text-sm font-medium text-red-500">
                  {errorMessage}
                </p>
              )}

              <div className="flex justify-end gap-4">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/courses">ยกเลิก</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

