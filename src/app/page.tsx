// src/app/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  ArrowRight,
  School,
  Sparkles
} from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Navbar (Simple) */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <School className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">SchoolDB</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild variant="default" size="sm" className="rounded-full px-6">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">เข้าสู่ระบบ</Link>
                </Button>
                <Button asChild variant="default" size="sm" className="rounded-full px-6">
                  <Link href="/register">สมัครสมาชิก</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 container mx-auto px-4 md:px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>ระบบบริหารจัดการโรงเรียนยุคใหม่</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground text-balance">
              จัดการโรงเรียนของคุณ<br />
              <span className="text-muted-foreground">ได้อย่างมีประสิทธิภาพ</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              SchoolDB ช่วยให้การจัดการข้อมูลนักเรียน ครู และตารางเรียนเป็นเรื่องง่าย
              ด้วยดีไซน์ที่เรียบง่ายและทันสมัย
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              {user ? (
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 h-12 text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <Link href="/dashboard" className="flex items-center gap-2">
                    ไปที่ Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 h-12 text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <Link href="/login" className="flex items-center gap-2">
                    เริ่มต้นใช้งานฟรี
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<GraduationCap className="w-6 h-6" />}
                title="จัดการนักเรียน"
                description="ระบบจัดการข้อมูลนักเรียนที่ครบถ้วน ติดตามผลการเรียนและพฤติกรรม"
              />
              <FeatureCard
                icon={<BookOpen className="w-6 h-6" />}
                title="จัดการครู"
                description="ระบบจัดการข้อมูลครู แผนกวิชา และภาระงานสอน"
              />
              <FeatureCard
                icon={<Users className="w-6 h-6" />}
                title="จัดการวิชา"
                description="บริหารจัดการรายวิชา หลักสูตร และตารางเรียนได้อย่างง่ายดาย"
              />
              <FeatureCard
                icon={<Award className="w-6 h-6" />}
                title="รายงานสถิติ"
                description="ดูภาพรวมและสถิติสำคัญผ่าน Dashboard ที่สวยงามและเข้าใจง่าย"
              />
            </div>
          </div>
        </section>

        {/* School Info */}
        <section className="py-20 container mx-auto px-4 md:px-6 text-center">
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-secondary/20 border border-border/50">
            <School className="w-12 h-12 mx-auto mb-6 text-primary" />
            <h2 className="text-2xl font-bold mb-2">โรงเรียนบางปะกง "บวรวิทยายน"</h2>
            <p className="text-muted-foreground font-medium mb-4">Bangpakong "Bowonwittayayon" School</p>
            <p className="text-muted-foreground text-sm">
              86 หมู่ 13 ตำบลบางปะกง อำเภอบางปะกง จังหวัดฉะเชิงเทรา 24130<br />
              โทร. 038-531400
            </p>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          © {new Date().getFullYear()} SchoolDB. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-none bg-background hover:bg-white hover:shadow-lg transition-all duration-300 rounded-2xl">
      <CardContent className="pt-6">
        <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}
