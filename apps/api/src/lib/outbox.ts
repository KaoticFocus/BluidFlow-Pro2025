/**
 * Outbox pattern helper for reliable event publishing
 * Events are written to the outbox table in the same transaction as domain changes,
 * then published asynchronously by a worker.
 */

import { randomUUID } from "node:crypto";

export interface OutboxEventInput {
  tenantId: string;
  eventType: string;
  aggregateId?: string;
  payload: Record<string, unknown>;
  dedupeKey?: string;
  actorUserId?: string | null;
  traceId?: string | null;
  correlationId?: string | null;
}

export interface OutboxEvent {
  id: string;
  tenantId: string;
  eventType: string;
  aggregateId: string | null;
  payload: Record<string, unknown>;
  dedupeKey: string | null;
  status: "pending" | "published" | "failed";
  attempts: number;
  lastError: string | null;
  occurredAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
}

/**
 * Create an outbox event record
 * Call this within the same database transaction as your domain changes
 */
export function createOutboxEvent(input: OutboxEventInput): any {
  const now = new Date();
  
  return {
    tenantId: input.tenantId,
    eventType: input.eventType,
    aggregateId: input.aggregateId ?? null,
    payload: {
      ...input.payload,
      eventId: randomUUID(),
      eventType: input.eventType,
      version: 1,
      occurredAt: now.toISOString(),
      tenantId: input.tenantId,
      actorUserId: input.actorUserId ?? null,
      traceId: input.traceId ?? null,
      correlationId: input.correlationId ?? null,
    },
    dedupeKey: input.dedupeKey ?? null,
    status: "pending",
    attempts: 0,
    lastError: null,
    occurredAt: now,
    publishedAt: null,
  };
}

/**
 * Generate a deterministic dedupe key for idempotent event publishing
 */
export function generateDedupeKey(
  eventType: string,
  aggregateId: string,
  ...additionalKeys: string[]
): string {
  return [eventType, aggregateId, ...additionalKeys].join(":");
}

/**
 * Event type constants for foundation module
 */
export const FOUNDATION_EVENTS = {
  USER_CREATED: "user.created.v1",
  USER_SIGNED_IN: "user.signed_in.v1",
  USER_SIGNED_OUT: "user.signed_out.v1",
  TENANT_CREATED: "tenant.created.v1",
  MEMBER_INVITED: "tenant.member.invited.v1",
  MEMBER_JOINED: "tenant.member.joined.v1",
  MEMBER_ROLES_CHANGED: "tenant.member.roles_changed.v1",
  ROLE_CREATED: "role.created.v1",
  ROLE_PERMISSIONS_UPDATED: "role.permissions.updated.v1",
  CONSENT_CAPTURED: "consent.captured.v1",
  CONSENT_REVOKED: "consent.revoked.v1",
  AI_ACTION_LOGGED: "ai.action.logged.v1",
  AI_ACTION_APPROVED: "ai.action.approved.v1",
  AI_ACTION_REJECTED: "ai.action.rejected.v1",
  AI_ACTION_EXECUTED: "ai.action.executed.v1",
} as const;

export type FoundationEventType = (typeof FOUNDATION_EVENTS)[keyof typeof FOUNDATION_EVENTS];

