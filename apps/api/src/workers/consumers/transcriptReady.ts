/**
 * Transcript Ready Consumer
 * Processes meeting.transcript.ready.v1 events from the event log
 * Extracts action items from transcripts and creates task proposals
 */

import { BaseConsumer, type ProcessResult } from "./base-consumer";
import { prisma } from "../../lib/prisma";
import { createOutboxEvent } from "../../lib/outbox";
import { createHash } from "node:crypto";

/**
 * Extract action items from transcript text
 * TODO: Replace with actual OpenAI integration
 */
async function extractActionItems(
  transcriptText: string,
  segments: Array<{ id: string; startSec: number; endSec: number; textRaw: string; textRedacted: string | null }>
): Promise<Array<{ title: string; description: string; citations: Array<{ sourceId: string; snippet: string; startSec: number; endSec: number }> }>> {
  // Placeholder implementation
  // In production, this would:
  // 1. Call OpenAI API with transcript
  // 2. Use structured output to extract action items
  // 3. Map action items to transcript segments for citations
  // 4. Return structured data with citations

  // For now, return empty array (no action items extracted)
  // This allows the consumer to run without OpenAI integration
  return [];
}

class TranscriptReadyConsumer extends BaseConsumer {
  constructor() {
    super({
      name: "transcript-ready-consumer",
      schemaIdPrefix: "meetingflow.meeting.transcript.ready",
      batchSize: 10,
      pollIntervalMs: 5000,
      maxAttempts: 10,
    });
  }

  protected async processEvent(event: {
    sequence: bigint;
    eventId: string;
    tenantId: string;
    schemaId: string;
    schemaVersion: string;
    headers: any;
    payloadRedacted: any;
    payloadHash: string;
    publishedAt: Date;
  }): Promise<ProcessResult> {
    const { transcriptId, meetingId, recordingId } = event.payloadRedacted;

    if (!transcriptId) {
      return {
        success: false,
        error: "Missing transcriptId in payload",
        shouldRetry: false,
      };
    }

    // Get transcript with segments
    const transcript = await prisma.meetingTranscript.findUnique({
      where: { id: transcriptId },
      include: {
        segments: {
          orderBy: { startSec: "asc" },
        },
        meeting: {
          select: {
            tenantId: true,
            projectId: true,
          },
        },
      },
    });

    if (!transcript) {
      return {
        success: false,
        error: `Transcript ${transcriptId} not found`,
        shouldRetry: false,
      };
    }

    // Build full transcript text from segments
    const transcriptText = transcript.segments
      .map((s) => s.textRedacted || s.textRaw)
      .filter(Boolean)
      .join(" ");

    // Generate content hash for deduplication
    const contentHash = createHash("sha256")
      .update(`${transcript.meeting.tenantId}:${transcriptId}:${transcriptText}`)
      .digest("hex");

    // Check if we've already processed this transcript
    const existingAction = await prisma.aIActionLog.findFirst({
      where: {
        tenantId: transcript.meeting.tenantId,
        inputRefTable: "meeting_transcripts",
        inputRefId: transcriptId,
        contentHash,
      },
    });

    if (existingAction) {
      // Already processed, skip
      return {
        success: true,
      };
    }

    // Extract action items
    const actionItems = await extractActionItems(transcriptText, transcript.segments);

    // Create AIActionLog proposal for each action item
    for (const item of actionItems) {
      await prisma.$transaction(async (tx) => {
        // Create AIActionLog proposal
        const aiAction = await tx.aIActionLog.create({
          data: {
            tenantId: transcript.meeting.tenantId,
            actorService: "transcript-consumer",
            model: "gpt-4o", // TODO: Use actual model from OpenAI call
            promptHash: createHash("sha256").update("extract-action-items").digest("hex"),
            inputRefTable: "meeting_transcripts",
            inputRefId: transcriptId,
            inputSnapshot: {
              transcriptId,
              meetingId,
              recordingId,
              segmentCount: transcript.segments.length,
            },
            outputKind: "structured",
            outputSnapshot: {
              actionItems: [item],
            },
            citations: item.citations || null,
            tokenUsage: {
              prompt: 0, // TODO: Track from OpenAI response
              completion: 0,
              total: 0,
            },
            requiresReview: true,
            status: "proposed",
            contentHash,
            traceId: event.eventId,
            correlationId: event.headers.correlationId || null,
          },
        });

        // Emit event for the proposal
        await tx.outboxEvent.create({
          data: createOutboxEvent({
            tenantId: transcript.meeting.tenantId,
            eventType: "ai.action.logged.v1",
            aggregateId: aiAction.id,
            actorUserId: null,
            traceId: event.eventId,
            correlationId: event.headers.correlationId || null,
            payload: {
              actionId: aiAction.id,
              model: aiAction.model,
              outputKind: aiAction.outputKind,
              requiresReview: true,
              inputRefTable: "meeting_transcripts",
              inputRefId: transcriptId,
            },
          }),
        });
      });
    }

    return {
      success: true,
    };
  }
}

// Create singleton instance
const consumer = new TranscriptReadyConsumer();

/**
 * Start the transcript consumer
 */
export async function startTranscriptConsumer() {
  await consumer.start();
}

/**
 * Stop the transcript consumer
 */
export async function stopTranscriptConsumer() {
  await consumer.stop();
}

/**
 * Replay transcript events
 */
export async function replayTranscriptEvents(fromSequence: bigint, toSequence?: bigint) {
  await consumer.replay(fromSequence, toSequence);
}
