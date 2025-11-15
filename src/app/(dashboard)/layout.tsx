// src/app/(dashboard)/layout.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Import Sidebar component (yang akan kita buat selanjutnya)
import Sidebar from '@/components/shared/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Buat Server Client
  const supabase = await createSupabaseServerClient()

  // 2. Ambil data User yang sedang login
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. (Perlindungan tambahan) Jika tidak ada user, lempar ke halaman login
  //    (Meskipun middleware sudah melakukannya, pengecekan di sini adalah yang paling aman)
  if (!user) {
    redirect('/login')
  }

  // 4. Struktur Layout
  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900">
      {/* Sidebar: 
        Kita kirim user.email untuk ditampilkan di Sidebar
      */}
      <Sidebar userEmail={user.email} />

      {/* Area Konten Utama:
        Ini adalah tempat {children} (halaman page.tsx lainnya) akan ditampilkan
      */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}