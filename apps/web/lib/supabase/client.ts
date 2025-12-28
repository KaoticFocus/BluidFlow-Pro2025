import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return cached client if available
  if (client) return client
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set:\n' +
      'NEXT_PUBLIC_SUPABASE_URL\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }
  
  client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}
