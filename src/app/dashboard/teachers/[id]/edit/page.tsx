// src/app/dashboard/teachers/[id]/edit/page.tsx
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

// Type สำหรับ Teacher
type Teacher = {
  first_name: string
  last_name: string
  department: string | null
  grade_level: string
}

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
      <div className="flex items-center justify-center p-10">
        <p>กำลังโหลดข้อมูลครู...</p>
      </div>
    )
  }

  // แสดงผลฟอร์ม
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">แก้ไขข้อมูลครู</CardTitle>
          <CardDescription>
            อัปเดตข้อมูลครูในระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อจริง</FormLabel>
                    <FormControl>
                      <Input placeholder="สมศรี" {...field} />
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
                    <FormLabel>นามสกุล</FormLabel>
                    <FormControl>
                      <Input placeholder="สอนดี" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>แผนก / สาขา (ถ้ามี)</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น คณิตศาสตร์, วิทยาศาสตร์" {...field} />
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
                    <FormLabel>ห้องเรียน (เช่น 1/1, 2/3, 3/5)</FormLabel>
                    <FormControl>
                      <Input placeholder="1/1" {...field} />
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
                  <Link href="/dashboard/teachers">ยกเลิก</Link>
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
