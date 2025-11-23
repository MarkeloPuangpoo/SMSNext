// src/app/dashboard/behavior/page.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  Search,
  Plus,
  Award,
  TrendingUp,
  TrendingDown,
  History,
  Calendar,
  FileText
} from 'lucide-react'
import { Input } from "@/components/ui/input"

type BehaviorLog = {
  id: string
  student: {
    id: string
    first_name: string
    last_name: string
    student_number: string | null
    grade_level: string
    behavior_score: number | null
  }
  behavior_type: 'good' | 'bad'
  points: number
  description: string
  recorded_by: string | null
  created_at: string
}

export default async function BehaviorPage() {
  const supabase = await createSupabaseServerClient()

  const { data: behaviorLogs, error } = await supabase
    .from('behavior_logs')
    .select(`
      id,
      behavior_type,
      points,
      description,
      recorded_by,
      created_at,
      student:students (
        id,
        first_name,
        last_name,
        student_number,
        grade_level,
        behavior_score
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching behavior logs:', error)
  }

  // Calculate statistics
  const totalLogs = behaviorLogs?.length || 0
  const goodBehaviors = behaviorLogs?.filter(log => log.behavior_type === 'good').length || 0
  const badBehaviors = behaviorLogs?.filter(log => log.behavior_type === 'bad').length || 0
  const totalPoints = behaviorLogs?.reduce((sum, log) => sum + log.points, 0) || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการพฤติกรรม</h1>
          <p className="text-muted-foreground mt-1">บันทึกและติดตามพฤติกรรมของนักเรียน</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/behavior/new" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            บันทึกพฤติกรรมใหม่
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="บันทึกทั้งหมด"
          value={totalLogs}
          icon={<FileText className="w-5 h-5" />}
        />
        <StatsCard
          title="พฤติกรรมดี"
          value={goodBehaviors}
          icon={<TrendingDown className="w-5 h-5" />}
        />
        <StatsCard
          title="พฤติกรรมไม่ดี"
          value={badBehaviors}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatsCard
          title="คะแนนรวม"
          value={totalPoints}
          icon={<Award className="w-5 h-5" />}
        />
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <History className="w-5 h-5" />
              ประวัติพฤติกรรมล่าสุด
            </CardTitle>
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ค้นหาพฤติกรรม..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>วันที่</TableHead>
                  <TableHead>นักเรียน</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>คะแนน</TableHead>
                  <TableHead className="hidden md:table-cell">รายละเอียด</TableHead>
                  <TableHead className="hidden lg:table-cell">คะแนนรวม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!behaviorLogs || behaviorLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      ไม่พบข้อมูลพฤติกรรม
                    </TableCell>
                  </TableRow>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  behaviorLogs.map((log: any) => {
                    const student = log.student as BehaviorLog['student']
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(log.created_at).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                              {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.student_number || '-'} | {student.grade_level}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.behavior_type === 'good' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              พฤติกรรมดี
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              พฤติกรรมไม่ดี
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${log.points > 0 ? 'text-red-600' : 'text-emerald-600'
                            }`}>
                            {log.points > 0 ? '+' : ''}{log.points}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs">
                          <div className="truncate" title={log.description}>
                            {log.description}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Link href={`/dashboard/behavior/${student.id}`}>
                            <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                              <Award className={`w-4 h-4 ${(student.behavior_score || 0) === 0 ? 'text-muted-foreground' :
                                (student.behavior_score || 0) < 10 ? 'text-emerald-500' :
                                  (student.behavior_score || 0) < 20 ? 'text-amber-500' : 'text-red-500'
                                }`} />
                              <span className={`font-semibold ${(student.behavior_score || 0) === 0 ? 'text-muted-foreground' :
                                (student.behavior_score || 0) < 10 ? 'text-emerald-600' :
                                  (student.behavior_score || 0) < 20 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                {student.behavior_score || 0}
                              </span>
                            </div>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
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
