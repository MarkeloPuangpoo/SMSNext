// src/app/dashboard/students/new/page.tsx
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

// Schema สำหรับ Validate ข้อมูลนักเรียนใหม่
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

// ฟังก์ชันสร้างรหัสผ่านอัตโนมัติ
function generatePassword(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export default function NewStudentPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{
    email: string
    password: string
    name: string
    studentNumber: string
  } | null>(null)

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
      behavior_score: 100,
    },
  })

  async function onSubmit(values: z.infer<typeof studentFormSchema>) {
    setErrorMessage(null)
    setSuccessData(null)

    // ดึง user_id จาก session (ครูที่กำลังเพิ่มนักเรียน)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setErrorMessage('กรุณาเข้าสู่ระบบก่อน')
      return
    }

    try {
      // สร้างรหัสผ่านอัตโนมัติ
      const password = generatePassword(10)
      
      // สร้าง email จากเลขนักเรียน
      const email = `student${values.student_number}@bbv.ac.th`

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
            role: 'student',
            student_number: values.student_number,
          },
        }),
      })

      const createUserData = await createUserResponse.json()

      if (!createUserResponse.ok) {
        setErrorMessage(createUserData.error || 'ไม่สามารถสร้าง user account ได้')
        return
      }

      const newUserId = createUserData.user.id

      // 2. เพิ่มข้อมูลนักเรียน
      const { error } = await supabase
        .from('students')
        .insert([
          {
            user_id: newUserId,
            first_name: values.first_name,
            last_name: values.last_name,
            national_id: values.national_id,
            student_number: values.student_number,
            address: values.address,
            birth_date: values.birth_date,
            grade_level: values.grade_level, // เก็บเป็น TEXT เช่น "1/1"
            behavior_score: values.behavior_score || 100,
          },
        ])

      if (error) {
        console.error('Error inserting student:', error)
        setErrorMessage(error.message)
        return
      }

      // 3. แสดงข้อมูล login
      setSuccessData({
        email,
        password,
        name: `${values.first_name} ${values.last_name}`,
        studentNumber: values.student_number,
      })

      // Auto redirect หลังจาก 10 วินาที (ให้เวลาพิมพ์)
      setTimeout(() => {
        router.push('/dashboard/students')
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
          <CardTitle className="text-2xl print:hidden">เพิ่มนักเรียนใหม่</CardTitle>
          <CardDescription className="print:hidden">
            กรอกข้อมูลนักเรียนเพื่อเพิ่มเข้าสู่ระบบ
          </CardDescription>
        </CardHeader>
        <CardContent className="print:hidden">
          {successData ? (
            <>
              <div className="space-y-4 print:hidden">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 print:hidden">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2 print:hidden">
                    เพิ่มนักเรียนสำเร็จ!
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
                role="student"
                studentNumber={successData.studentNumber}
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
                        <Input placeholder="สมชาย" {...field} />
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
                        <Input placeholder="ใจดี" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="national_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เลขบัตรประชาชน</FormLabel>
                      <FormControl>
                        <Input placeholder="1234567890123" maxLength={13} {...field} />
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
                      <FormLabel>เลขนักเรียน</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
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
                      <FormLabel>ที่อยู่</FormLabel>
                      <FormControl>
                        <Input placeholder="123 ถนน..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันเกิด</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>ชั้นเรียน (เช่น 1/1, 2/3, 3/5)</FormLabel>
                      <FormControl>
                        <Input placeholder="1/1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="behavior_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>คะแนนความประพฤติ (0-100)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
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
                    <Link href="/dashboard/students">ยกเลิก</Link>
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
