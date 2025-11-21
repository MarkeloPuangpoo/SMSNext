// src/app/(auth)/register/page.tsx
'use client'

//
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
import { Mail, Lock, UserPlus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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
    message: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน',
    path: ['confirmPassword'],
  })

export default function RegisterPage() {
  const supabase = createSupabaseBrowserClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setErrorMessage(null)
    setSuccessMessage(null)

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setErrorMessage(error.message)
    } else {
      setSuccessMessage(
        'การลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี'
      )
      form.reset()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-4 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl">
          <CardHeader className="space-y-4 pb-6 text-center">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 flex items-center justify-center shadow-xl">
                  <UserPlus className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                สมัครสมาชิก
              </CardTitle>
              <CardDescription className="text-base md:text-lg">
                โรงเรียนบางปะกง &#34;บวรวิทยายน&#34;
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-indigo-600" />
                        อีเมล
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="you@bbv.ac.th"
                            {...field}
                            type="email"
                            className="h-12 pl-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200"
                            aria-label="อีเมล"
                          />
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4 text-indigo-600" />
                        รหัสผ่าน
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            {...field}
                            type="password"
                            className="h-12 pl-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200"
                            aria-label="รหัสผ่าน"
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        ยืนยันรหัสผ่าน
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          {...field}
                          type="password"
                          className="h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200"
                          aria-label="ยืนยันรหัสผ่าน"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMessage && (
                  <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4">
                    <p className="text-sm font-medium text-red-700">
                      {errorMessage}
                    </p>
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4">
                    <p className="text-sm font-medium text-green-700">
                      {successMessage}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-700 hover:via-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังสร้างบัญชี...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      สมัครสมาชิก
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    มีบัญชีอยู่แล้ว?{' '}
                    <Link
                      href="/login"
                      className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors underline-offset-4 hover:underline"
                    >
                      เข้าสู่ระบบ
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            © 2024 โรงเรียนบางปะกง &#34;บวรวิทยายน&#34;
          </p>
        </div>
      </div>
    </div>
  )
}
