import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const studentNumber = searchParams.get('student_number')
    const apiKey = request.headers.get('x-api-key')
    const validApiKey = process.env.API_SECRET_KEY

    if (!apiKey || apiKey !== validApiKey) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }

    if (!studentNumber) {
        return NextResponse.json(
            { error: 'Student number is required' },
            { status: 400 }
        )
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('student_number', studentNumber)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Student not found' },
                    { status: 404 }
                )
            }
            throw error
        }

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
