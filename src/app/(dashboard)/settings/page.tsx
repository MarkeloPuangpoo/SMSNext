// src/app/(dashboard)/settings/page.tsx
'use client'

import { useRouter } from 'next/navigation'
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
import {
  LogOut,
  Shield,
  Key,
  Settings as SettingsIcon,
  User,
  Mail,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Lock
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const passwordFormSchema = z
  .object({
    password: z.string().min(6, {
      message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร',
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน',
    path: ['confirmPassword'],
  })

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [signingOutAll, setSigningOutAll] = useState(false)

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserRole(user.user_metadata?.role || null)
        setUserEmail(user.email || '')
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')
      }
    }
    getUserData()
  }, [supabase])

  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: z.infer<typeof passwordFormSchema>) {
    setMessage(null)

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      console.error('Error updating password:', error)
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ!' })
      form.reset()
    }
  }

  async function handleSignOutAllSessions() {
    setSigningOutAll(true)
    setMessage(null)

    try {
      const response = await fetch('/api/signout-all-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาด' })
        setSigningOutAll(false)
        return
      }

      setMessage({ type: 'success', text: 'ออกจาก session ทุกอุปกรณ์สำเร็จ! กำลังออกจากระบบ...' })

      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error('Error signing out all sessions:', error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการออกจาก session' })
      setSigningOutAll(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-8 h-8" />
          ตั้งค่า
        </h1>
        <p className="text-muted-foreground mt-2 ml-1">
          จัดการการตั้งค่าบัญชีและความปลอดภัยของคุณ
        </p>
      </div>

      {/* User Profile Card */}
      <Card>
        <div className="h-32 bg-secondary/30 relative">
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-background flex items-center justify-center text-3xl font-bold shadow-sm border-4 border-background">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-background"></div>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-6 px-6">
          <h2 className="text-2xl font-bold mb-1">{userName}</h2>
          <p className="text-muted-foreground flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4" />
            {userEmail}
          </p>
          {userRole && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <Sparkles className="w-3 h-3" />
              <span>
                {userRole === 'superadmin' ? 'ผู้ดูแลระบบ' :
                  userRole === 'teacher' ? 'ครู' :
                    userRole === 'student' ? 'นักเรียน' : userRole}
              </span>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
                <CardDescription>อัปเดตรหัสผ่านของคุณเพื่อความปลอดภัย</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                {message && (
                  <div className={`p-3 rounded-lg flex items-start gap-3 ${message.type === 'error'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-emerald-50 text-emerald-600'
                    }`} role="alert">
                    {message.type === 'error' ? (
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <p className="text-sm font-medium">
                      {message.text}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full"
                >
                  {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Security Card (Superadmin only) */}
        {userRole === 'superadmin' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>การจัดการ Session</CardTitle>
                  <CardDescription>จัดการ session ของคุณในทุกอุปกรณ์</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-900 mb-1">คำเตือน</h4>
                      <p className="text-sm text-amber-800">
                        การออกจาก session ทุกอุปกรณ์จะทำให้คุณต้องเข้าสู่ระบบใหม่ในทุกอุปกรณ์
                      </p>
                    </div>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={signingOutAll}
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {signingOutAll ? 'กำลังออกจากระบบ...' : 'ออกจาก Session ทุกอุปกรณ์'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>ยืนยันการออกจาก Session</AlertDialogTitle>
                      <AlertDialogDescription>
                        คุณแน่ใจหรือไม่ว่าต้องการออกจาก session ทุกอุปกรณ์?
                        การกระทำนี้จะทำให้คุณต้องเข้าสู่ระบบใหม่ในทุกอุปกรณ์ที่คุณใช้อยู่
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSignOutAllSessions}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        ยืนยันและออกจากระบบ
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
              <User className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>ข้อมูลบัญชี</CardTitle>
              <CardDescription>ข้อมูลพื้นฐานของบัญชีของคุณ</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
              <div className="p-2 rounded-md bg-secondary">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">ชื่อผู้ใช้</p>
                <p className="font-medium">{userName}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
              <div className="p-2 rounded-md bg-secondary">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">อีเมล</p>
                <p className="font-medium break-all">{userEmail}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
              <div className="p-2 rounded-md bg-secondary">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">บทบาท</p>
                <p className="font-medium">
                  {userRole === 'superadmin' ? 'ผู้ดูแลระบบ' :
                    userRole === 'teacher' ? 'ครู' :
                      userRole === 'student' ? 'นักเรียน' :
                        userRole || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
              <div className="p-2 rounded-md bg-emerald-50 text-emerald-600">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">สถานะบัญชี</p>
                <p className="font-medium text-emerald-600">Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
