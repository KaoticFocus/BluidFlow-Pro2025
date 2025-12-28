import { z } from "zod";

// ============================================================================
// AI ACTION LOG
// ============================================================================

export const AIActionStatusEnum = z.enum(["proposed", "approved", "rejected", "executed"]);
export type AIActionStatus = z.infer<typeof AIActionStatusEnum>;

export const AIOutputKindEnum = z.enum(["text", "json", "transcription", "embedding", "structured"]);
export type AIOutputKind = z.infer<typeof AIOutputKindEnum>;

export const TokenUsageSchema = z.object({
  prompt: z.number().int().nonnegative(),
  completion: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export type TokenUsage = z.infer<typeof TokenUsageSchema>;

export const CitationSchema = z.object({
  sourceId: z.string(),
  sourceType: z.string(), // document, transcript, record
  snippet: z.string(),
  confidence: z.number().min(0).max(1),
  location: z.string().optional(), // page, timestamp, field
});

export type Citation = z.infer<typeof CitationSchema>;

export const PlannedSideEffectSchema = z.object({
  type: z.string(), // email, sms, webhook, record_create, record_update
  target: z.string(),
  payload: z.record(z.unknown()),
});

export type PlannedSideEffect = z.infer<typeof PlannedSideEffectSchema>;

export const RedactionSummarySchema = z.object({
  fieldsRedacted: z.array(z.string()),
  piiTypes: z.array(z.string()), // email, phone, ssn, address
  originalHash: z.string().optional(),
});

export type RedactionSummary = z.infer<typeof RedactionSummarySchema>;

export const AIActionLogSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  actorUserId: z.string().uuid().nullable(),
  actorService: z.string().nullable(),
  
  model: z.string(),
  promptHash: z.string(),
  inputRefTable: z.string().nullable(),
  inputRefId: z.string().uuid().nullable(),
  inputSnapshot: z.record(z.unknown()),
  
  outputKind: AIOutputKindEnum,
  outputSnapshot: z.record(z.unknown()),
  citations: z.array(CitationSchema).nullable(),
  
  tokenUsage: TokenUsageSchema,
  estimatedCostUsd: z.number().nullable(),
  
  requiresReview: z.boolean(),
  status: AIActionStatusEnum,
  
  plannedSideEffects: z.array(PlannedSideEffectSchema).nullable(),
  
  piiDetected: z.boolean(),
  redactionSummary: RedactionSummarySchema.nullable(),
  
  traceId: z.string().nullable(),
  correlationId: z.string().nullable(),
  latencyMs: z.number().int().nullable(),
  
  createdAt: z.coerce.date(),
});

export type AIActionLog = z.infer<typeof AIActionLogSchema>;

// ============================================================================
// CREATE AI ACTION
// ============================================================================

export const CreateAIActionSchema = z.object({
  model: z.string().min(1),
  promptHash: z.string().min(1),
  inputRefTable: z.string().optional(),
  inputRefId: z.string().uuid().optional(),
  inputSnapshot: z.record(z.unknown()),
  
  outputKind: AIOutputKindEnum,
  outputSnapshot: z.record(z.unknown()),
  citations: z.array(CitationSchema).optional(),
  
  tokenUsage: TokenUsageSchema,
  estimatedCostUsd: z.number().optional(),
  
  requiresReview: z.boolean().default(true),
  plannedSideEffects: z.array(PlannedSideEffectSchema).optional(),
  
  piiDetected: z.boolean().default(false),
  redactionSummary: RedactionSummarySchema.optional(),
  
  traceId: z.string().optional(),
  correlationId: z.string().optional(),
  latencyMs: z.number().int().optional(),
});

export type CreateAIActionInput = z.infer<typeof CreateAIActionSchema>;

// ============================================================================
// AI ACTION DECISION
// ============================================================================

export const DecisionTypeEnum = z.enum(["approve", "reject"]);
export type DecisionType = z.infer<typeof DecisionTypeEnum>;

export const AIActionDecisionSchema = z.object({
  id: z.string().uuid(),
  logId: z.string().uuid(),
  reviewerUserId: z.string().uuid(),
  decision: DecisionTypeEnum,
  reason: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type AIActionDecision = z.infer<typeof AIActionDecisionSchema>;

export const CreateDecisionSchema = z.object({
  decision: DecisionTypeEnum,
  reason: z.string().max(2000).optional(),
});

export type CreateDecisionInput = z.infer<typeof CreateDecisionSchema>;

// ============================================================================
// AI ACTION SIDE EFFECT
// ============================================================================

export const SideEffectStatusEnum = z.enum(["pending", "executing", "completed", "failed"]);
export type SideEffectStatus = z.infer<typeof SideEffectStatusEnum>;

export const AIActionSideEffectSchema = z.object({
  id: z.string().uuid(),
  logId: z.string().uuid(),
  tenantId: z.string().uuid(),
  effectType: z.string(),
  targetRef: z.string().nullable(),
  payload: z.record(z.unknown()),
  status: SideEffectStatusEnum,
  error: z.string().nullable(),
  executedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export type AIActionSideEffect = z.infer<typeof AIActionSideEffectSchema>;

// ============================================================================
// QUERY FILTERS
// ============================================================================

export const AIActionQuerySchema = z.object({
  status: AIActionStatusEnum.optional(),
  requiresReview: z.coerce.boolean().optional(),
  actorUserId: z.string().uuid().optional(),
  model: z.string().optional(),
  inputRefTable: z.string().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

export type AIActionQuery = z.infer<typeof AIActionQuerySchema>;

