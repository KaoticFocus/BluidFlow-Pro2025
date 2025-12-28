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

