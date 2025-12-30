/**
 * Worker registry and initialization
 * Workers process outbox events asynchronously
 */

import { startTranscriptConsumer } from "./consumers/transcriptReady";

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
  // TODO: Implement graceful shutdown
  workersRunning = false;
  console.log("All workers stopped");
}

