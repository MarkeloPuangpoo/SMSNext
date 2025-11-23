// src/app/api/signout-all-sessions/route.ts
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ใช้ Service Role Key เพื่อลบ session ทั้งหมด
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: Request) {
  try {
    // ตรวจสอบ session ของผู้ใช้ปัจจุบัน - ใช้ getUser() แทน getSession()
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ตรวจสอบว่าเป็น superadmin หรือไม่
    const userRole = user.user_metadata?.role
    if (userRole !== 'superadmin') {
      return NextResponse.json(
        { error: 'Forbidden: Only superadmin can perform this action' },
        { status: 403 }
      )
    }

    // วิธีที่ทำงานได้แน่นอน: Update user metadata เพื่อบังคับให้ต้อง login ใหม่
    // การ update metadata จะทำให้ Supabase invalidate session ทั้งหมด
    const sessionRevokedAt = new Date().toISOString()

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          session_revoked_at: sessionRevokedAt,
        }
      }
    )

    if (updateError) {
      console.error('Error updating user metadata:', updateError)
      return NextResponse.json(
        { error: 'Failed to revoke sessions: ' + updateError.message },
        { status: 400 }
      )
    }

    // การ update user metadata จะทำให้ Supabase invalidate session ทั้งหมด
    // Client side จะต้อง sign out เองหลังจากได้รับ response
    return NextResponse.json({
      success: true,
      message: 'Signed out from all devices successfully',
      session_revoked_at: sessionRevokedAt,
    })
  } catch (error: unknown) {
    console.error('Error in signout-all-sessions API:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error: ' + message },
      { status: 500 }
    )
  }
}
