/**
 * Feature Flags Configuration
 * 
 * Reads feature flags from environment variables.
 * Pattern: NEXT_PUBLIC_FEATURE_{MODULE}=true|false|coming_soon
 * 
 * Or use a single JSON env var: NEXT_PUBLIC_FEATURES='{"tasks":true,"meetings":"coming_soon"}'
 */

export type FeatureStatus = boolean | "coming_soon";

export interface FeatureFlags {
  tasks: FeatureStatus;
  meetings: FeatureStatus;
  leads: FeatureStatus;
  schedule: FeatureStatus;
  timeclock: FeatureStatus;
  documents: FeatureStatus;
  ai: FeatureStatus;
}

const DEFAULT_FLAGS: FeatureFlags = {
  tasks: true,
  meetings: true,
  leads: true,
  schedule: true,
  timeclock: true,
  documents: true,
  ai: true,
};

function parseFeatureValue(value: string | undefined): FeatureStatus {
  if (!value) return true; // Default to enabled
  if (value === "false") return false;
  if (value === "coming_soon") return "coming_soon";
  return true;
}

/**
 * Get all feature flags from environment
 */
export function getFeatureFlags(): FeatureFlags {
  // Check for JSON env var first
  const featuresJson = process.env.NEXT_PUBLIC_FEATURES;
  if (featuresJson) {
    try {
      const parsed = JSON.parse(featuresJson);
      return { ...DEFAULT_FLAGS, ...parsed };
    } catch {
      console.warn("[FeatureFlags] Failed to parse NEXT_PUBLIC_FEATURES JSON");
    }
  }

  // Fall back to individual env vars
  return {
    tasks: parseFeatureValue(process.env.NEXT_PUBLIC_FEATURE_TASKS),
    meetings: parseFeatureValue(process.env.NEXT_PUBLIC_FEATURE_MEETINGS),
    leads: parseFeatureValue(process.env.NEXT_PUBLIC_FEATURE_LEADS),
    schedule: parseFeatureValue(process.env.NEXT_PUBLIC_FEATURE_SCHEDULE),
    timeclock: parseFeatureValue(process.env.NEXT_PUBLIC_FEATURE_TIMECLOCK),
    documents: parseFeatureValue(process.env.NEXT_PUBLIC_FEATURE_DOCUMENTS),
    ai: parseFeatureValue(process.env.NEXT_PUBLIC_FEATURE_AI),
  };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature] === true;
}

/**
 * Check if a feature is "coming soon"
 */
export function isFeatureComingSoon(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature] === "coming_soon";
}

/**
 * Check if a feature should be shown (enabled or coming soon)
 */
export function shouldShowFeature(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature] !== false;
}