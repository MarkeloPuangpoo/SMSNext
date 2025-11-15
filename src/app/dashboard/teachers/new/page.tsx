// src/app/dashboard/teachers/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import Receipt from '@/components/shared/Receipt'

const teacherFormSchema = z.object({
  first_name: z.string().min(2, {
    message: 'ชื่อจริงต้องมีอย่างน้อย 2 ตัวอักษร',
  }),
  last_name: z.string().min(2, {
    message: 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร',
  }),
  department: z.string().optional(),
})

// ฟังก์ชันสร้างรหัสผ่านอัตโนมัติ
function generatePassword(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export default function NewTeacherPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{
    email: string
    password: string
    name: string
  } | null>(null)

  const form = useForm<z.infer<typeof teacherFormSchema>>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      department: '',
    },
  })

  async function onSubmit(values: z.infer<typeof teacherFormSchema>) {
    setErrorMessage(null)
    setSuccessData(null)

    // ดึง user_id จาก session (admin ที่กำลังเพิ่มครู)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setErrorMessage('กรุณาเข้าสู่ระบบก่อน')
      return
    }

    try {
      // สร้างรหัสผ่านอัตโนมัติ
      const password = generatePassword(10)
      
      // สร้าง email จากชื่อ
      const email = `teacher.${values.first_name.toLowerCase()}.${values.last_name.toLowerCase()}@bbv.ac.th`

      // 1. สร้าง user account ใหม่
      const createUserResponse = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          userMetadata: {
            role: 'teacher',
          },
        }),
      })

      const createUserData = await createUserResponse.json()

      if (!createUserResponse.ok) {
        setErrorMessage(createUserData.error || 'ไม่สามารถสร้าง user account ได้')
        return
      }

      const newUserId = createUserData.user.id

      // 2. เพิ่มข้อมูลครู
      const { error } = await supabase
        .from('teachers')
        .insert([
          {
            user_id: newUserId,
            first_name: values.first_name,
            last_name: values.last_name,
            department: values.department || null,
          },
        ])

      if (error) {
        console.error('Error inserting teacher:', error)
        setErrorMessage(error.message)
        return
      }

      // 3. แสดงข้อมูล login
      setSuccessData({
        email,
        password,
        name: `${values.first_name} ${values.last_name}`,
      })

      // Auto redirect หลังจาก 10 วินาที (ให้เวลาพิมพ์)
      setTimeout(() => {
        router.push('/dashboard/teachers')
        router.refresh()
      }, 10000)

    } catch (error) {
      console.error('Error:', error)
      setErrorMessage('เกิดข้อผิดพลาดในการเพิ่มข้อมูล')
    }
  }

  return (
    <div className="mx-auto max-w-2xl print:hidden">
      <Card className="print:hidden">
        <CardHeader className="print:hidden">
          <CardTitle className="text-2xl print:hidden">เพิ่มครูใหม่</CardTitle>
          <CardDescription className="print:hidden">
            กรอกข้อมูลครูเพื่อเพิ่มเข้าสู่ระบบ
          </CardDescription>
        </CardHeader>
        <CardContent className="print:hidden">
          {successData ? (
            <>
              <div className="space-y-4 print:hidden">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 print:hidden">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2 print:hidden">
                    เพิ่มครูสำเร็จ!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 print:hidden">
                    กรุณาพิมพ์ใบเสร็จด้านล่าง
                  </p>
                </div>
              </div>
              <Receipt
                email={successData.email}
                password={successData.password}
                name={successData.name}
                role="teacher"
              />
            </>
          ) : (
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
                    {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
