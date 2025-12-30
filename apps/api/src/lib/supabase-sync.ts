/**
 * Supabase Auth to Prisma User synchronization
 * Ensures Supabase Auth users are mirrored in Prisma User table
 */

import { prisma } from "./prisma";

/**
 * Sync or create a Prisma User from Supabase Auth user
 * Called whenever we need to ensure a Supabase user exists in Prisma
 */
export async function syncUserFromSupabase(
  supabaseUserId: string,
  email: string,
  name?: string | null,
  emailVerified: boolean = false
) {
  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Create new user - note: Supabase handles password, so passwordHash is null
    user = await prisma.user.create({
      data: {
        id: supabaseUserId, // Use Supabase user ID
        email,
        name: name || null,
        emailVerified,
        passwordHash: null, // Supabase handles passwords
        status: "active",
      },
    });
  } else {
    // Update existing user if needed
    if (user.id !== supabaseUserId) {
      // If IDs don't match, update the ID (shouldn't happen, but handle it)
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          id: supabaseUserId,
          emailVerified,
          name: name || user.name,
        },
      });
    } else {
      // Update email verification status and name if changed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified,
          name: name || user.name,
        },
      });
    }
  }

  return user;
}

/**
 * Get or create a user from Supabase Auth data
 */
export async function getOrCreateUserFromSupabase(
  supabaseUser: { id: string; email?: string; user_metadata?: { name?: string } }
) {
  if (!supabaseUser.email) {
    throw new Error("Supabase user must have an email");
  }

  return syncUserFromSupabase(
    supabaseUser.id,
    supabaseUser.email,
    supabaseUser.user_metadata?.name,
    true // Assume verified if coming from Supabase Auth
  );
}


