// src/app/(dashboard)/teachers/[id]/edit/page.tsx
'use client' // 👈 สำคัญมาก! ต้องเป็น Client Component

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

// Import Supabase client (ฝั่ง Browser)
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// Import Shadcn UI Components
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

// 1. สร้าง Schema สำหรับ Validate (เหมือนหน้า new/page.tsx)
const teacherFormSchema = z.object({
  first_name: z.string().min(2, {
    message: 'ชื่อจริงต้องมีอย่างน้อย 2 ตัวอักษร',
  }),
  last_name: z.string().min(2, {
    message: 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร',
  }),
  department: z.string().optional(),
})

export default function EditTeacherPage() {
  const router = useRouter()
  const params = useParams() // 👈 ดึง params จาก URL
  const teacherId = params.id as string // 👈 นี่คือ ID ของครู

  const supabase = createSupabaseBrowserClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 2. ตั้งค่า React Hook Form
  const form = useForm<z.infer<typeof teacherFormSchema>>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      department: '',
    },
  })

  // 3. (ส่วนที่เพิ่มมา) ดึงข้อมูลครูคนนี้มาแสดง
  useEffect(() => {
    async function getTeacherData() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('teachers')
        .select('first_name, last_name, department')
        .eq('id', teacherId) // 👈 ดึงข้อมูลเฉพาะ ID นี้
        .single() // 👈 ดึงมาแค่ 1 แถว

      if (error || !data) {
        console.error('Error fetching teacher:', error)
        setErrorMessage('ไม่พบข้อมูลครู หรือเกิดข้อผิดพลาด')
        setIsLoading(false)
      } else {
        // 4. (สำคัญ) เติมข้อมูลลงในฟอร์ม
        form.setValue('first_name', data.first_name)
        form.setValue('last_name', data.last_name)
        // (ต้องจัดการค่า null ที่อาจจะมาจาก DB)
        form.setValue('department', data.department || '') 
        setIsLoading(false)
        setErrorMessage(null)
      }
    }

    if (teacherId) {
      getTeacherData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId])

  // 5. ฟังก์ชัน xử lý (handle) การ Submit ฟอร์ม
  async function onSubmit(values: z.infer<typeof teacherFormSchema>) {
    setErrorMessage(null)

    // 6. เรียกใช้ Supabase เพื่อ "อัปเดต" ข้อมูล
    const { error } = await supabase
      .from('teachers')
      .update({
        first_name: values.first_name,
        last_name: values.last_name,
        department: values.department || null, // 👈 ถ้าเป็น '' ให้ส่ง null
      })
      .eq('id', teacherId) // 👈 อัปเดตเฉพาะ ID นี้

    if (error) {
      console.error('Error updating teacher:', error)
      setErrorMessage(error.message)
    } else {
      // 7. ถ้าสำเร็จ
      router.push('/dashboard/teachers')
      router.refresh() // สั่ง refresh หน้า List
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
              {/* ช่อง ชื่อจริง */}
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

              {/* ช่อง นามสกุล */}
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

              {/* ช่อง แผนก/สาขา (ไม่บังคับ) */}
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