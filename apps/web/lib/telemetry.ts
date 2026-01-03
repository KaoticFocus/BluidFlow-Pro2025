/**
 * Telemetry Helper
 * 
 * Integrates with PostHog, Amplitude, or Segment when available.
 * Falls back to console.log in development.
 * 
 * @todo Integrate with repo''s preferred telemetry provider
 */

export type TelemetryEvent = 
  | "home.viewed"
  | "home.tile_clicked"
  | "dashboard.viewed"
  | "dashboard.kpi_clicked"
  | "dashboard.chart_drilldown"
  | "dashboard.list_clicked";

export interface TelemetryPayload {
  [key: string]: unknown;
}

// Check if we have a telemetry provider
const hasPostHog = typeof window !== "undefined" && "posthog" in window;
const hasAmplitude = typeof window !== "undefined" && "amplitude" in window;

/**
 * Track a telemetry event
 * 
 * @param event - Event name
 * @param properties - Event properties
 */
export function trackEvent(event: TelemetryEvent, properties?: TelemetryPayload): void {
  const payload = {
    event,
    ...properties,
    timestamp: new Date().toISOString(),
  };

  // Try PostHog first
  if (hasPostHog) {
    try {
      (window as unknown as { posthog: { capture: (e: string, p: object) => void } }).posthog.capture(event, payload);
      return;
    } catch {
      // Fall through to console
    }
  }

  // Try Amplitude
  if (hasAmplitude) {
    try {
      (window as unknown as { amplitude: { track: (e: string, p: object) => void } }).amplitude.track(event, payload);
      return;
    } catch {
      // Fall through to console
    }
  }

  // Development fallback
  if (process.env.NODE_ENV === "development") {
    console.debug("[Telemetry]", event, properties);
  }
}

/**
 * Track page view
 */
export function trackPageView(page: string, properties?: TelemetryPayload): void {
  trackEvent("home.viewed" as TelemetryEvent, { page, ...properties });
}

/**
 * Identify user for telemetry
 * 
 * @param userId - User ID
 * @param traits - User traits (email, name, etc.)
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (hasPostHog) {
    try {
      (window as unknown as { posthog: { identify: (id: string, traits?: object) => void } }).posthog.identify(userId, traits);
      return;
    } catch {
      // Ignore
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[Telemetry] Identify:", userId, traits);
  }
}