# TimeClockFlow Reminders — Twilio Integration

> **Last updated:** 2026-01-03  
> **Status:** Draft

## Overview

This document covers the SMS reminder system using Twilio for TimeClockFlow notifications. It handles late clock-in reminders, missing clock-out alerts, and break notifications.

## Use Cases

### 1. Late Clock-In Reminder

**Trigger:** User has not clocked in by expected time + grace period

**Configuration:**
```json
{
  "rule_key": "late_clock_in",
  "payload": {
    "expectedClockIn": "07:00",
    "gracePeriodMinutes": 15,
    "timezone": "America/New_York"
  }
}
```

**Logic:**
1. Job runs every 5 minutes
2. For each active reminder with `rule_key = 'late_clock_in'`:
   - Check if current time > expectedClockIn + gracePeriod
   - Check if user has clocked in today
   - If no clock-in and within reminder window: send SMS

**Message Template:**
```
BuildFlow: Reminder to clock in! You were expected at 7:00 AM.
Open app: https://buildflow.pro/timeclock

Reply STOP to opt out
```

---

### 2. Missing Clock-Out Reminder

**Trigger:** User clocked in but hasn't clocked out by expected end time

**Configuration:**
```json
{
  "rule_key": "missing_clock_out",
  "payload": {
    "expectedClockOut": "16:00",
    "gracePeriodMinutes": 30,
    "timezone": "America/New_York"
  }
}
```

**Message Template:**
```
BuildFlow: Don't forget to clock out! Your shift started at 7:00 AM.
Open app: https://buildflow.pro/timeclock

Reply STOP to opt out
```

---

### 3. Break Overrun Reminder

**Trigger:** User on break exceeding allowed duration

**Configuration:**
```json
{
  "rule_key": "break_overrun",
  "payload": {
    "maxBreakMinutes": 30,
    "warningAtMinutes": 25
  }
}
```

**Message Template:**
```
BuildFlow: Your break has exceeded 30 minutes. Please return to work.

Reply STOP to opt out
```

---

## Message Templates

### Template Storage

Templates stored in database or config file:

```typescript
const TEMPLATES = {
  late_clock_in: {
    body: "BuildFlow: Reminder to clock in! You were expected at {{expectedTime}}.\nOpen app: {{appUrl}}\n\nReply STOP to opt out",
    variables: ["expectedTime", "appUrl"],
  },
  missing_clock_out: {
    body: "BuildFlow: Don't forget to clock out! Your shift started at {{clockInTime}}.\nOpen app: {{appUrl}}\n\nReply STOP to opt out",
    variables: ["clockInTime", "appUrl"],
  },
  break_overrun: {
    body: "BuildFlow: Your break has exceeded {{maxMinutes}} minutes. Please return to work.\n\nReply STOP to opt out",
    variables: ["maxMinutes"],
  },
};
```

### Variable Substitution

```typescript
function renderTemplate(templateKey: string, variables: Record<string, string>): string {
  let body = TEMPLATES[templateKey].body;
  for (const [key, value] of Object.entries(variables)) {
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return body;
}
```

## Throttling

### Rules

1. **Per-user throttle:** Max 1 SMS per rule per user per 2 hours
2. **Daily cap:** Max 5 SMS per user per day
3. **Quiet hours:** No SMS between 9 PM and 6 AM (user's timezone)

### Implementation

```typescript
async function canSendReminder(userId: string, ruleKey: string): Promise<boolean> {
  const redis = getRedis();
  
  // Check per-rule throttle
  const ruleKey = `throttle:${userId}:${ruleKey}`;
  if (await redis.exists(ruleKey)) return false;
  
  // Check daily cap
  const dailyKey = `sms_count:${userId}:${today()}`;
  const count = parseInt(await redis.get(dailyKey) || '0');
  if (count >= 5) return false;
  
  // Check quiet hours
  const userTz = await getUserTimezone(userId);
  const localHour = moment().tz(userTz).hour();
  if (localHour >= 21 || localHour < 6) return false;
  
  return true;
}

async function markReminderSent(userId: string, ruleKey: string): Promise<void> {
  const redis = getRedis();
  
  // Set rule throttle (2 hours)
  await redis.setex(`throttle:${userId}:${ruleKey}`, 7200, '1');
  
  // Increment daily count
  await redis.incr(`sms_count:${userId}:${today()}`);
  await redis.expire(`sms_count:${userId}:${today()}`, 86400);
}
```

## Opt-In/Opt-Out

### Opt-In Flow

1. User enables SMS reminders in settings
2. Prompt for phone number verification
3. Send verification code via Twilio Verify
4. User enters code
5. On success: create reminder record with `opt_in_at`
6. Store phone number (encrypted)

### Opt-Out Flow

**Via Settings:**
1. User disables SMS reminders
2. Set `is_active = false`, `opt_out_at = now()`

**Via SMS Reply:**
1. User replies "STOP" to any message
2. Twilio webhook receives opt-out
3. Update all reminders for that phone number

### Webhook Handler

```typescript
// POST /webhooks/twilio/sms
app.post('/webhooks/twilio/sms', async (c) => {
  const { From, Body } = await c.req.parseBody();
  
  if (Body.toUpperCase().includes('STOP')) {
    await handleOptOut(From);
    return c.text('Opt-out processed');
  }
  
  // Handle other keywords if needed
  return c.text('OK');
});

async function handleOptOut(phoneNumber: string): Promise<void> {
  await prisma.reminder.updateMany({
    where: { phoneNumber },
    data: { isActive: false, optOutAt: new Date() },
  });
  
  // Log for compliance
  await createAuditLog({
    entityType: 'reminder',
    action: 'opt_out',
    payload: { phoneNumber: maskPhone(phoneNumber) },
  });
}
```

## Twilio Implementation

### Send SMS

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSms(to: string, body: string): Promise<string> {
  const message = await client.messages.create({
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
    body,
    statusCallback: `${process.env.API_URL}/webhooks/twilio/status`,
  });
  
  return message.sid;
}
```

### Status Webhook

```typescript
// POST /webhooks/twilio/status
app.post('/webhooks/twilio/status', async (c) => {
  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = await c.req.parseBody();
  
  // Update notification record
  await prisma.notification.updateMany({
    where: { externalId: MessageSid },
    data: {
      status: mapTwilioStatus(MessageStatus),
      errorMessage: ErrorMessage || null,
    },
  });
  
  // Alert on failures
  if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
    await alertOnDeliveryFailure(MessageSid, ErrorCode, ErrorMessage);
  }
  
  return c.text('OK');
});

