/**
 * Transcript Ready Consumer
 * Processes meeting.transcript.ready.v1 events from the outbox
 * Extracts action items from transcripts and creates task proposals
 */

import { prisma } from "../../lib/prisma";
import { createOutboxEvent } from "../../lib/outbox";
import { createHash } from "node:crypto";

const EVENT_TYPE = "meeting.transcript.ready.v1";
const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds
const BATCH_SIZE = 10;

let isRunning = false;
let pollInterval: NodeJS.Timeout | null = null;

/**
 * Process a single transcript ready event
 */
async function processTranscriptEvent(event: {
  id: string;
  tenantId: string;
  payload: any;
  aggregateId: string | null;
}) {
  const { transcriptId, meetingId, recordingId } = event.payload;

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
    console.error(`Transcript ${transcriptId} not found`);
    return;
  }

  // Build full transcript text from segments (use textRedacted if available, fallback to textRaw)
  const transcriptText = transcript.segments
    .map((s) => s.textRedacted || s.textRaw)
    .filter(Boolean)
    .join(" ");

  // Generate content hash for deduplication
  const contentHash = createHash("sha256")
    .update(`${transcript.meeting.tenantId}:${transcriptId}:${transcriptText}`)
    .digest("hex");

  // Check if we've already processed this transcript
  // Use dedupe key: tenantId + transcriptId + contentHash
  const dedupeKey = `transcript:${transcript.meeting.tenantId}:${transcriptId}:${contentHash}`;
  
  const existingAction = await prisma.outboxEvent.findFirst({
    where: {
      dedupeKey,
    },
  });

  if (existingAction) {
    console.log(`Transcript ${transcriptId} already processed (dedupe)`);
    return;
  }

  // TODO: Extract action items using OpenAI
  // For now, create a placeholder task extraction
  // In production, this would:
  // 1. Call OpenAI with transcript text
  // 2. Extract structured action items
  // 3. Include citations (segment references)
  // 4. Track token usage

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
          traceId: event.id,
          correlationId: event.aggregateId || null,
        },
      });

      // Emit event for the proposal
      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId: transcript.meeting.tenantId,
          eventType: "ai.action.logged.v1",
          aggregateId: aiAction.id,
          actorUserId: null,
          traceId: event.id,
          correlationId: event.aggregateId || null,
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

  console.log(`Processed transcript ${transcriptId}, extracted ${actionItems.length} action items`);
}

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

/**
 * Poll outbox for transcript ready events and process them
 */
async function pollAndProcess() {
  if (!isRunning) {
    return;
  }

  try {
    // Find pending transcript ready events
    const events = await prisma.outboxEvent.findMany({
      where: {
        eventType: EVENT_TYPE,
        status: "pending",
      },
      take: BATCH_SIZE,
      orderBy: { createdAt: "asc" },
    });

    for (const event of events) {
      try {
        // Mark as processing (update status to prevent double processing)
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: "published", // Mark as published to prevent reprocessing
            publishedAt: new Date(),
            attempts: { increment: 1 },
          },
        });

        // Process the event
        await processTranscriptEvent({
          id: event.id,
          tenantId: event.tenantId,
          payload: event.payload as any,
          aggregateId: event.aggregateId || null,
        });
      } catch (error) {
        console.error(`Error processing transcript event ${event.id}:`, error);

        // Mark as failed after max attempts
        const attempts = event.attempts + 1;
        if (attempts >= 10) {
          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: "failed",
              lastError: error instanceof Error ? error.message : String(error),
              attempts,
            },
          });
        } else {
          // Retry later
          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              attempts,
              lastError: error instanceof Error ? error.message : String(error),
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in transcript consumer poll:", error);
  }
}

/**
 * Start the transcript consumer worker
 */
export async function startTranscriptConsumer() {
  if (isRunning) {
    console.warn("Transcript consumer already running");
    return;
  }

  console.log("Starting transcript consumer...");
  isRunning = true;

  // Start polling immediately
  await pollAndProcess();

  // Set up interval polling
  pollInterval = setInterval(pollAndProcess, POLL_INTERVAL_MS);

  console.log(`Transcript consumer started (polling every ${POLL_INTERVAL_MS}ms)`);
}

/**
 * Stop the transcript consumer worker
 */
export async function stopTranscriptConsumer() {
  if (!isRunning) {
    return;
  }

  console.log("Stopping transcript consumer...");
  isRunning = false;

  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  console.log("Transcript consumer stopped");
}

