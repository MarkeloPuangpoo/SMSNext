// src/app/dashboard/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  GraduationCap,
  Users,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
  UserPlus,
  BookPlus,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import StudentsByGradeChart from '@/components/charts/StudentsByGradeChart'
import TeachersByDepartmentChart from '@/components/charts/TeachersByDepartmentChart'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  // 1. Count Students
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })

  // 2. Count Teachers
  const { count: teacherCount } = await supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true })

  // 3. Count Courses
  const { count: courseCount } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })

  // 4. Get Students by Grade
  const { data: studentsData } = await supabase
    .from('students')
    .select('grade_level')

  const studentsByGrade = studentsData?.reduce((acc: { [key: string]: number }, student) => {
    const grade = student.grade_level || 'ไม่ระบุ'
    acc[grade] = (acc[grade] || 0) + 1
    return acc
  }, {})

  const studentGradeData = Object.entries(studentsByGrade || {})
    .map(([grade_level, count]) => ({
      grade_level,
      count: count as number
    }))
    .sort((a, b) => a.grade_level.localeCompare(b.grade_level))

  // 5. Get Teachers by Department
  const { data: teachersData } = await supabase
    .from('teachers')
    .select('department')

  const teachersByDept = teachersData?.reduce((acc: { [key: string]: number }, teacher) => {
    const dept = teacher.department || 'ไม่ระบุ'
    acc[dept] = (acc[dept] || 0) + 1
    return acc
  }, {})

  const teacherDeptData = Object.entries(teachersByDept || {})
    .map(([department, count]) => ({
      department,
      count: count as number
    }))

  // 6. Count Behavior Logs
  const { count: behaviorLogsCount } = await supabase
    .from('behavior_logs')
    .select('*', { count: 'exact', head: true })

  // 7. Get Recent Students
  const { data: recentStudents } = await supabase
    .from('students')
    .select('id, first_name, last_name, grade_level, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // 8. Behavior Scores
  const { data: behaviorScores } = await supabase
    .from('students')
    .select('behavior_score')

  const goodBehaviorCount = behaviorScores?.filter(s => (s.behavior_score || 0) < 10).length || 0
  const normalBehaviorCount = behaviorScores?.filter(s => (s.behavior_score || 0) >= 10 && (s.behavior_score || 0) < 20).length || 0
  const badBehaviorCount = behaviorScores?.filter(s => (s.behavior_score || 0) >= 20).length || 0

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">ภาพรวมข้อมูลและสถิติของโรงเรียน</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/courses/new">
              <BookPlus className="w-4 h-4 mr-2" />
              เพิ่มวิชา
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/students/new">
              <UserPlus className="w-4 h-4 mr-2" />
              เพิ่มนักเรียน
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="นักเรียนทั้งหมด"
          value={studentCount ?? 0}
          subtext={`${studentGradeData.length} ชั้นเรียน`}
          icon={<GraduationCap className="w-5 h-5" />}
          link="/dashboard/students"
        />
        <StatsCard
          title="ครูทั้งหมด"
          value={teacherCount ?? 0}
          subtext={`${teacherDeptData.length} แผนก`}
          icon={<Users className="w-5 h-5" />}
          link="/dashboard/teachers"
        />
        <StatsCard
          title="วิชาทั้งหมด"
          value={courseCount ?? 0}
          subtext="ทุกระดับชั้น"
          icon={<BookOpen className="w-5 h-5" />}
          link="/dashboard/courses"
        />
        <StatsCard
          title="บันทึกพฤติกรรม"
          value={behaviorLogsCount ?? 0}
          subtext="รายการทั้งหมด"
          icon={<Award className="w-5 h-5" />}
          link="/dashboard/behavior"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>นักเรียนแต่ละชั้น</CardTitle>
              <CardDescription>การกระจายตัวของนักเรียนในแต่ละระดับชั้น</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <StudentsByGradeChart data={studentGradeData} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ครูแต่ละแผนก</CardTitle>
              <CardDescription>การกระจายตัวของครูในแต่ละแผนกวิชา</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <TeachersByDepartmentChart data={teacherDeptData} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Behavior Stats */}
          <Card>
            <CardHeader>
              <CardTitle>สถิติพฤติกรรม</CardTitle>
              <CardDescription>คะแนนความประพฤติของนักเรียน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BehaviorStatItem
                label="พฤติกรรมดี"
                count={goodBehaviorCount}
                desc="คะแนน 0-9"
                icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
              />
              <BehaviorStatItem
                label="พฤติกรรมปานกลาง"
                count={normalBehaviorCount}
                desc="คะแนน 10-19"
                icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
              />
              <BehaviorStatItem
                label="พฤติกรรมไม่ดี"
                count={badBehaviorCount}
                desc="คะแนน 20+"
                icon={<XCircle className="w-5 h-5 text-red-500" />}
              />
            </CardContent>
          </Card>

          {/* Recent Students */}
          <Card>
            <CardHeader>
              <CardTitle>นักเรียนใหม่ล่าสุด</CardTitle>
              <CardDescription>5 คนล่าสุดที่เข้าระบบ</CardDescription>
            </CardHeader>
            <CardContent>
              {!recentStudents || recentStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">ยังไม่มีนักเรียนใหม่</p>
              ) : (
                <div className="space-y-4">
                  {recentStudents.map((student) => (
                    <div key={student.id} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                        {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ชั้น {student.grade_level}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                        New
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, subtext, icon, link }: { title: string, value: number, subtext: string, icon: React.ReactNode, link: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-muted-foreground bg-secondary p-2 rounded-md">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline justify-between pt-2">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          </div>
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href={link}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function BehaviorStatItem({ label, count, desc, icon }: { label: string, count: number, desc: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <span className="text-lg font-bold">{count}</span>
    </div>
  )
}
