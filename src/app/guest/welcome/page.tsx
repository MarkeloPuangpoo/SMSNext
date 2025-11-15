// src/app/guest/welcome/page.tsx
'use client'

// เราจะ import ปุ่ม Logout มาจาก components/shared ที่คุณมีอยู่
import LogoutButton from '@/components/shared/LogoutButton' 

export default function GuestWelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        
        {/* โลโก้ (ถ้าต้องการ) */}
        {/* <Image src="/logo.png" alt="Logo" width={120} height={120} /> */}
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">
          ยินดีต้อนรับสู่โรงเรียนบางปะกง"บวรวิทยายน"
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
          บัญชีของคุณกำลังรอการตรวจสอบและอนุมัติจากผู้ดูแลระบบ
        </p>

        <div className="mt-8 w-full max-w-xs">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}

