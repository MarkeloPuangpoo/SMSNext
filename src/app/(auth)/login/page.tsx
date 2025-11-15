// src/app/(auth)/login/page.tsx
'use client' // 👈 ต้องเป็น Client Component เพราะเป็นฟอร์มที่มีการโต้ตอบ

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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

// 1. สร้าง Schema สำหรับ Validate ข้อมูลด้วย Zod
const formSchema = z.object({
  email: z.string().email({
    message: 'กรุณากรอกอีเมลที่ถูกต้อง',
  }),
  password: z.string().min(6, {
    message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
  }),
})

export default function LoginPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient() // สร้าง client
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 2. ตั้งค่า React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // 3. ฟังก์ชัน xử lý (handle) การ Submit ฟอร์ม
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setErrorMessage(null) // เคลียร์ error เก่า

    // 4. เรียกใช้ Supabase auth
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      // ถ้าล็อกอินไม่ผ่าน (เช่น รหัสผิด, ไม่มี user)
      setErrorMessage(error.message)
    } else {
      // 5. ถ้าล็อกอินผ่าน - ตรวจสอบ role และ redirect ไปที่หน้าที่ถูกต้อง
      const { data: { user } } = await supabase.auth.getUser()
      const userRole = user?.user_metadata?.role
      
      if (userRole === 'student') {
        router.push('/student/dashboard')
      } else if (userRole === 'teacher') {
        router.push('/teacher/dashboard')
      } else if (userRole === 'guest') {
        router.push('/guest/welcome')
      } else {
        router.push('/dashboard')
      }
      router.refresh() // สั่ง refresh เพื่อให้ server component โหลดข้อมูลใหม่
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
          <CardDescription>
            กรุณากรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* ช่อง Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อีเมล</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@school.com"
                        {...field}
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ช่อง Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสผ่าน</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        {...field}
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* แสดง Error Message (ถ้ามี) */}
              {errorMessage && (
                <p className="text-sm font-medium text-red-500">
                  {errorMessage}
                </p>
              )}

              {/* ปุ่ม Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'กำลังโหลด...' : 'เข้าสู่ระบบ'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}