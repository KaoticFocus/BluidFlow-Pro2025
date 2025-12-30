/**
 * Redis client for BullMQ queues
 */

import Redis from "ioredis";

let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 */
export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableReadyCheck: true,
    enableOfflineQueue: false,
  });

  redisClient.on("error", (error) => {
    console.error("Redis client error:", error);
  });

  redisClient.on("connect", () => {
    console.log("Redis client connected");
  });

  redisClient.on("ready", () => {
    console.log("Redis client ready");
  });

  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedisClient() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

