import { z } from "zod";

// ============================================================================
// EVENT BASE
// ============================================================================

export const BaseEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string(),
  version: z.literal(1),
  occurredAt: z.coerce.date(),
  tenantId: z.string().uuid(),
  actorUserId: z.string().uuid().nullable(),
  traceId: z.string().nullable(),
  correlationId: z.string().nullable(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

// ============================================================================
// AUTH EVENTS
// ============================================================================

export const UserCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("user.created.v1"),
  payload: z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
  }),
});

export type UserCreatedEvent = z.infer<typeof UserCreatedEventSchema>;

export const UserSignedInEventSchema = BaseEventSchema.extend({
  eventType: z.literal("user.signed_in.v1"),
  payload: z.object({
    userId: z.string().uuid(),
    sessionId: z.string().uuid(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
  }),
});

export type UserSignedInEvent = z.infer<typeof UserSignedInEventSchema>;

export const UserSignedOutEventSchema = BaseEventSchema.extend({
  eventType: z.literal("user.signed_out.v1"),
  payload: z.object({
    userId: z.string().uuid(),
    sessionId: z.string().uuid(),
  }),
});

export type UserSignedOutEvent = z.infer<typeof UserSignedOutEventSchema>;

// ============================================================================
// TENANT EVENTS
// ============================================================================

export const TenantCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("tenant.created.v1"),
  payload: z.object({
    tenantId: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    ownerUserId: z.string().uuid(),
  }),
});

export type TenantCreatedEvent = z.infer<typeof TenantCreatedEventSchema>;

export const MemberInvitedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("tenant.member.invited.v1"),
  payload: z.object({
    invitationId: z.string().uuid(),
    email: z.string().email(),
    roleIds: z.array(z.string().uuid()),
    invitedById: z.string().uuid(),
    expiresAt: z.coerce.date(),
  }),
});

export type MemberInvitedEvent = z.infer<typeof MemberInvitedEventSchema>;

export const MemberJoinedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("tenant.member.joined.v1"),
  payload: z.object({
    membershipId: z.string().uuid(),
    userId: z.string().uuid(),
    roleIds: z.array(z.string().uuid()),
  }),
});

export type MemberJoinedEvent = z.infer<typeof MemberJoinedEventSchema>;

export const MemberRolesChangedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("tenant.member.roles_changed.v1"),
  payload: z.object({
    membershipId: z.string().uuid(),
    userId: z.string().uuid(),
    previousRoleIds: z.array(z.string().uuid()),
    newRoleIds: z.array(z.string().uuid()),
  }),
});

export type MemberRolesChangedEvent = z.infer<typeof MemberRolesChangedEventSchema>;

// ============================================================================
// CONSENT EVENTS
// ============================================================================

export const ConsentCapturedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("consent.captured.v1"),
  payload: z.object({
    consentId: z.string().uuid(),
    subjectType: z.string(),
    subjectId: z.string().uuid(),
    purposeKey: z.string(),
    channel: z.string().nullable(),
    policyHash: z.string(),
  }),
});

export type ConsentCapturedEvent = z.infer<typeof ConsentCapturedEventSchema>;

export const ConsentRevokedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("consent.revoked.v1"),
  payload: z.object({
    consentId: z.string().uuid(),
    subjectType: z.string(),
    subjectId: z.string().uuid(),
    purposeKey: z.string(),
    revokedById: z.string().uuid().nullable(),
    reason: z.string().nullable(),
  }),
});

export type ConsentRevokedEvent = z.infer<typeof ConsentRevokedEventSchema>;

// ============================================================================
// AI ACTION EVENTS
// ============================================================================

export const AIActionLoggedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("ai.action.logged.v1"),
  payload: z.object({
    actionId: z.string().uuid(),
    model: z.string(),
    outputKind: z.string(),
    requiresReview: z.boolean(),
    inputRefTable: z.string().nullable(),
    inputRefId: z.string().uuid().nullable(),
    tokenUsage: z.object({
      prompt: z.number(),
      completion: z.number(),
      total: z.number(),
    }),
    estimatedCostUsd: z.number().nullable(),
  }),
});

export type AIActionLoggedEvent = z.infer<typeof AIActionLoggedEventSchema>;

export const AIActionApprovedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("ai.action.approved.v1"),
  payload: z.object({
    actionId: z.string().uuid(),
    decisionId: z.string().uuid(),
    reviewerUserId: z.string().uuid(),
    reason: z.string().nullable(),
    plannedSideEffectsCount: z.number(),
  }),
});

export type AIActionApprovedEvent = z.infer<typeof AIActionApprovedEventSchema>;

export const AIActionRejectedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("ai.action.rejected.v1"),
  payload: z.object({
    actionId: z.string().uuid(),
    decisionId: z.string().uuid(),
    reviewerUserId: z.string().uuid(),
    reason: z.string().nullable(),
  }),
});

export type AIActionRejectedEvent = z.infer<typeof AIActionRejectedEventSchema>;

export const AIActionExecutedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("ai.action.executed.v1"),
  payload: z.object({
    actionId: z.string().uuid(),
    sideEffectId: z.string().uuid(),
    effectType: z.string(),
    targetRef: z.string().nullable(),
    success: z.boolean(),
    error: z.string().nullable(),
  }),
});

export type AIActionExecutedEvent = z.infer<typeof AIActionExecutedEventSchema>;

// ============================================================================
// EVENT TYPES UNION
// ============================================================================

export type FoundationEvent =
  | UserCreatedEvent
  | UserSignedInEvent
  | UserSignedOutEvent
  | TenantCreatedEvent
  | MemberInvitedEvent
  | MemberJoinedEvent
  | MemberRolesChangedEvent
  | ConsentCapturedEvent
  | ConsentRevokedEvent
  | AIActionLoggedEvent
  | AIActionApprovedEvent
  | AIActionRejectedEvent
  | AIActionExecutedEvent;

export const FOUNDATION_EVENT_TYPES = [
  "user.created.v1",
  "user.signed_in.v1",
  "user.signed_out.v1",
  "tenant.created.v1",
  "tenant.member.invited.v1",
  "tenant.member.joined.v1",
  "tenant.member.roles_changed.v1",
  "consent.captured.v1",
  "consent.revoked.v1",
  "ai.action.logged.v1",
  "ai.action.approved.v1",
  "ai.action.rejected.v1",
  "ai.action.executed.v1",
] as const;

export type FoundationEventType = (typeof FOUNDATION_EVENT_TYPES)[number];

