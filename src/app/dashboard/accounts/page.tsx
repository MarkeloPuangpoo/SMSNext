// src/app/dashboard/accounts/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Shield,
  Search,
  Key,
  User,
  GraduationCap,
  Users,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'

type Account = {
  id: string
  email: string
  role: 'student' | 'teacher' | 'superadmin'
  created_at: string
  last_sign_in_at: string | null
  user_metadata: {
    first_name?: string
    last_name?: string
    role?: string
  }
}

export default function AccountsPage() {
  const supabase = createSupabaseBrowserClient()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [resettingPassword, setResettingPassword] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    filterAccounts()
  }, [searchQuery, filterRole, accounts])

  async function loadAccounts() {
    setLoading(true)

    // ดึงข้อมูล students
    const { data: students } = await supabase
      .from('students')
      .select('user_id, first_name, last_name, created_at')

    // ดึงข้อมูล teachers
    const { data: teachers } = await supabase
      .from('teachers')
      .select('user_id, first_name, last_name, created_at')

    // สร้าง map ของ user_id -> user data
    const usersMap = new Map()

    students?.forEach(s => {
      if (s.user_id) {
        usersMap.set(s.user_id, {
          first_name: s.first_name,
          last_name: s.last_name,
          role: 'student',
          created_at: s.created_at
        })
      }
    })

    teachers?.forEach(t => {
      if (t.user_id) {
        usersMap.set(t.user_id, {
          first_name: t.first_name,
          last_name: t.last_name,
          role: 'teacher',
          created_at: t.created_at
        })
      }
    })

    // แปลง Map เป็น array
    const accountsList: Account[] = Array.from(usersMap.entries()).map(([userId, userData]) => ({
      id: userId,
      email: '', // จะต้องดึงจาก auth ซึ่งต้องใช้ admin API
      role: userData.role,
      created_at: userData.created_at,
      last_sign_in_at: null,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role
      }
    }))

    setAccounts(accountsList)
    setLoading(false)
  }

  function filterAccounts() {
    let filtered = accounts

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(acc => acc.role === filterRole)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(acc => {
        const fullName = `${acc.user_metadata.first_name} ${acc.user_metadata.last_name}`.toLowerCase()
        const email = acc.email.toLowerCase()
        const query = searchQuery.toLowerCase()
        return fullName.includes(query) || email.includes(query)
      })
    }

    setFilteredAccounts(filtered)
  }

  async function handleResetPassword(userId: string) {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
      return
    }

    setResettingPassword(userId)
    setMessage(null)

    try {
      // ใช้ Supabase Admin API เพื่อ reset password
      const response = await fetch('/api/reset-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาด')
      }

      setMessage({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ!' })
      setNewPassword('')
      setSelectedAccount(null)
    } catch (error: any) {
      console.error('Error resetting password:', error)
      setMessage({ type: 'error', text: error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' })
    } finally {
      setResettingPassword(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">จัดการบัญชี</h1>
        <p className="text-muted-foreground mt-1">
          จัดการบัญชีผู้ใช้ทั้งหมด และรีเซ็ตรหัสผ่าน
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="บัญชีทั้งหมด"
          value={accounts.length}
          icon={<Shield className="w-5 h-5" />}
        />
        <StatsCard
          title="นักเรียน"
          value={accounts.filter(a => a.role === 'student').length}
          icon={<GraduationCap className="w-5 h-5" />}
        />
        <StatsCard
          title="ครู"
          value={accounts.filter(a => a.role === 'teacher').length}
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <CardTitle className="text-xl">รายการบัญชีทั้งหมด</CardTitle>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ค้นหาชื่อหรืออีเมล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterRole === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRole('all')}
              >
                ทั้งหมด
              </Button>
              <Button
                variant={filterRole === 'student' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRole('student')}
              >
                <GraduationCap className="w-4 h-4 mr-1" />
                นักเรียน
              </Button>
              <Button
                variant={filterRole === 'teacher' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRole('teacher')}
              >
                <Users className="w-4 h-4 mr-1" />
                ครู
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {message && (
            <div className={`m-6 p-4 rounded-lg flex items-start gap-3 ${message.type === 'error'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-emerald-50 text-emerald-600'
              }`}>
              {message.type === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-medium">
                {message.text}
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>ผู้ใช้</TableHead>
                    <TableHead>บทบาท</TableHead>
                    <TableHead className="hidden md:table-cell">วันที่สร้าง</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        ไม่พบบัญชีผู้ใช้
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                              {account.user_metadata.first_name?.charAt(0)}{account.user_metadata.last_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {account.user_metadata.first_name} {account.user_metadata.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">{account.id.substring(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${account.role === 'student'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-purple-50 text-purple-700'
                            }`}>
                            {account.role === 'student' ? (
                              <>
                                <GraduationCap className="w-3 h-3 mr-1" />
                                นักเรียน
                              </>
                            ) : (
                              <>
                                <Users className="w-3 h-3 mr-1" />
                                ครู
                              </>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {new Date(account.created_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAccount(account)
                                  setNewPassword('')
                                  setMessage(null)
                                }}
                              >
                                <Key className="w-4 h-4 mr-2" />
                                รีเซ็ตรหัสผ่าน
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>รีเซ็ตรหัสผ่าน</DialogTitle>
                                <DialogDescription>
                                  รีเซ็ตรหัสผ่านสำหรับ{' '}
                                  <span className="font-semibold text-foreground">
                                    {selectedAccount?.user_metadata.first_name} {selectedAccount?.user_metadata.last_name}
                                  </span>
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
                                  <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="mt-2"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAccount(null)
                                    setNewPassword('')
                                    setMessage(null)
                                  }}
                                >
                                  ยกเลิก
                                </Button>
                                <Button
                                  onClick={() => selectedAccount && handleResetPassword(selectedAccount.id)}
                                  disabled={!newPassword || resettingPassword === selectedAccount?.id}
                                >
                                  {resettingPassword === selectedAccount?.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      กำลังรีเซ็ต...
                                    </>
                                  ) : (
                                    'ยืนยัน'
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-muted-foreground bg-secondary p-2 rounded-md">
            {icon}
          </div>
        </div>
        <div className="pt-2">
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}
