import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'SchoolDB Dashboard',
  description: 'ระบบฐานข้อมูลโรงเรียน',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // 4. ลบ className ทั้งหมดออกจาก <html>
    <html lang="en">
      {/* 5. ใช้ className ของ Inter ที่ <body> ที่เดียว */}
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}