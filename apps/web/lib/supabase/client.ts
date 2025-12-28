import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please create apps/web/.env.local with:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=https://xppnphkaeczptxuhmpuv.supabase.co\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key'
    )
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

