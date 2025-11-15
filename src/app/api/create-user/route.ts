// src/app/api/create-user/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ใช้ Service Role Key เพื่อสร้าง user ได้ (ต้องเก็บใน environment variable)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // 👈 Service Role Key (ไม่ใช่ anon key)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, userMetadata } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // สร้าง user account ใหม่
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // ยืนยันอีเมลอัตโนมัติ
      user_metadata: userMetadata || {},
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })
  } catch (error) {
    console.error('Error in create-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

