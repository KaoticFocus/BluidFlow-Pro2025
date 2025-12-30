/**
 * Base Consumer Class
 * Provides common functionality for event consumers:
 * - Idempotency via ConsumerEvent table
 * - Checkpointing by sequence
 * - Retry policy
 * - DLQ on exhaustion
 * - Subscription filtering
 * - Replay capability
 */

import { prisma } from "../../lib/prisma";
import { withSpan, addSpanAttributes } from "../../lib/otel";
import { captureException, setContext } from "../../lib/sentry";
import { logger } from "../../lib/logger";

export interface ConsumerConfig {
  name: string;
  schemaIdPrefix: string; // e.g., "meetingflow" or "foundation.ai"
  batchSize?: number;
  pollIntervalMs?: number;
  maxAttempts?: number;
  retryDelayMs?: number;
}

export interface ProcessResult {
  success: boolean;
  error?: string;
  shouldRetry?: boolean;
}

export abstract class BaseConsumer {
  protected config: Required<ConsumerConfig>;
  protected isRunning = false;
  protected pollInterval: NodeJS.Timeout | null = null;
  protected lastCheckpoint: bigint | null = null;

  constructor(config: ConsumerConfig) {
    this.config = {
      name: config.name,
      schemaIdPrefix: config.schemaIdPrefix,
      batchSize: config.batchSize || 10,
      pollIntervalMs: config.pollIntervalMs || 5000,
      maxAttempts: config.maxAttempts || 10,
      retryDelayMs: config.retryDelayMs || 1000,
    };
  }

  /**
   * Process a single event
   * Must be implemented by subclasses
   */
  protected abstract processEvent(
    event: {
      sequence: bigint;
      eventId: string;
      tenantId: string;
      schemaId: string;
      schemaVersion: string;
      headers: any;
      payloadRedacted: any;
      payloadHash: string;
      publishedAt: Date;
    }
  ): Promise<ProcessResult>;

  /**
   * Check if event matches this consumer's subscription
   */
  protected matchesSubscription(schemaId: string): boolean {
    return schemaId.startsWith(this.config.schemaIdPrefix);
  }

  /**
   * Get or create consumer event record
   */
  protected async getConsumerEvent(eventId: string): Promise<{
    id: string;
    status: string;
    attempts: number;
    sequence: bigint;
    lastError?: string | null;
  } | null> {
    const result = await (prisma as any).consumerEvent.findUnique({
      where: {
        consumerName_eventId: {
          consumerName: this.config.name,
          eventId,
        },
      },
    });
  }

