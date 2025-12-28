import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Mock client for build time when env vars are not available
const createMockClient = () => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Build-time mock' } }),
    signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Build-time mock' } }),
    signOut: async () => ({ error: null }),
    updateUser: async () => ({ data: { user: null }, error: { message: 'Build-time mock' } }),
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
  }),
} as unknown as ReturnType<typeof createServerClient>)

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // During build time, return a mock client to allow static analysis to complete
  // This is safe because pages using Supabase should have `dynamic = 'force-dynamic'`
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase Server] Missing environment variables - returning mock client for build')
    return createMockClient()
  }
  
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
