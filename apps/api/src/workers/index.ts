/**
 * Worker registry and initialization
 * Workers process outbox events asynchronously
 */

import { startTranscriptConsumer } from "./consumers/transcriptReady";
import { startOutboxRelay } from "./outbox-relay.worker";
import { captureException, setContext } from "../lib/sentry";
import { logger } from "../lib/logger";

let workersRunning = false;

/**
 * Start all workers
 * Should be called after database connection is established
 */
export async function startWorkers() {
  if (workersRunning) {
    logger.warn("Workers already running");
    return;
  }

  logger.info("Starting workers...");

  try {
    // Start outbox relay (moves events from outbox to event_log)
    await startOutboxRelay();

    // Start transcript consumer
    await startTranscriptConsumer();

    workersRunning = true;
    logger.info("All workers started");
  } catch (error) {
    logger.error("Failed to start workers", error);
    captureException(error instanceof Error ? error : new Error(String(error)), {
      component: "worker_registry",
    });
    throw error;
  }
}

/**
 * Stop all workers
 */
export async function stopWorkers() {
  if (!workersRunning) {
    return;
  }

  logger.info("Stopping workers...");
  
  try {
    // Import stop functions
    const { stopOutboxRelay } = await import("./outbox-relay.worker");
    const { stopTranscriptConsumer } = await import("./consumers/transcriptReady");

    await Promise.all([
      stopOutboxRelay(),
      stopTranscriptConsumer(),
    ]);

    workersRunning = false;
    logger.info("All workers stopped");
  } catch (error) {
    logger.error("Error stopping workers", error);
    captureException(error instanceof Error ? error : new Error(String(error)), {
      component: "worker_registry",
    });
  }
}