function mapTwilioStatus(status: string): string {
  const map: Record<string, string> = {
    queued: 'pending',
    sent: 'sent',
    delivered: 'delivered',
    failed: 'failed',
    undelivered: 'failed',
  };
  return map[status] || 'unknown';
}
```

## Retry Logic

### Retry Policy

| Attempt | Delay | Max Retries |
|---------|-------|-------------|
| 1 | Immediate | - |
| 2 | 5 minutes | 3 |
| 3 | 15 minutes | - |
| 4 | Give up | - |

### Implementation

```typescript
// BullMQ job options
const jobOptions = {
  attempts: 4,
  backoff: {
    type: 'custom',
    delay: (attemptsMade: number) => {
      const delays = [0, 5 * 60 * 1000, 15 * 60 * 1000];
      return delays[attemptsMade - 1] || 15 * 60 * 1000;
    },
  },
  removeOnComplete: true,
  removeOnFail: false, // Keep for debugging
};
```

## Idempotency

Prevent duplicate sends using idempotency keys:

```typescript
function generateIdempotencyKey(userId: string, ruleKey: string, date: string): string {
  return `sms:${userId}:${ruleKey}:${date}`;
}

async function sendReminderIfNotSent(
  userId: string,
  ruleKey: string,
  phoneNumber: string,
  body: string
): Promise<void> {
  const idempotencyKey = generateIdempotencyKey(userId, ruleKey, today());
  
  // Check if already sent
  const existing = await prisma.notification.findUnique({
    where: { idempotencyKey },
  });
  
  if (existing) {
    console.log('Reminder already sent today');
    return;
  }
  
  // Create notification record first (pending)
  const notification = await prisma.notification.create({
    data: {
      userId,
      orgId: await getUserOrgId(userId),
      channel: 'sms',
      templateKey: ruleKey,
      idempotencyKey,
      status: 'pending',
    },
  });
  
  // Send via Twilio
  try {
    const sid = await sendSms(phoneNumber, body);
    await prisma.notification.update({
      where: { id: notification.id },
      data: { externalId: sid, sentAt: new Date() },
    });
  } catch (error) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'failed', errorMessage: error.message },
    });
    throw error; // Trigger retry
  }
}
```

## Observability

### Metrics

| Metric | Type | Labels |
|--------|------|--------|
| `timeclock_sms_sent_total` | Counter | rule_key, status |
| `timeclock_sms_delivery_rate` | Gauge | |
| `timeclock_sms_latency_seconds` | Histogram | |
| `timeclock_opt_out_total` | Counter | |

### Logs

```json
{
  "level": "info",
  "event": "sms_sent",
  "userId": "user-uuid",
  "ruleKey": "late_clock_in",
  "twilioSid": "SM...",
  "duration_ms": 234
}
```

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| SMS failure spike | Failure rate > 10% for 15 min | Warning |
| Twilio API errors | 5xx errors > 5 in 5 min | Critical |
| Queue backlog | > 500 pending reminders | Warning |
| Opt-out spike | > 10 opt-outs/hour | Info |

## Compliance

### Requirements

1. Include opt-out instructions in every message
2. Honor opt-outs within 24 hours (we do immediately)
3. Maintain opt-in/opt-out records for 4 years
4. Don't send to numbers on Do Not Call list
5. Include business identification in messages

### Audit Trail

Store for compliance:
- Opt-in timestamp and method
- Every message sent (template, recipient, timestamp)
- Opt-out timestamp and method
- Delivery status

## Environment Variables

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxx  # For phone verification
```
