import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import {
  CreateMeetingSchema,
  PresignUploadSchema,
  CaptureConsentSchema,
  CompleteRecordingSchema,
  StartTranscriptionSchema,
  CreateDraftSchema,
  ApproveDraftSchema,
  PERMISSIONS,
} from "@buildflow/shared";
import { authMiddleware, tenantMiddleware, requirePermission } from "../middleware/auth";
import { createOutboxEvent } from "../lib/outbox";

const meetings = new Hono();

// All routes require authentication and tenant context
meetings.use("*", authMiddleware, tenantMiddleware);

// ============================================================================
// MEETINGS
// ============================================================================

/**
 * POST /meetings
 * Create a new meeting
 */
meetings.post(
  "/",
  zValidator("json", CreateMeetingSchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const input = c.req.valid("json");

    // TODO: Replace with Prisma transaction
    /*
    const meeting = await prisma.$transaction(async (tx) => {
      const newMeeting = await tx.meeting.create({
        data: {
          tenantId,
          leadId: input.leadId || null,
          projectId: input.projectId || null,
          title: input.title || null,
          scheduledAt: input.scheduledAt || null,
          status: "scheduled",
          createdById: authCtx.user.id,
        },
      });

      // Create participants
      await tx.meetingParticipant.createMany({
        data: input.participants.map((p) => ({
          meetingId: newMeeting.id,
          name: p.name,
          email: p.email || null,
          phone: p.phone || null,
          role: p.role,
          userId: p.id || null,
        })),
      });

      // Emit event
      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: "meeting.created.v1",
          aggregateId: newMeeting.id,
          actorUserId: authCtx.user.id,
          payload: {
            meetingId: newMeeting.id,
            leadId: input.leadId || null,
            projectId: input.projectId || null,
            title: input.title || null,
            scheduledAt: input.scheduledAt || null,
            participantCount: input.participants.length,
            createdById: authCtx.user.id,
          },
        }),
      });

      return newMeeting;
    });

    return c.json({ meetingId: meeting.id }, 201);
    */

    return c.json({ meetingId: "placeholder-meeting-id" }, 201);
  }
);

/**
 * GET /meetings
 * List meetings
 */
meetings.get("/", async (c) => {
  const authCtx = c.get("auth");
  const tenantId = authCtx.tenantId!;

  // TODO: Replace with Prisma implementation
  /*
  const meetings = await prisma.meeting.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      participants: true,
      _count: { select: { recordings: true, transcripts: true } },
    },
  });
  */

  return c.json({ meetings: [] });
});

/**
 * GET /meetings/:id
 * Get meeting details
 */
meetings.get("/:id", async (c) => {
  const authCtx = c.get("auth");
  const tenantId = authCtx.tenantId!;
  const meetingId = c.req.param("id");

  // TODO: Replace with Prisma implementation
  /*
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, tenantId },
    include: {
      participants: true,
      consents: true,
      recordings: { orderBy: { uploadedAt: "desc" } },
      transcripts: { orderBy: { createdAt: "desc" } },
      aiDrafts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!meeting) {
    throw new HTTPException(404, { message: "Meeting not found" });
  }
  */

  throw new HTTPException(404, { message: "Meeting not found" });
});

// ============================================================================
// PRESIGNED UPLOADS
// ============================================================================

/**
 * POST /uploads/presign
 * Get a presigned URL for uploading audio
 */
