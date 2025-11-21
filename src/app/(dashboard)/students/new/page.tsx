// src/app/(dashboard)/students/new/page.tsx
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
import { 
  UserPlus, 
  ArrowLeft, 
  CheckCircle2, 
  User,
  CreditCard,
  Hash,
  MapPin,
  Calendar,
  GraduationCap,
  Award,
  Mail,
  Key
} from 'lucide-react'

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
      behavior_score: 0,
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
      
      // สร้าง email จากเลขนักเรียน (หรือใช้รูปแบบอื่น)
      const email = `student${values.student_number}@school.local`

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
            behavior_score: values.behavior_score || 0,
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
      })

      // Auto redirect หลังจาก 5 วินาที
      setTimeout(() => {
        router.push('/dashboard/students')
        router.refresh()
      }, 5000)

    } catch (error) {
      console.error('Error:', error)
      setErrorMessage('เกิดข้อผิดพลาดในการเพิ่มข้อมูล')
    }
  }

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
            เพิ่มนักเรียนใหม่
          </h1>
          <p className="text-gray-600 mt-2">กรอกข้อมูลนักเรียนเพื่อเพิ่มเข้าสู่ระบบ</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg text-white">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">ข้อมูลนักเรียน</CardTitle>
                <CardDescription>กรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชีใหม่</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {successData ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                    <CheckCircle2 className="w-20 h-20 text-green-500 relative z-10" />
                  </div>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">เพิ่มนักเรียนสำเร็จ!</h3>
                  <p className="text-gray-600">ข้อมูลสำหรับเข้าสู่ระบบ:</p>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-700">อีเมล:</span>
                    </div>
                    <p className="text-lg font-mono bg-white p-3 rounded border border-green-200 text-gray-800">
                      {successData.email}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Key className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-700">รหัสผ่าน:</span>
                    </div>
                    <p className="text-2xl font-mono bg-white p-4 rounded border border-blue-200 text-center font-bold text-gray-800 tracking-wider">
                      {successData.password}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      <span>กรุณาบันทึกข้อมูลนี้ไว้ให้กับนักเรียน ระบบจะนำคุณกลับไปหน้ารายชื่อในอีก 5 วินาที</span>
                    </p>
                  </div>
                </div>
                <div className="flex justify-center pt-4">
                  <Button asChild className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
                    <Link href="/dashboard/students">กลับไปหน้ารายชื่อ</Link>
                  </Button>
                </div>
              </div>
            ) : (
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
                      {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
