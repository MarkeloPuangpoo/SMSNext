// src/components/shared/Receipt.tsx
'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'

type ReceiptProps = {
  email: string
  password: string
  name: string
  role: 'student' | 'teacher'
  studentNumber?: string
}

export default function Receipt({ email, password, name, role, studentNumber }: ReceiptProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="receipt-container print:block">
      <div className="max-w-md mx-auto p-8 bg-white border rounded-lg shadow-sm print:shadow-none print:border-none print:max-w-full print:mx-0 print:p-4 print:block">
        {/* โลโก้และข้อมูลโรงเรียน */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-bold mb-2">
            โรงเรียนบางปะกง &#34;บวรวิทยายน&#34;
          </h1>
          <p className="text-sm mb-1">
            Bangpakong "Bowonwittayayon" School
          </p>
          <p className="text-xs text-gray-600">
            86 หมู่ 13 ตำบลบางปะกง อำเภอบางปะกง จังหวัดฉะเชิงเทรา 24130
          </p>
          <p className="text-xs text-gray-600">
            โทร. 038-531400
          </p>
        </div>

        {/* เส้นคั่น */}
        <div className="border-t-2 border-gray-800 my-6"></div>

        {/* ข้อมูลการเข้าสู่ระบบ */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4 text-center">
            ข้อมูลการเข้าสู่ระบบ
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">ชื่อ-นามสกุล</p>
              <p className="font-medium">{name}</p>
            </div>
            {studentNumber && (
              <div>
                <p className="text-sm text-gray-600">เลขนักเรียน</p>
                <p className="font-medium">{studentNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">อีเมล</p>
              <p className="font-medium">{email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">รหัสผ่าน</p>
              <p className="font-mono text-lg font-bold">{password}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ประเภทบัญชี</p>
              <p className="font-medium">{role === 'student' ? 'นักเรียน' : 'ครู'}</p>
            </div>
          </div>
        </div>

        {/* เส้นคั่น */}
        <div className="border-t-2 border-gray-800 my-6"></div>

        {/* หมายเหตุ */}
        <div className="text-xs text-gray-600 text-center">
          <p>กรุณาบันทึกข้อมูลนี้ไว้ในที่ปลอดภัย</p>
          <p>และไม่ควรเปิดเผยให้ผู้อื่นทราบ</p>
        </div>

        {/* วันที่ */}
        <div className="text-xs text-gray-500 text-center mt-4">
          <p>วันที่ออก: {new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
      </div>

      {/* ปุ่ม Print (แสดงเฉพาะบนหน้าจอ ไม่แสดงตอนพิมพ์) */}
      <div className="print:hidden flex justify-center mt-6">
        <Button onClick={handlePrint}>
          พิมพ์ใบเสร็จ
        </Button>
      </div>
    </div>
  )
}

