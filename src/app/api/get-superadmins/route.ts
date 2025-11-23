// src/app/api/get-superadmins/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get all users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter superadmins
    const superadmins = users
      .filter(u => u.user_metadata?.role === 'superadmin')
      .map(u => ({
        id: u.id,
        email: u.email || '',
        first_name: u.user_metadata?.first_name || u.email?.split('@')[0] || 'Admin',
        last_name: u.user_metadata?.last_name || '',
        role: 'superadmin'
      }))

    return NextResponse.json({ superadmins })
  } catch (error: unknown) {
    console.error('Error getting superadmins:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

