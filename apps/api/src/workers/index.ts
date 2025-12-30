/**
 * Worker registry and initialization
 * Workers process outbox events asynchronously
 */

import { startTranscriptConsumer } from "./consumers/transcriptReady";
import { startOutboxRelay } from "./outbox-relay.worker";

let workersRunning = false;

/**
 * Start all workers
 * Should be called after database connection is established
 */
export async function startWorkers() {
  if (workersRunning) {
    console.warn("Workers already running");
    return;
  }

  console.log("Starting workers...");

  // Start outbox relay (moves events from outbox to event_log)
  await startOutboxRelay();

  // Start transcript consumer
  await startTranscriptConsumer();

  workersRunning = true;
  console.log("All workers started");
}

/**
 * Stop all workers
 */
export async function stopWorkers() {
  if (!workersRunning) {
    return;
  }

  console.log("Stopping workers...");
  
  // Import stop functions
  const { stopOutboxRelay } = await import("./outbox-relay.worker");
  const { stopTranscriptConsumer } = await import("./consumers/transcriptReady");

  await Promise.all([
    stopOutboxRelay(),
    stopTranscriptConsumer(),
  ]);

  workersRunning = false;
  console.log("All workers stopped");
}

