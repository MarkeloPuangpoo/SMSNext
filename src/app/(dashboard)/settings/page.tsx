// src/app/(dashboard)/settings/page.tsx
'use client' // 👈 สำคัญมาก! ต้องเป็น Client Component

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

// 1. สร้าง Schema สำหรับ Validate การเปลี่ยนรหัสผ่าน
const passwordFormSchema = z
  .object({
    password: z.string().min(6, {
      message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร',
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    // กฎพิเศษสำหรับเช็คว่ารหัสผ่านตรงกัน
    message: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน',
    path: ['confirmPassword'], // ระบุว่า error นี้จะแสดงที่ช่อง confirmPassword
  })

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient() // สร้าง client
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 2. ตั้งค่า React Hook Form
  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // 3. ฟังก์ชัน xử lý (handle) การ Submit ฟอร์ม
  async function onSubmit(values: z.infer<typeof passwordFormSchema>) {
    setMessage(null) // เคลียร์ message เก่า

    // 4. เรียกใช้ Supabase auth เพื่อ "อัปเดต" รหัสผ่าน
    const { error } = await supabase.auth.updateUser({
      password: values.password, // ส่งรหัสผ่านใหม่เข้าไป
    })

    if (error) {
      // ถ้าอัปเดตไม่สำเร็จ
      console.error('Error updating password:', error)
      setMessage({ type: 'error', text: error.message })
    } else {
      // 5. ถ้าอัปเดตสำเร็จ
      setMessage({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ!' })
      form.reset() // เคลียร์ฟอร์ม
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Card className="mt-6 max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">เปลี่ยนรหัสผ่าน</CardTitle>
          <CardDescription>
            กรอกรหัสผ่านใหม่ของคุณที่นี่
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* ช่อง รหัสผ่านใหม่ */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสผ่านใหม่</FormLabel>
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

              {/* ช่อง ยืนยันรหัสผ่านใหม่ */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ยืนยันรหัสผ่านใหม่</FormLabel>
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

              {/* แสดง Message (Success หรือ Error) */}
              {message && (
                <p className={`text-sm font-medium ${
                  message.type === 'error' ? 'text-red-500' : 'text-green-500'
                }`}>
                  {message.text}
                </p>
              )}

              {/* ปุ่ม Submit */}
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}