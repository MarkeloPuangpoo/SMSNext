// src/app/dashboard/behavior/[studentId]/page.tsx
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
  ArrowLeft, 
  User,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  FileText
} from 'lucide-react'
import EditScoreButton from './EditScoreButton'

type BehaviorLog = {
  id: string
  behavior_type: 'good' | 'bad'
  points: number
  description: string
  created_at: string
  recorded_by: string | null
}

type Student = {
  id: string
  first_name: string
  last_name: string
  student_number: string | null
  grade_level: string
  behavior_score: number | null
}

export default async function StudentBehaviorHistoryPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { studentId } = await params

  // ดึงข้อมูลนักเรียน
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, first_name, last_name, student_number, grade_level, behavior_score')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">ไม่พบข้อมูลนักเรียน</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/behavior">กลับไปหน้ารายการ</Link>
          </Button>
        </div>
      </div>
    )
  }

  // ดึงประวัติพฤติกรรม
  const { data: behaviorLogs, error } = await supabase
    .from('behavior_logs')
    .select('id, behavior_type, points, description, created_at, recorded_by')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching behavior logs:', error)
  }

  // Calculate statistics
  const totalLogs = behaviorLogs?.length || 0
  const goodBehaviors = behaviorLogs?.filter(log => log.behavior_type === 'good').length || 0
  const badBehaviors = behaviorLogs?.filter(log => log.behavior_type === 'bad').length || 0
  const totalPoints = behaviorLogs?.reduce((sum, log) => sum + log.points, 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hover:bg-indigo-50">
              <Link href="/dashboard/behavior" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                ประวัติพฤติกรรม
              </h1>
              <p className="text-gray-600 mt-1">
                {student.first_name} {student.last_name}
                {student.student_number && ` (${student.student_number})`}
                {' '}- {student.grade_level}
              </p>
            </div>
          </div>
        </div>

        {/* Student Info Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 flex items-center justify-center text-white font-bold text-xl">
                  {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {student.first_name} {student.last_name}
                  </CardTitle>
                  <p className="text-gray-600">
                    เลขนักเรียน: {student.student_number || '-'} | ชั้น: {student.grade_level}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">คะแนนความประพฤติ</p>
                <div className="flex items-center gap-2 justify-end mb-2">
                  <Award className={`w-8 h-8 ${
                    (student.behavior_score || 0) === 0 ? 'text-gray-400' :
                    (student.behavior_score || 0) < 10 ? 'text-emerald-500' :
                    (student.behavior_score || 0) < 20 ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                  <span className={`text-4xl font-bold ${
                    (student.behavior_score || 0) === 0 ? 'text-gray-600' :
                    (student.behavior_score || 0) < 10 ? 'text-emerald-600' :
                    (student.behavior_score || 0) < 20 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {student.behavior_score || 0}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <EditScoreButton 
                    studentId={student.id}
                    currentScore={student.behavior_score || 0}
                    studentName={`${student.first_name} ${student.last_name}`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">คะแนนต่ำ = ดี, คะแนนสูง = แย่</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium mb-1">บันทึกทั้งหมด</p>
                  <p className="text-3xl font-bold">{totalLogs}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">พฤติกรรมดี</p>
                  <p className="text-3xl font-bold">{goodBehaviors}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">พฤติกรรมไม่ดี</p>
                  <p className="text-3xl font-bold">{badBehaviors}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">คะแนนรวม</p>
                  <p className="text-3xl font-bold">{totalPoints}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              ประวัติพฤติกรรมทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50">
                    <TableHead className="font-semibold text-gray-700">วันที่/เวลา</TableHead>
                    <TableHead className="font-semibold text-gray-700">ประเภท</TableHead>
                    <TableHead className="font-semibold text-gray-700">คะแนน</TableHead>
                    <TableHead className="font-semibold text-gray-700">รายละเอียด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!behaviorLogs || behaviorLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <FileText className="w-16 h-16 text-gray-300 mb-4" />
                          <p className="text-gray-500">ยังไม่มีบันทึกพฤติกรรม</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    behaviorLogs.map((log: BehaviorLog) => (
                      <TableRow 
                        key={log.id} 
                        className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-blue-50/50 transition-colors border-b border-gray-100"
                      >
                        <TableCell className="text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
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
                          {log.behavior_type === 'good' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              พฤติกรรมดี
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              พฤติกรรมไม่ดี
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold text-lg ${
                            log.points > 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {log.points > 0 ? '+' : ''}{log.points}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {log.description}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

