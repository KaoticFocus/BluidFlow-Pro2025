"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/telemetry";

/**
 * Client component for Home page telemetry
 * Fires home.viewed once on page load
 */
export function HomePageClient() {
  useEffect(() => {
    trackEvent("home.viewed", { page: "/home" });
  }, []);

  return null;
}