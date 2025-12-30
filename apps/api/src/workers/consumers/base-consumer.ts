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
  } | null> {
    return await prisma.consumerEvent.findUnique({
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
    await prisma.consumerEvent.upsert({
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
    await prisma.consumerEvent.update({
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
    const consumerEvent = await prisma.consumerEvent.findUnique({
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
      const eventLog = await prisma.eventLog.findUnique({
        where: { eventId },
      });

      if (eventLog) {
        // Move to DLQ
        await prisma.$transaction(async (tx) => {
          await tx.dLQMessage.create({
            data: {
              consumerName: this.config.name,
              eventId,
              sequence,
              failureReason: error,
              payloadSnapshot: eventLog.payloadRedacted as any,
            },
          });

          await tx.consumerEvent.update({
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
      await prisma.consumerEvent.update({
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
    const lastEvent = await prisma.consumerEvent.findFirst({
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

    try {
      // Get last checkpoint
      const lastSequence = this.lastCheckpoint || (await this.getLastCheckpoint());

      // Find events after checkpoint that match subscription
      const events = await prisma.eventLog.findMany({
        where: {
          sequence: { gt: lastSequence },
          schemaId: { startsWith: this.config.schemaIdPrefix },
        },
        orderBy: { sequence: "asc" },
        take: this.config.batchSize,
      });

      for (const event of events) {
        try {
          // Check if already processed (idempotency)
          const consumerEvent = await this.getConsumerEvent(event.eventId);

          if (consumerEvent?.status === "completed") {
            // Already processed, update checkpoint
            this.lastCheckpoint = event.sequence;
            continue;
          }

          // Check if should retry (exponential backoff)
          if (consumerEvent && consumerEvent.attempts >= this.config.maxAttempts) {
            // Move to DLQ
            await this.markFailed(
              event.eventId,
              event.sequence,
              consumerEvent.lastError || "Max attempts exceeded",
              true
            );
            continue;
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
          } else {
            // Mark as failed
            const shouldRetry = result.shouldRetry !== false;
            const attempts = consumerEvent?.attempts || 1;
            const moveToDLQ = attempts >= this.config.maxAttempts;

            await this.markFailed(event.eventId, event.sequence, result.error || "Processing failed", moveToDLQ);

            if (!moveToDLQ && shouldRetry) {
              // Will retry on next poll (with exponential backoff)
              // Delay is handled by poll interval
            }
          }
        } catch (error) {
          console.error(`[${this.config.name}] Error processing event ${event.eventId}:`, error);
          await this.markFailed(
            event.eventId,
            event.sequence,
            error instanceof Error ? error.message : String(error),
            false
          );
        }
      }
    } catch (error) {
      console.error(`[${this.config.name}] Error in poll cycle:`, error);
    }
  }

  /**
   * Start the consumer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn(`[${this.config.name}] Already running`);
      return;
    }

    console.log(`[${this.config.name}] Starting...`);
    this.isRunning = true;

    // Get initial checkpoint
    this.lastCheckpoint = await this.getLastCheckpoint();

    // Start polling immediately
    await this.pollAndProcess();

    // Set up interval polling
    this.pollInterval = setInterval(() => {
      this.pollAndProcess();
    }, this.config.pollIntervalMs);

    console.log(`[${this.config.name}] Started (polling every ${this.config.pollIntervalMs}ms)`);
  }

  /**
   * Stop the consumer
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log(`[${this.config.name}] Stopping...`);
    this.isRunning = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    console.log(`[${this.config.name}] Stopped`);
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

    const events = await prisma.eventLog.findMany({
      where,
      orderBy: { sequence: "asc" },
    });

    for (const event of events) {
      // Reset consumer event to allow reprocessing
      await prisma.consumerEvent.deleteMany({
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

