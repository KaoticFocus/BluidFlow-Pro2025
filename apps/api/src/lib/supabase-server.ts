/**
 * Supabase server-side client for API
 * Used for JWT validation and user management
 */

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "../env";

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(SUPABASE_URL(), SUPABASE_SERVICE_ROLE_KEY(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdmin;
}

/**
 * Validate a Supabase JWT token and return user info
 */
export async function validateSupabaseToken(token: string) {
  const supabase = getSupabaseAdmin();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}