meetings.post(
  "/uploads/presign",
  zValidator("json", PresignUploadSchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const input = c.req.valid("json");

    // TODO: Implement R2 presigned URL generation
    /*
    const objectKey = `tenants/${tenantId}/audio/${input.purpose}/${randomUUID()}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const uploadUrl = await r2.createPresignedUrl(objectKey, {
      expiresIn: 300,
      contentType: input.contentType,
      contentLength: input.sizeBytes,
    });

    return c.json({
      uploadUrl,
      objectKey,
      expiresAt: expiresAt.toISOString(),
    });
    */

    return c.json({
      uploadUrl: "https://placeholder-upload-url.example.com",
      objectKey: `tenants/${tenantId}/audio/${input.purpose}/placeholder`,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  }
);

// ============================================================================
// CONSENTS
// ============================================================================

/**
 * POST /meetings/:id/consents
 * Capture consent from a participant
 */
meetings.post(
  "/:id/consents",
  zValidator("json", CaptureConsentSchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const meetingId = c.req.param("id");
    const input = c.req.valid("json");

    // TODO: Replace with Prisma transaction
    /*
    // Verify meeting exists
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, tenantId },
      include: { participants: true },
    });

    if (!meeting) {
      throw new HTTPException(404, { message: "Meeting not found" });
    }

    // Verify participant exists and is a client
    const participant = meeting.participants.find(p => p.id === input.participantId);
    if (!participant) {
      throw new HTTPException(404, { message: "Participant not found" });
    }
    if (participant.role !== "client") {
      throw new HTTPException(400, { message: "Consent is only required from clients" });
    }

    const consent = await prisma.$transaction(async (tx) => {
      const newConsent = await tx.meetingConsent.create({
        data: {
          meetingId,
          participantId: input.participantId,
          consentStatementVersion: input.consentStatementVersion,
          objectKey: input.objectKey || null,
          geoLat: input.geo?.lat || null,
          geoLng: input.geo?.lng || null,
          geoAccuracyM: input.geo?.accuracyM || null,
          capturedAt: input.capturedAt,
          capturedById: authCtx.user.id,
        },
      });

      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: "meeting.consent.captured.v1",
          aggregateId: newConsent.id,
          actorUserId: authCtx.user.id,
          payload: {
            consentId: newConsent.id,
            meetingId,
            participantId: input.participantId,
            participantRole: participant.role,
            consentStatementVersion: input.consentStatementVersion,
            hasAudioProof: !!input.objectKey,
            capturedById: authCtx.user.id,
          },
        }),
      });

      return newConsent;
    });

    return c.json({ consentId: consent.id, status: "recording_allowed" }, 201);
    */

    return c.json({ consentId: "placeholder-consent-id", status: "recording_allowed" }, 201);
  }
);

// ============================================================================
// RECORDINGS
// ============================================================================

/**
 * POST /meetings/:id/recordings/complete
 * Mark a recording upload as complete
 */
meetings.post(
  "/:id/recordings/complete",
  zValidator("json", CompleteRecordingSchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const meetingId = c.req.param("id");
    const input = c.req.valid("json");

    // TODO: Replace with Prisma transaction
    /*
    // Verify meeting exists and has consent
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, tenantId },
      include: { consents: true },
    });

    if (!meeting) {
      throw new HTTPException(404, { message: "Meeting not found" });
    }

    // Check for client consent
    const hasClientConsent = meeting.consents.length > 0;
    if (!hasClientConsent) {
      throw new HTTPException(400, { message: "Client consent is required before uploading recordings" });
    }

    // Check for duplicate
    const existing = await prisma.meetingRecording.findFirst({
      where: { objectKey: input.objectKey, sha256: input.sha256 },
    });
    if (existing) {
      throw new HTTPException(409, { message: "Duplicate recording" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const recording = await tx.meetingRecording.create({
        data: {
          meetingId,
          tenantId,
          objectKey: input.objectKey,
          contentType: input.contentType,
          sizeBytes: input.sizeBytes,
          sha256: input.sha256,
          durationSec: input.durationSec || null,
          source: input.source,
          status: "uploaded",
          uploadedById: authCtx.user.id,
        },
      });

      // Create transcript job entry
      const transcript = await tx.meetingTranscript.create({
        data: {
          meetingId,
          recordingId: recording.id,
          tenantId,
          status: "queued",
        },
      });

      // Emit event
      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: "meeting.recording.uploaded.v1",
          aggregateId: recording.id,
          actorUserId: authCtx.user.id,
          payload: {
            recordingId: recording.id,
            meetingId,
            objectKey: input.objectKey,
            sizeBytes: input.sizeBytes,
            durationSec: input.durationSec || null,
            source: input.source,
            uploadedById: authCtx.user.id,
          },
        }),
      });

      // TODO: Enqueue transcription job
      // await transcriptionQueue.add('transcribe', { transcriptId: transcript.id });

      return { recording, transcript };
    });

    return c.json({
      recordingId: result.recording.id,
      transcriptionJobId: result.transcript.id,
    }, 201);
    */

    return c.json({
      recordingId: "placeholder-recording-id",
      transcriptionJobId: "placeholder-transcript-id",
    }, 201);
  }
);

// ============================================================================
// TRANSCRIPTS
// ============================================================================

/**
 * POST /meetings/:id/transcribe
 * Start or restart transcription
 */
meetings.post(
  "/:id/transcribe",
  zValidator("json", StartTranscriptionSchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const meetingId = c.req.param("id");
    const input = c.req.valid("json");

    // TODO: Implement transcription job queue
    return c.json({ transcriptionJobId: "placeholder-job-id" });
  }
);

/**
 * GET /meetings/:id/transcript
 * Get transcript
 */
meetings.get("/:id/transcript", async (c) => {
  const authCtx = c.get("auth");
  const tenantId = authCtx.tenantId!;
  const meetingId = c.req.param("id");
  const includeSegments = c.req.query("include") === "segments";

  // TODO: Replace with Prisma implementation
  /*
  const transcript = await prisma.meetingTranscript.findFirst({
    where: { meetingId, tenantId },
    orderBy: { createdAt: "desc" },
    include: includeSegments ? { segments: { orderBy: { startSec: "asc" } } } : undefined,
  });

  if (!transcript) {
    throw new HTTPException(404, { message: "Transcript not found" });
  }

  // Check if user can see raw text
  const canSeeRaw = authCtx.user.isPlatformAdmin || authCtx.permissions.has("ai.actions.approve");

  return c.json({
    transcriptId: transcript.id,
    status: transcript.status,
    language: transcript.language,
    durationSec: transcript.durationSec,
    textRedacted: transcript.textRedacted,
    textRaw: canSeeRaw ? transcript.textRaw : undefined,
    segments: includeSegments ? transcript.segments?.map(s => ({
      id: s.id,
      startSec: s.startSec,
      endSec: s.endSec,
      textRedacted: s.textRedacted,
      textRaw: canSeeRaw ? s.textRaw : undefined,
    })) : undefined,
  });
  */

  throw new HTTPException(404, { message: "Transcript not found" });
});

// ============================================================================
// AI DRAFTS
// ============================================================================

/**
 * POST /meetings/:id/ai/draft
 * Generate AI draft summary and action items
 */
meetings.post(
  "/:id/ai/draft",
  zValidator("json", CreateDraftSchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const meetingId = c.req.param("id");
    const input = c.req.valid("json");

    // TODO: Replace with Prisma and AI integration
    /*
    // Get transcript
    const transcript = await prisma.meetingTranscript.findFirst({
      where: input.transcriptId
        ? { id: input.transcriptId, meetingId, tenantId }
        : { meetingId, tenantId, status: "ready" },
      orderBy: { createdAt: "desc" },
    });

    if (!transcript) {
      throw new HTTPException(404, { message: "Transcript not found" });
    }

    if (transcript.status !== "ready") {
      throw new HTTPException(422, { message: "Transcript is not ready" });
    }

    const draft = await prisma.$transaction(async (tx) => {
      const newDraft = await tx.meetingAIDraft.create({
        data: {
          meetingId,
          transcriptId: transcript.id,
          tenantId,
          status: "generating",
          ragContextIds: input.ragContextIds || [],
        },
      });

      // TODO: Enqueue AI job
      // await aiQueue.add('summarize', { draftId: newDraft.id, locale: input.locale });

      return newDraft;
    });

    return c.json({
      draftId: draft.id,
      status: "generating",
    }, 201);
    */

    return c.json({
      draftId: "placeholder-draft-id",
      status: "generating",
    }, 201);
  }
);

/**
 * GET /meetings/:id/ai/draft
 * Get the latest AI draft
 */
meetings.get("/:id/ai/draft", async (c) => {
  const authCtx = c.get("auth");
  const tenantId = authCtx.tenantId!;
  const meetingId = c.req.param("id");

  // TODO: Replace with Prisma implementation
  throw new HTTPException(404, { message: "Draft not found" });
});

/**
 * POST /meetings/:id/ai/approve
 * Approve or reject an AI draft
 */
meetings.post(
  "/:id/ai/approve",
  requirePermission(PERMISSIONS.AI_ACTIONS_APPROVE),
  zValidator("json", ApproveDraftSchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const meetingId = c.req.param("id");
    const input = c.req.valid("json");

    // TODO: Replace with Prisma transaction
    /*
    const draft = await prisma.meetingAIDraft.findFirst({
      where: { id: input.draftId, meetingId, tenantId },
    });

    if (!draft) {
      throw new HTTPException(404, { message: "Draft not found" });
    }

    if (draft.status !== "pending_review") {
      throw new HTTPException(400, { message: `Cannot review draft with status: ${draft.status}` });
    }

    if (!input.approve && !input.reason) {
      throw new HTTPException(400, { message: "Reason is required when rejecting" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newStatus = input.approve ? "approved" : "rejected";

      await tx.meetingAIDraft.update({
        where: { id: input.draftId },
        data: {
          status: newStatus,
          reviewerId: authCtx.user.id,
          reviewReason: input.reason || null,
          reviewedAt: new Date(),
          editedSummary: input.edits?.summaryText || null,
          editedActionItems: input.edits?.actionItems || null,
        },
      });

      let publishedActionItemIds: string[] = [];

      if (input.approve) {
        // Create tasks from action items
        const actionItems = input.edits?.actionItems || draft.actionItems || [];
        for (const item of actionItems) {
          const task = await tx.task.create({
            data: {
              tenantId,
              source: "meeting",
              type: "action_item",
              status: "open",
              title: item.title,
              description: item.details || "",
              dueDate: item.dueDate || null,
              aiGenerated: true,
              aiActionLogId: draft.aiActionLogId,
            },
          });
          publishedActionItemIds.push(task.id);
        }

        await tx.outboxEvent.create({
          data: createOutboxEvent({
            tenantId,
            eventType: "meeting.review.approved.v1",
            aggregateId: input.draftId,
            actorUserId: authCtx.user.id,
            payload: {
              draftId: input.draftId,
              meetingId,
              reviewerId: authCtx.user.id,
              hasEdits: !!(input.edits?.summaryText || input.edits?.actionItems),
              publishedActionItemCount: publishedActionItemIds.length,
            },
          }),
        });
      } else {
        await tx.outboxEvent.create({
          data: createOutboxEvent({
            tenantId,
            eventType: "meeting.review.rejected.v1",
            aggregateId: input.draftId,
            actorUserId: authCtx.user.id,
            payload: {
              draftId: input.draftId,
              meetingId,
              reviewerId: authCtx.user.id,
              reason: input.reason!,
            },
          }),
        });
      }

      return { status: newStatus, publishedActionItemIds };
    });

    return c.json({
      status: result.status,
      publishedActionItemIds: result.publishedActionItemIds,
    });
    */

    return c.json({
      status: input.approve ? "approved" : "rejected",
      publishedActionItemIds: [],
    });
  }
);

export { meetings };

