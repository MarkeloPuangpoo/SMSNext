// src/app/(auth)/register/page.tsx
'use client' // 👈 ต้องเป็น Client Component

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
// (เพิ่มช่อง "ยืนยันรหัสผ่าน")
const formSchema = z
  .object({
    email: z.string().email({
      message: 'กรุณากรอกอีเมลที่ถูกต้อง',
    }),
    password: z.string().min(6, {
      message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    // กฎพิเศษสำหรับเช็คว่ารหัสผ่านตรงกัน
    message: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน',
    path: ['confirmPassword'], // ระบุว่า error นี้จะแสดงที่ช่อง confirmPassword
  })

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 2. ตั้งค่า React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  // 3. ฟังก์ชัน xử lý (handle) การ Submit ฟอร์ม
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setErrorMessage(null)
    setSuccessMessage(null)

    // 4. เรียกใช้ Supabase auth เพื่อ "สมัครสมาชิก"
    // (หมายเหตุ: นี่คือการตั้งค่าเริ่มต้นที่ต้อง "ยืนยันอีเมล")
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    })

    if (error) {
      // ถ้าสมัครไม่ผ่าน (เช่น อีเมลนี้ถูกใช้แล้ว)
      setErrorMessage(error.message)
    } else {
      // 5. ถ้าสมัครผ่าน
      setSuccessMessage(
        'การลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี'
      )
      form.reset() // เคลียร์ฟอร์ม
      // (ปกติ เราจะไม่ส่งไปหน้า dashboard ทันที แต่จะรอให้เขายืนยันอีเมลก่อน)
      // router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">สร้างบัญชีใหม่</CardTitle>
          <CardDescription>
            กรอกข้อมูลเพื่อสมัครสมาชิก
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

              {/* ช่อง Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
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

              {/* แสดง Success Message (ถ้ามี) */}
              {successMessage && (
                <p className="text-sm font-medium text-green-500">
                  {successMessage}
                </p>
              )}

              {/* ปุ่ม Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? 'กำลังสร้างบัญชี...'
                  : 'ลงทะเบียน'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}