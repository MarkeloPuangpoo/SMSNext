// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  // Use placeholders to prevent build errors if env vars are missing
  // Note: The app will not function correctly until real keys are provided
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key'

  return createBrowserClient(supabaseUrl, supabaseKey)
}