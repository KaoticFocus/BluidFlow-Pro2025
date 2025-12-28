/**
 * Password hashing utilities using native crypto
 * Uses PBKDF2 with SHA-256 for secure password hashing
 */

import { randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha256";
const SALT_LENGTH = 32;

/**
 * Hash a password with a random salt
 * Returns format: salt:hash (both hex encoded)
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Verify a password against a stored hash
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [saltHex, hashHex] = storedHash.split(":");
    if (!saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, "hex");
    const storedHashBuffer = Buffer.from(hashHex, "hex");
    
    const computedHash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
    
    return timingSafeEqual(computedHash, storedHashBuffer);
  } catch {
    return false;
  }
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Generate a session token
 */
export function generateSessionToken(): string {
  return generateToken(32);
}

/**
 * Generate an invitation token
 */
export function generateInviteToken(): string {
  return generateToken(24);
}

