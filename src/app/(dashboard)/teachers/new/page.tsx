// src/app/(dashboard)/teachers/new/page.tsx
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
  Building2,
  GraduationCap,
  Mail,
  Key
} from 'lucide-react'

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
  } | null>(null)

  const form = useForm<z.infer<typeof teacherFormSchema>>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      department: '',
      grade_level: '',
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
      const cleanFirstName = values.first_name.toLowerCase().replace(/\s+/g, '')
      const cleanLastName = values.last_name.toLowerCase().replace(/\s+/g, '')
      const email = `teacher.${cleanFirstName}.${cleanLastName}@bbv.ac.th`

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
            grade_level: values.grade_level,
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
      })

      // Auto redirect หลังจาก 5 วินาที
      setTimeout(() => {
        router.push('/dashboard/teachers')
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
            <Link href="/dashboard/teachers" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              กลับไปหน้ารายชื่อ
            </Link>
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            เพิ่มครูใหม่
          </h1>
          <p className="text-gray-600 mt-2">กรอกข้อมูลครูเพื่อเพิ่มเข้าสู่ระบบ</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg text-white">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">ข้อมูลครู</CardTitle>
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
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">เพิ่มครูสำเร็จ!</h3>
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
                      <span>กรุณาบันทึกข้อมูลนี้ไว้ให้กับครู ระบบจะนำคุณกลับไปหน้ารายชื่อในอีก 5 วินาที</span>
                    </p>
                  </div>
                </div>
                <div className="flex justify-center pt-4">
                  <Button asChild className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
                    <Link href="/dashboard/teachers">กลับไปหน้ารายชื่อ</Link>
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
