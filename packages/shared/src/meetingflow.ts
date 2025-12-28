import { z } from "zod";

// ============================================================================
// MEETING
// ============================================================================

export const MeetingStatusEnum = z.enum(["scheduled", "in_progress", "completed", "cancelled"]);
export type MeetingStatus = z.infer<typeof MeetingStatusEnum>;

export const ParticipantRoleEnum = z.enum(["contractor", "client", "subcontractor", "vendor"]);
export type ParticipantRole = z.infer<typeof ParticipantRoleEnum>;

export const ParticipantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: ParticipantRoleEnum,
});

export type Participant = z.infer<typeof ParticipantSchema>;

export const MeetingSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  leadId: z.string().uuid().nullable(),
  projectId: z.string().uuid().nullable(),
  title: z.string().nullable(),
  scheduledAt: z.coerce.date().nullable(),
  startedAt: z.coerce.date().nullable(),
  endedAt: z.coerce.date().nullable(),
  status: MeetingStatusEnum,
  createdById: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Meeting = z.infer<typeof MeetingSchema>;

export const CreateMeetingSchema = z.object({
  leadId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  title: z.string().max(255).optional(),
  scheduledAt: z.coerce.date().optional(),
  participants: z.array(ParticipantSchema).min(1),
});

export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;

// ============================================================================
// PRESIGNED UPLOAD
// ============================================================================

export const UploadPurposeEnum = z.enum(["meeting_audio", "consent_audio"]);
export type UploadPurpose = z.infer<typeof UploadPurposeEnum>;

export const PresignUploadSchema = z.object({
  purpose: UploadPurposeEnum,
  contentType: z.string().regex(/^audio\//, "Must be an audio type"),
  sizeBytes: z.number().int().positive().max(500 * 1024 * 1024), // 500MB max
  sha256: z.string().length(64),
});

export type PresignUploadInput = z.infer<typeof PresignUploadSchema>;

export const PresignUploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  objectKey: z.string(),
  expiresAt: z.coerce.date(),
});

export type PresignUploadResponse = z.infer<typeof PresignUploadResponseSchema>;

// ============================================================================
// CONSENT
// ============================================================================

export const GeoLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().positive().optional(),
});

export type GeoLocation = z.infer<typeof GeoLocationSchema>;

export const CaptureConsentSchema = z.object({
  participantId: z.string().uuid(),
  consentStatementVersion: z.string().min(1),
  objectKey: z.string().optional(), // Audio proof
  capturedAt: z.coerce.date(),
  geo: GeoLocationSchema.optional(),
});

export type CaptureConsentInput = z.infer<typeof CaptureConsentSchema>;

export const MeetingConsentSchema = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  participantId: z.string().uuid(),
  consentStatementVersion: z.string(),
  objectKey: z.string().nullable(),
  geoLat: z.number().nullable(),
  geoLng: z.number().nullable(),
  capturedAt: z.coerce.date(),
  capturedById: z.string().uuid(),
});

export type MeetingConsent = z.infer<typeof MeetingConsentSchema>;

// ============================================================================
// RECORDING
// ============================================================================

export const RecordingSourceEnum = z.enum(["mobile", "web"]);
export type RecordingSource = z.infer<typeof RecordingSourceEnum>;

export const RecordingStatusEnum = z.enum(["uploaded", "processing", "ready", "failed"]);
export type RecordingStatus = z.infer<typeof RecordingStatusEnum>;

export const CompleteRecordingSchema = z.object({
  objectKey: z.string().min(1),
  contentType: z.string().regex(/^audio\//),
  sizeBytes: z.number().int().positive(),
  sha256: z.string().length(64),
  durationSec: z.number().int().positive().optional(),
  source: RecordingSourceEnum,
});

export type CompleteRecordingInput = z.infer<typeof CompleteRecordingSchema>;

export const MeetingRecordingSchema = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  objectKey: z.string(),
  contentType: z.string(),
  sizeBytes: z.number(),
  sha256: z.string(),
  durationSec: z.number().nullable(),
  source: RecordingSourceEnum,
  status: RecordingStatusEnum,
  uploadedById: z.string().uuid(),
  uploadedAt: z.coerce.date(),
});

export type MeetingRecording = z.infer<typeof MeetingRecordingSchema>;

// ============================================================================
// TRANSCRIPT
// ============================================================================

export const TranscriptStatusEnum = z.enum(["queued", "processing", "ready", "failed"]);
export type TranscriptStatus = z.infer<typeof TranscriptStatusEnum>;

export const TranscriptSegmentSchema = z.object({
  id: z.string().uuid(),
  startSec: z.number(),
  endSec: z.number(),
  textRedacted: z.string(),
  textRaw: z.string().optional(), // Only for admins
  speakerId: z.string().nullable(),
  confidence: z.number().nullable(),
});

export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;

export const MeetingTranscriptSchema = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  recordingId: z.string().uuid(),
  status: TranscriptStatusEnum,
  language: z.string().nullable(),
  durationSec: z.number().nullable(),
  textRedacted: z.string().nullable(),
  textRaw: z.string().nullable(), // Only for admins
  segments: z.array(TranscriptSegmentSchema).optional(),
  createdAt: z.coerce.date(),
});

export type MeetingTranscript = z.infer<typeof MeetingTranscriptSchema>;

export const StartTranscriptionSchema = z.object({
  recordingId: z.string().uuid().optional(),
});

export type StartTranscriptionInput = z.infer<typeof StartTranscriptionSchema>;

// ============================================================================
// AI DRAFT
// ============================================================================

export const DraftStatusEnum = z.enum(["generating", "pending_review", "approved", "rejected"]);
export type DraftStatus = z.infer<typeof DraftStatusEnum>;

export const CitationSchema = z.object({
  segmentId: z.string().uuid(),
  startSec: z.number(),
  endSec: z.number(),
});

export type Citation = z.infer<typeof CitationSchema>;

export const ActionItemSchema = z.object({
  title: z.string(),
  details: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  assigneeRole: ParticipantRoleEnum.optional(),
});

export type ActionItem = z.infer<typeof ActionItemSchema>;

export const MeetingAIDraftSchema = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  transcriptId: z.string().uuid(),
  status: DraftStatusEnum,
  summaryText: z.string().nullable(),
  citations: z.array(CitationSchema).nullable(),
  actionItems: z.array(ActionItemSchema).nullable(),
  ragContextIds: z.array(z.string().uuid()),
  reviewerId: z.string().uuid().nullable(),
  reviewReason: z.string().nullable(),
  reviewedAt: z.coerce.date().nullable(),
  editedSummary: z.string().nullable(),
  editedActionItems: z.array(ActionItemSchema).nullable(),
  createdAt: z.coerce.date(),
});

export type MeetingAIDraft = z.infer<typeof MeetingAIDraftSchema>;

export const CreateDraftSchema = z.object({
  transcriptId: z.string().uuid().optional(),
  locale: z.string().length(2).optional(),
  ragContextIds: z.array(z.string().uuid()).optional(),
});

export type CreateDraftInput = z.infer<typeof CreateDraftSchema>;

export const ApproveDraftSchema = z.object({
  draftId: z.string().uuid(),
  approve: z.boolean(),
  edits: z.object({
    summaryText: z.string().optional(),
    actionItems: z.array(ActionItemSchema).optional(),
  }).optional(),
  reason: z.string().max(2000).optional(),
});

export type ApproveDraftInput = z.infer<typeof ApproveDraftSchema>;

