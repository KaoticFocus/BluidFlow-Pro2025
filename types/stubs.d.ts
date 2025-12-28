/**
 * TypeScript stubs for packages without proper type definitions.
 * React, Next.js, and other packages with @types/* packages
 * get their types from node_modules automatically.
 */

// ============================================================================
// Hono stubs
// ============================================================================

declare module "hono" {
  export class Hono<E = object> {
    get(path: string, ...handlers: unknown[]): this;
    post(path: string, ...handlers: unknown[]): this;
    put(path: string, ...handlers: unknown[]): this;
    patch(path: string, ...handlers: unknown[]): this;
    delete(path: string, ...handlers: unknown[]): this;
    use(path: string, ...handlers: unknown[]): this;
    use(...handlers: unknown[]): this;
    route(path: string, app: Hono): this;
    onError(handler: (err: Error, c: Context) => Response | Promise<Response>): this;
    notFound(handler: (c: Context) => Response | Promise<Response>): this;
  }
  export interface Context<E = object> {
    req: {
      param(name: string): string;
      query(name: string): string | undefined;
      header(name: string): string | undefined;
      json<T = unknown>(): Promise<T>;
      valid<T>(target: string): T;
    };
    json<T>(data: T, status?: number): Response;
    text(data: string, status?: number): Response;
    body(data: unknown, status?: number): Response;
    set<K extends string>(key: K, value: unknown): void;
    get<K extends string>(key: K): unknown;
  }
  export type Next = () => Promise<void>;
  export interface ContextVariableMap {
    [key: string]: unknown;
  }
}

declare module "hono/http-exception" {
  export class HTTPException extends Error {
    status: number;
    constructor(status: number, options?: { message?: string; cause?: unknown });
  }
}

declare module "hono/cors" {
  export function cors(options?: {
    origin?: string | string[] | ((origin: string) => string | null);
    credentials?: boolean;
    allowMethods?: string[];
    allowHeaders?: string[];
  }): unknown;
}

declare module "hono/logger" {
  export function logger(): unknown;
}

declare module "hono/secure-headers" {
  export function secureHeaders(): unknown;
}

declare module "@hono/zod-validator" {
  import type { z } from "zod";
  export function zValidator(target: string, schema: z.ZodType): unknown;
}

// ============================================================================
// Node crypto module
// ============================================================================

declare module "node:crypto" {
  export function randomUUID(): string;
  export function randomBytes(size: number): Buffer;
  export function pbkdf2Sync(password: string, salt: Buffer, iterations: number, keylen: number, digest: string): Buffer;
  export function timingSafeEqual(a: Buffer, b: Buffer): boolean;
  export function createHash(algorithm: string): {
    update(data: string | Buffer): { digest(encoding: string): string };
  };
}

// ============================================================================
// OpenAI stubs (for packages/ai)
// ============================================================================

declare module "openai" {
  interface ChatCompletionMessage {
    role: "system" | "user" | "assistant";
    content: string;
  }
  
  interface ChatCompletionChoice {
    index: number;
    message: { role: string; content: string | null };
    finish_reason: string;
  }
  
  interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: ChatCompletionChoice[];
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }
  
  interface TranscriptionResponse {
    text: string;
    language?: string;
    duration?: number;
    segments?: Array<{
      id: number;
      seek: number;
      start: number;
      end: number;
      text: string;
      tokens?: number[];
      temperature?: number;
      avgLogprob?: number;
      compressionRatio?: number;
      noSpeechProb?: number;
    }>;
  }
  
  export default class OpenAI {
    constructor(options: { apiKey: string });
    
    chat: {
      completions: {
        create(options: {
          model: string;
          messages: ChatCompletionMessage[];
          temperature?: number;
          max_tokens?: number;
          response_format?: { type: string };
        }): Promise<ChatCompletionResponse>;
      };
    };
    
    audio: {
      transcriptions: {
        create(options: {
          file: File;
          model: string;
          language?: string;
          prompt?: string;
          temperature?: number;
          response_format?: string;
          timestamp_granularities?: string[];
        }): Promise<TranscriptionResponse>;
      };
      translations: {
        create(options: {
          file: File;
          model: string;
          prompt?: string;
          temperature?: number;
          response_format?: string;
        }): Promise<TranscriptionResponse>;
      };
    };
  }
}

// ============================================================================
// Prisma Client stub
// ============================================================================

declare module "@prisma/client" {
  export class PrismaClient {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T>;
    $transaction<T>(operations: Promise<T>[]): Promise<T[]>;
    [key: string]: unknown;
  }
}

// ============================================================================
// Package aliases (for monorepo imports)
// ============================================================================

declare module "@buildflow/shared" {
  export * from "../packages/shared/src/index";
}

declare module "@buildflow/events" {
  export * from "../packages/events/src/index";
}

declare module "@buildflow/ai" {
  export * from "../packages/ai/src/index";
}
