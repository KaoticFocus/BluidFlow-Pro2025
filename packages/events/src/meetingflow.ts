import { z } from "zod";
import { BaseEventSchema } from "./foundation";

// ============================================================================
// MEETINGFLOW EVENTS
// ============================================================================

export const MeetingCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("meeting.created.v1"),
  payload: z.object({
    meetingId: z.string().uuid(),
    leadId: z.string().uuid().nullable(),
    projectId: z.string().uuid().nullable(),
    title: z.string().nullable(),
    scheduledAt: z.coerce.date().nullable(),
    participantCount: z.number().int(),
    createdById: z.string().uuid(),
  }),
});

export type MeetingCreatedEvent = z.infer<typeof MeetingCreatedEventSchema>;

export const MeetingConsentCapturedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("meeting.consent.captured.v1"),
  payload: z.object({
    consentId: z.string().uuid(),
    meetingId: z.string().uuid(),
    participantId: z.string().uuid(),
    participantRole: z.string(),
    consentStatementVersion: z.string(),
    hasAudioProof: z.boolean(),
    capturedById: z.string().uuid(),
  }),
});

export type MeetingConsentCapturedEvent = z.infer<typeof MeetingConsentCapturedEventSchema>;

export const MeetingRecordingUploadedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("meeting.recording.uploaded.v1"),
  payload: z.object({
    recordingId: z.string().uuid(),
    meetingId: z.string().uuid(),
    objectKey: z.string(),
    sizeBytes: z.number(),
    durationSec: z.number().nullable(),
    source: z.string(),
    uploadedById: z.string().uuid(),
  }),
});

export type MeetingRecordingUploadedEvent = z.infer<typeof MeetingRecordingUploadedEventSchema>;

export const MeetingTranscriptReadyEventSchema = BaseEventSchema.extend({
  eventType: z.literal("meeting.transcript.ready.v1"),
  payload: z.object({
    transcriptId: z.string().uuid(),
    meetingId: z.string().uuid(),
    recordingId: z.string().uuid(),
    language: z.string().nullable(),
    durationSec: z.number().nullable(),
    segmentCount: z.number().int(),
    piiRedacted: z.boolean(),
  }),
});

export type MeetingTranscriptReadyEvent = z.infer<typeof MeetingTranscriptReadyEventSchema>;

export const MeetingAIDraftCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("meeting.ai_draft.created.v1"),
  payload: z.object({
    draftId: z.string().uuid(),
    meetingId: z.string().uuid(),
    transcriptId: z.string().uuid(),
    summaryLength: z.number().int(),
    actionItemCount: z.number().int(),
    citationCount: z.number().int(),
    ragContextCount: z.number().int(),
    aiActionLogId: z.string().uuid().nullable(),
  }),
});

export type MeetingAIDraftCreatedEvent = z.infer<typeof MeetingAIDraftCreatedEventSchema>;

export const MeetingReviewApprovedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("meeting.review.approved.v1"),
  payload: z.object({
    draftId: z.string().uuid(),
    meetingId: z.string().uuid(),
    reviewerId: z.string().uuid(),
    hasEdits: z.boolean(),
    publishedActionItemCount: z.number().int(),
  }),
});

export type MeetingReviewApprovedEvent = z.infer<typeof MeetingReviewApprovedEventSchema>;

export const MeetingReviewRejectedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("meeting.review.rejected.v1"),
  payload: z.object({
    draftId: z.string().uuid(),
    meetingId: z.string().uuid(),
    reviewerId: z.string().uuid(),
    reason: z.string(),
  }),
});

export type MeetingReviewRejectedEvent = z.infer<typeof MeetingReviewRejectedEventSchema>;

// ============================================================================
// EVENT TYPES
// ============================================================================

export type MeetingFlowEvent =
  | MeetingCreatedEvent
  | MeetingConsentCapturedEvent
  | MeetingRecordingUploadedEvent
  | MeetingTranscriptReadyEvent
  | MeetingAIDraftCreatedEvent
  | MeetingReviewApprovedEvent
  | MeetingReviewRejectedEvent;

export const MEETINGFLOW_EVENT_TYPES = [
  "meeting.created.v1",
  "meeting.consent.captured.v1",
  "meeting.recording.uploaded.v1",
  "meeting.transcript.ready.v1",
  "meeting.ai_draft.created.v1",
  "meeting.review.approved.v1",
  "meeting.review.rejected.v1",
] as const;

export type MeetingFlowEventType = (typeof MEETINGFLOW_EVENT_TYPES)[number];

