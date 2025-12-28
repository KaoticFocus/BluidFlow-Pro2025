/**
 * Core AI types used across all AI operations
 */

export interface AIRequestContext {
  tenantId: string;
  userId?: string;
  traceId?: string;
  correlationId?: string;
}

export interface AIResponseMetadata {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  estimatedCostUsd: number;
}

export interface AIResult<T> {
  data: T;
  metadata: AIResponseMetadata;
  citations?: Citation[];
  piiDetected?: boolean;
  redactionSummary?: RedactionSummary;
}

export interface Citation {
  sourceId: string;
  sourceType: "document" | "transcript" | "record";
  snippet: string;
  confidence: number;
  location?: string;
}

export interface RedactionSummary {
  fieldsRedacted: string[];
  piiTypes: PIIType[];
  originalHash?: string;
}

export type PIIType = 
  | "email"
  | "phone"
  | "ssn"
  | "credit_card"
  | "address"
  | "name"
  | "date_of_birth"
  | "driver_license"
  | "passport"
  | "ip_address";

// Model pricing (per 1K tokens)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.005, output: 0.015 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4-turbo": { input: 0.01, output: 0.03 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "whisper-1": { input: 0.006, output: 0 }, // per minute
};

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  
  const inputCost = (promptTokens / 1000) * pricing.input;
  const outputCost = (completionTokens / 1000) * pricing.output;
  
  return inputCost + outputCost;
}

export function calculateWhisperCost(durationSeconds: number): number {
  const minutes = durationSeconds / 60;
  return minutes * MODEL_PRICING["whisper-1"].input;
}

