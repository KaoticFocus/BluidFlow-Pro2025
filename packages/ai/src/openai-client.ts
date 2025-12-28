/**
 * OpenAI client wrapper with cost tracking and error handling
 */

import OpenAI from "openai";
import { AIRequestContext, AIResponseMetadata, calculateCost } from "./types";

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Chat completion request options
 */
export interface ChatCompletionOptions {
  model?: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" | "text" };
  context?: AIRequestContext;
}

/**
 * Chat completion result
 */
export interface ChatCompletionResult {
  content: string;
  metadata: AIResponseMetadata;
}

/**
 * Execute a chat completion request
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const client = getOpenAIClient();
  const model = options.model || "gpt-4o";
  const startTime = Date.now();

  try {
    const response = await client.chat.completions.create({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens,
      response_format: options.responseFormat,
    });

    const latencyMs = Date.now() - startTime;
    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    const metadata: AIResponseMetadata = {
      model,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      latencyMs,
      estimatedCostUsd: calculateCost(model, usage.prompt_tokens, usage.completion_tokens),
    };

    return {
      content: response.choices[0]?.message?.content || "",
      metadata,
    };
  } catch (error) {
    // Log and rethrow with context
    console.error("OpenAI chat completion error:", error);
    throw error;
  }
}

/**
 * JSON mode chat completion with type parsing
 */
export async function jsonCompletion<T>(
  options: Omit<ChatCompletionOptions, "responseFormat">
): Promise<{ data: T; metadata: AIResponseMetadata }> {
  const result = await chatCompletion({
    ...options,
    responseFormat: { type: "json_object" },
  });

  try {
    const data = JSON.parse(result.content) as T;
    return { data, metadata: result.metadata };
  } catch (error) {
    console.error("Failed to parse JSON response:", result.content);
    throw new Error("Invalid JSON response from OpenAI");
  }
}

/**
 * Structured output with Zod schema validation
 */
export async function structuredOutput<T>(
  options: ChatCompletionOptions & { schema: { parse: (data: unknown) => T } }
): Promise<{ data: T; metadata: AIResponseMetadata }> {
  const result = await jsonCompletion<unknown>(options);
  
  try {
    const data = options.schema.parse(result.data);
    return { data, metadata: result.metadata };
  } catch (error) {
    console.error("Schema validation failed:", error);
    throw new Error("Response does not match expected schema");
  }
}

