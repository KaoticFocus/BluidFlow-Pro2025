export function track(event: string, payload?: Record<string, any>) {
  // TODO: Integrate real telemetry (PostHog, Amplitude, or your existing logger)
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[telemetry]", event, payload ?? {});
  }
}
