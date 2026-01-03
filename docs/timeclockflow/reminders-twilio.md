## Reminder rules & Twilio Integration

- Rules (examples):
  - Clock-in reminder: 10 min after default shift start if no open time span.
  - Clock-out reminder: 15 min after default shift end if span still open.
  - Quiet hours: do not send between 20:00–07:00 local.
- Preferences: per-employee timezone, channels (SMS/email), grace windows, geofence required flag.
- Queue flow:
  1) Cron/worker scans preferences and timesheets → enqueue reminder jobs with idempotency keys.
  2) Sender worker dispatches via Twilio Resend/Twilio (SMS) and records provider_message_id.
- Twilio setup:
  - Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM.
  - Webhook (optional): delivery status updates → update reminder_deliveries.
- Idempotency & audit:
  - Deduplicate by (employeeId, type, scheduled_for) to avoid spam.
  - Write audit rows for every send and status change.
- RBAC:
  - Managers/Owners can configure rules; Field can view their own reminders history.