/**
 * Outbox Relay Worker
 * Polls outbox table and moves events to event_log
 * Uses BullMQ for job queue management (optional, can run as simple poller)
 */

import { relayOutboxEvents, getRelayMetrics } from "../lib/event-relay";
import { captureException, setContext } from "../lib/sentry";
import { logger } from "../lib/logger";

const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
const METRICS_LOG_INTERVAL_MS = 60000; // Log metrics every minute

let isRunning = false;
let pollInterval: NodeJS.Timeout | null = null;
let metricsInterval: NodeJS.Timeout | null = null;

/**
 * Poll and process outbox events
 */
async function pollAndRelay() {
  if (!isRunning) {
    return;
  }

  try {
    const result = await relayOutboxEvents();

    if (result.processed > 0 || result.failed > 0) {
      logger.info("Outbox relay batch processed", {
        processed: result.processed,
        failed: result.failed,
        skipped: result.skipped,
      });
    }
  } catch (error) {
    logger.error("[Outbox Relay] Error in poll cycle", error);
    captureException(error instanceof Error ? error : new Error(String(error)), {
      component: "outbox_relay",
    });
  }
}

/**
 * Log relay metrics periodically
 */
async function logMetrics() {
  if (!isRunning) {
    return;
  }

  try {
    const metrics = await getRelayMetrics();
    logger.info("Outbox relay metrics", metrics);
    
    // Set Sentry context for monitoring
    setContext("outbox_relay_metrics", metrics);
  } catch (error) {
    logger.error("[Outbox Relay] Error getting metrics", error);
  }
}

/**
 * Start the outbox relay worker
 */
export async function startOutboxRelay() {
  if (isRunning) {
    logger.warn("[Outbox Relay] Already running");
    return;
  }

  logger.info("[Outbox Relay] Starting...");
  isRunning = true;

  try {
    // Start polling immediately
    await pollAndRelay();

    // Set up interval polling
    pollInterval = setInterval(pollAndRelay, POLL_INTERVAL_MS);

    // Set up metrics logging
    metricsInterval = setInterval(logMetrics, METRICS_LOG_INTERVAL_MS);

    logger.info(`[Outbox Relay] Started (polling every ${POLL_INTERVAL_MS}ms)`);
  } catch (error) {
    logger.error("[Outbox Relay] Failed to start", error);
    captureException(error instanceof Error ? error : new Error(String(error)), {
      component: "outbox_relay",
    });
    isRunning = false;
    throw error;
  }
}

/**
 * Stop the outbox relay worker
 */
export async function stopOutboxRelay() {
  if (!isRunning) {
    return;
  }

  logger.info("[Outbox Relay] Stopping...");
  isRunning = false;

  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }

  logger.info("[Outbox Relay] Stopped");
}