  /**
   * Mark event as processing
   */
  protected async markProcessing(eventId: string, sequence: bigint): Promise<void> {
    await (prisma as any).consumerEvent.upsert({
      where: {
        consumerName_eventId: {
          consumerName: this.config.name,
          eventId,
        },
      },
      create: {
        consumerName: this.config.name,
        eventId,
        sequence,
        status: "processing",
        attempts: 1,
      },
      update: {
        status: "processing",
        attempts: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark event as completed
   */
  protected async markCompleted(eventId: string): Promise<void> {
    await (prisma as any).consumerEvent.update({
      where: {
        consumerName_eventId: {
          consumerName: this.config.name,
          eventId,
        },
      },
      data: {
        status: "completed",
        processedAt: new Date(),
      },
    });
  }

  /**
   * Mark event as failed and optionally move to DLQ
   */
  protected async markFailed(
    eventId: string,
    sequence: bigint,
    error: string,
    moveToDLQ: boolean
  ): Promise<void> {
    const consumerEvent = await (prisma as any).consumerEvent.findUnique({
      where: {
        consumerName_eventId: {
          consumerName: this.config.name,
          eventId,
        },
      },
    });

    if (!consumerEvent) {
      return;
    }

    if (moveToDLQ) {
      // Get event log entry
      const eventLog = await (prisma as any).eventLog.findUnique({
        where: { eventId },
      });

      if (eventLog) {
        // Move to DLQ
        await prisma.$transaction(async (tx) => {
          await (tx as any).dLQMessage.create({
            data: {
              consumerName: this.config.name,
              eventId,
              sequence,
              failureReason: error,
              payloadSnapshot: eventLog.payloadRedacted as any,
            },
          });

          await (tx as any).consumerEvent.update({
            where: {
              consumerName_eventId: {
                consumerName: this.config.name,
                eventId,
              },
            },
            data: {
              status: "failed",
              lastError: error,
            },
          });
        });
      }
    } else {
      // Just mark as failed, will retry
      await (prisma as any).consumerEvent.update({
        where: {
          consumerName_eventId: {
            consumerName: this.config.name,
            eventId,
          },
        },
        data: {
          status: "pending",
          lastError: error,
        },
      });
    }
  }

  /**
   * Get last checkpoint sequence for this consumer
   */
  protected async getLastCheckpoint(): Promise<bigint> {
    const lastEvent = await (prisma as any).consumerEvent.findFirst({
      where: {
        consumerName: this.config.name,
        status: "completed",
      },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });

    return lastEvent?.sequence || BigInt(0);
  }

  /**
   * Poll and process events
   */
  protected async pollAndProcess(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    return await withSpan(`consumer.${this.config.name}.poll`, async (span) => {
      try {
        addSpanAttributes({
          "consumer.name": this.config.name,
          "consumer.schema_prefix": this.config.schemaIdPrefix,
        });

        // Get last checkpoint
        const lastSequence = this.lastCheckpoint || (await this.getLastCheckpoint());
        span.setAttribute("consumer.checkpoint", lastSequence.toString());

        // Find events after checkpoint that match subscription
        const events = await (prisma as any).eventLog.findMany({
        where: {
          sequence: { gt: lastSequence },
          schemaId: { startsWith: this.config.schemaIdPrefix },
        },
        orderBy: { sequence: "asc" },
        take: this.config.batchSize,
      });

        span.setAttribute("consumer.events_found", events.length);

        for (const event of events) {
          await withSpan(`consumer.${this.config.name}.process_event`, async (eventSpan) => {
            try {
              eventSpan.setAttributes({
                "event.id": event.eventId,
                "event.sequence": event.sequence.toString(),
                "event.schema_id": event.schemaId,
                "event.tenant_id": event.tenantId,
              });

              // Check if already processed (idempotency)
              const consumerEvent = await this.getConsumerEvent(event.eventId);

              if (consumerEvent?.status === "completed") {
                // Already processed, update checkpoint
                this.lastCheckpoint = event.sequence;
                eventSpan.setAttribute("event.status", "skipped_already_processed");
                return;
              }

              // Check if should retry (exponential backoff)
              if (consumerEvent && consumerEvent.attempts >= this.config.maxAttempts) {
                // Move to DLQ
                await this.markFailed(
                  event.eventId,
                  event.sequence,
                  (consumerEvent as any).lastError || "Max attempts exceeded",
                  true
                );
                eventSpan.setAttribute("event.status", "moved_to_dlq");
                return;
              }

              // Mark as processing
              await this.markProcessing(event.eventId, event.sequence);

              // Process event
              const result = await this.processEvent({
                sequence: event.sequence,
                eventId: event.eventId,
                tenantId: event.tenantId,
                schemaId: event.schemaId,
                schemaVersion: event.schemaVersion,
                headers: event.headers as any,
                payloadRedacted: event.payloadRedacted as any,
                payloadHash: event.payloadHash,
                publishedAt: event.publishedAt,
              });

              if (result.success) {
                // Mark as completed
                await this.markCompleted(event.eventId);
                this.lastCheckpoint = event.sequence;
                eventSpan.setAttribute("event.status", "completed");
              } else {
                // Mark as failed
                const shouldRetry = result.shouldRetry !== false;
                const attempts = consumerEvent?.attempts || 1;
                const moveToDLQ = attempts >= this.config.maxAttempts;

                await this.markFailed(event.eventId, event.sequence, result.error || "Processing failed", moveToDLQ);

                eventSpan.setAttributes({
                  "event.status": moveToDLQ ? "failed_dlq" : "failed_retry",
                  "event.attempts": attempts,
                });

                if (!moveToDLQ && shouldRetry) {
                  // Will retry on next poll (with exponential backoff)
                  // Delay is handled by poll interval
                }
              }
            } catch (error) {
              logger.error(`[${this.config.name}] Error processing event ${event.eventId}`, error, {
                eventId: event.eventId,
                sequence: event.sequence.toString(),
                schemaId: event.schemaId,
              });
              eventSpan.recordException(error instanceof Error ? error : new Error(String(error)));
              
              // Capture in Sentry
              captureException(error instanceof Error ? error : new Error(String(error)), {
                component: this.config.name,
                eventId: event.eventId,
                sequence: event.sequence.toString(),
              });
              
              await this.markFailed(
                event.eventId,
                event.sequence,
                error instanceof Error ? error.message : String(error),
                false
              );
            }
          });
        }
      } catch (error) {
        logger.error(`[${this.config.name}] Error in poll cycle`, error);
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        captureException(error instanceof Error ? error : new Error(String(error)), {
          component: this.config.name,
        });
      }
    });
  }

  /**
   * Start the consumer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn(`[${this.config.name}] Already running`);
      return;
    }

    logger.info(`[${this.config.name}] Starting...`);
    this.isRunning = true;

    try {
      // Get initial checkpoint
      this.lastCheckpoint = await this.getLastCheckpoint();

      // Start polling immediately
      await this.pollAndProcess();

      // Set up interval polling
      this.pollInterval = setInterval(() => {
        this.pollAndProcess();
      }, this.config.pollIntervalMs);

      logger.info(`[${this.config.name}] Started (polling every ${this.config.pollIntervalMs}ms)`);
      
      // Set Sentry context
      setContext("consumer", {
        name: this.config.name,
        schemaPrefix: this.config.schemaIdPrefix,
        batchSize: this.config.batchSize,
      });
    } catch (error) {
      logger.error(`[${this.config.name}] Failed to start`, error);
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: this.config.name,
      });
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the consumer
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info(`[${this.config.name}] Stopping...`);
    this.isRunning = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    logger.info(`[${this.config.name}] Stopped`);
  }

  /**
   * Replay events by sequence range
   */
  async replay(fromSequence: bigint, toSequence?: bigint): Promise<void> {
    console.log(`[${this.config.name}] Replaying events from sequence ${fromSequence}${toSequence ? ` to ${toSequence}` : ""}`);

    const where: any = {
      sequence: { gte: fromSequence },
      schemaId: { startsWith: this.config.schemaIdPrefix },
    };

    if (toSequence) {
      where.sequence.lte = toSequence;
    }

    const events = await (prisma as any).eventLog.findMany({
      where,
      orderBy: { sequence: "asc" },
    });

    for (const event of events) {
      // Reset consumer event to allow reprocessing
      await (prisma as any).consumerEvent.deleteMany({
        where: {
          consumerName: this.config.name,
          eventId: event.eventId,
        },
      });

      // Process event
      const result = await this.processEvent({
        sequence: event.sequence,
        eventId: event.eventId,
        tenantId: event.tenantId,
        schemaId: event.schemaId,
        schemaVersion: event.schemaVersion,
        headers: event.headers as any,
        payloadRedacted: event.payloadRedacted as any,
        payloadHash: event.payloadHash,
        publishedAt: event.publishedAt,
      });

      if (result.success) {
        await this.markCompleted(event.eventId);
      } else {
        console.error(`[${this.config.name}] Replay failed for event ${event.eventId}:`, result.error);
      }
    }

    console.log(`[${this.config.name}] Replay completed (${events.length} events)`);
  }
}

