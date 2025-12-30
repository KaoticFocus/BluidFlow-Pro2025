/**
 * Outbox Relay Worker
 * Polls outbox table and moves events to event_log
 * Uses BullMQ for job queue management (optional, can run as simple poller)
 */

import { relayOutboxEvents, getRelayMetrics } from "../lib/event-relay";

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
      console.log(
        `[Outbox Relay] Processed: ${result.processed}, Failed: ${result.failed}, Skipped: ${result.skipped}`
      );
    }
  } catch (error) {
    console.error("[Outbox Relay] Error in poll cycle:", error);
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
    console.log(
      `[Outbox Relay Metrics] Pending: ${metrics.pendingCount}, Published: ${metrics.publishedCount}, Failed: ${metrics.failedCount}, DLQ: ${metrics.dlqCount}, Avg Lag: ${metrics.avgLagMs}ms`
    );
  } catch (error) {
    console.error("[Outbox Relay] Error getting metrics:", error);
  }
}

/**
 * Start the outbox relay worker
 */
export async function startOutboxRelay() {
  if (isRunning) {
    console.warn("[Outbox Relay] Already running");
    return;
  }

  console.log("[Outbox Relay] Starting...");
  isRunning = true;

  // Start polling immediately
  await pollAndRelay();

  // Set up interval polling
  pollInterval = setInterval(pollAndRelay, POLL_INTERVAL_MS);

  // Set up metrics logging
  metricsInterval = setInterval(logMetrics, METRICS_LOG_INTERVAL_MS);

  console.log(`[Outbox Relay] Started (polling every ${POLL_INTERVAL_MS}ms)`);
}

/**
 * Stop the outbox relay worker
 */
export async function stopOutboxRelay() {
  if (!isRunning) {
    return;
  }

  console.log("[Outbox Relay] Stopping...");
  isRunning = false;

  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }

  console.log("[Outbox Relay] Stopped");
}

