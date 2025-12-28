/**
 * Slug generation utilities
 */

/**
 * Generate a URL-safe slug from a string
 */
export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a random suffix
 */
export function generateUniqueSlug(input: string): string {
  const baseSlug = generateSlug(input);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${suffix}`;
}

/**
 * Validate a slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 63;
}

