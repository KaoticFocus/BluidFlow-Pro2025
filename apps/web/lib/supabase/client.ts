import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

// Mock client for build time or when env vars are missing
const createMockClient = () => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
    signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
    signOut: async () => ({ error: null }),
    updateUser: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
  }),
} as unknown as ReturnType<typeof createBrowserClient>)

export function createClient() {
  // Return cached client if available
  if (client) return client
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // During build time or if env vars are missing, return mock client
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase Client] Missing environment variables - returning mock client')
    return createMockClient()
  }
  
  client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}
