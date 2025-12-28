import { z } from "zod";

// ============================================================================
// CONSENT TYPES
// ============================================================================

export const ConsentPurposeEnum = z.enum([
  "ai_assistance",
  "recording",
  "transcription",
  "email_marketing",
  "sms_notifications",
  "phone_calls",
  "data_processing",
]);

export type ConsentPurpose = z.infer<typeof ConsentPurposeEnum>;

export const ConsentChannelEnum = z.enum(["web", "mobile", "verbal", "written", "email"]);
export type ConsentChannel = z.infer<typeof ConsentChannelEnum>;

export const SubjectTypeEnum = z.enum(["user", "customer", "lead", "contact"]);
export type SubjectType = z.infer<typeof SubjectTypeEnum>;

// ============================================================================
// CONSENT EVIDENCE
// ============================================================================

export const ConsentEvidenceSchema = z.object({
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  signatureUrl: z.string().url().optional(),
  recordingUrl: z.string().url().optional(),
  timestamp: z.coerce.date().optional(),
});

export type ConsentEvidence = z.infer<typeof ConsentEvidenceSchema>;

// ============================================================================
// CONSENT
// ============================================================================

export const ConsentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  subjectType: SubjectTypeEnum,
  subjectId: z.string().uuid(),
  purposeKey: ConsentPurposeEnum,
  channel: ConsentChannelEnum.nullable(),
  policyHash: z.string(),
  textVersion: z.string(),
  language: z.string(),
  actorUserId: z.string().uuid().nullable(),
  evidence: ConsentEvidenceSchema.nullable(),
  capturedAt: z.coerce.date(),
  revokedAt: z.coerce.date().nullable(),
  revokedBy: z.string().uuid().nullable(),
});

export type Consent = z.infer<typeof ConsentSchema>;

// ============================================================================
// CREATE CONSENT
// ============================================================================

export const CreateConsentSchema = z.object({
  subjectType: SubjectTypeEnum,
  subjectId: z.string().uuid(),
  purposeKey: ConsentPurposeEnum,
  channel: ConsentChannelEnum.optional(),
  policyHash: z.string().min(1),
  textVersion: z.string().min(1),
  language: z.string().length(2).default("en"),
  evidence: ConsentEvidenceSchema.optional(),
});

export type CreateConsentInput = z.infer<typeof CreateConsentSchema>;

// ============================================================================
// QUERY CONSENT
// ============================================================================

export const QueryConsentSchema = z.object({
  subjectType: SubjectTypeEnum.optional(),
  subjectId: z.string().uuid().optional(),
  purposeKey: ConsentPurposeEnum.optional(),
  activeOnly: z.coerce.boolean().default(true),
});

export type QueryConsentInput = z.infer<typeof QueryConsentSchema>;

// ============================================================================
// REVOKE CONSENT
// ============================================================================

export const RevokeConsentSchema = z.object({
  consentId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type RevokeConsentInput = z.infer<typeof RevokeConsentSchema>;

// ============================================================================
// CONSENT CHECK
// ============================================================================

export const CheckConsentSchema = z.object({
  subjectType: SubjectTypeEnum,
  subjectId: z.string().uuid(),
  purposeKey: ConsentPurposeEnum,
});

export type CheckConsentInput = z.infer<typeof CheckConsentSchema>;

export const ConsentCheckResultSchema = z.object({
  hasConsent: z.boolean(),
  consent: ConsentSchema.nullable(),
  expiresAt: z.coerce.date().nullable(),
});

export type ConsentCheckResult = z.infer<typeof ConsentCheckResultSchema>;

