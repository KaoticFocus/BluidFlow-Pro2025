declare const process: { env: Record<string, string | undefined> };

function readEnv(name: string): string | undefined {
  return process?.env?.[name];
}

export function requireEnv(name: string): string {
  const v = readEnv(name);
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

// Use this in future OpenAI integrations (packages/ai or API routes/jobs).
export const OPENAI_API_KEY = () => requireEnv("OPENAI_API_KEY");

// Supabase configuration
export const SUPABASE_URL = () => requireEnv("SUPABASE_URL");
export const SUPABASE_SERVICE_ROLE_KEY = () => requireEnv("SUPABASE_SERVICE_ROLE_KEY");
export const SUPABASE_ANON_KEY = () => requireEnv("SUPABASE_ANON_KEY");

