/**
 * PII detection and redaction utilities
 */

import { PIIType, RedactionSummary } from "./types";

// ============================================================================
// PII PATTERNS
// ============================================================================

interface PIIPattern {
  type: PIIType;
  pattern: RegExp;
  replacement: string;
}

const PII_PATTERNS: PIIPattern[] = [
  // Email addresses
  {
    type: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: "[EMAIL_REDACTED]",
  },
  // Phone numbers (various formats)
  {
    type: "phone",
    pattern: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    replacement: "[PHONE_REDACTED]",
  },
  // SSN (XXX-XX-XXXX)
  {
    type: "ssn",
    pattern: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
    replacement: "[SSN_REDACTED]",
  },
  // Credit card numbers
  {
    type: "credit_card",
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    replacement: "[CC_REDACTED]",
  },
  // US Street addresses (simplified)
  {
    type: "address",
    pattern: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)\.?\s*,?\s*(?:[A-Za-z\s]+,?\s*)?(?:[A-Z]{2})?\s*\d{5}(?:-\d{4})?\b/gi,
    replacement: "[ADDRESS_REDACTED]",
  },
  // IP addresses
  {
    type: "ip_address",
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: "[IP_REDACTED]",
  },
  // Driver's license (simplified US patterns)
  {
    type: "driver_license",
    pattern: /\b[A-Z]{1,2}\d{6,8}\b/g,
    replacement: "[DL_REDACTED]",
  },
];

// ============================================================================
// REDACTION FUNCTIONS
// ============================================================================

export interface RedactionResult {
  redactedText: string;
  summary: RedactionSummary;
  piiDetected: boolean;
}

/**
 * Detect and redact PII from text
 */
export function redactPII(text: string): RedactionResult {
  let redactedText = text;
  const foundPII: Map<PIIType, number> = new Map();
  const fieldsRedacted: string[] = [];

  for (const { type, pattern, replacement } of PII_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      foundPII.set(type, (foundPII.get(type) || 0) + matches.length);
      fieldsRedacted.push(`${type} (${matches.length})`);
      redactedText = redactedText.replace(pattern, replacement);
    }
  }

  const piiTypes = Array.from(foundPII.keys());
  const piiDetected = piiTypes.length > 0;

  return {
    redactedText,
    piiDetected,
    summary: {
      fieldsRedacted,
      piiTypes,
    },
  };
}

/**
 * Check if text contains PII without redacting
 */
export function containsPII(text: string): boolean {
  for (const { pattern } of PII_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
  }
  return false;
}

/**
 * Get PII types found in text
 */
export function detectPIITypes(text: string): PIIType[] {
  const types: PIIType[] = [];
  
  for (const { type, pattern } of PII_PATTERNS) {
    if (pattern.test(text)) {
      types.push(type);
    }
    pattern.lastIndex = 0;
  }
  
  return types;
}

// ============================================================================
// TRANSCRIPT-SPECIFIC REDACTION
// ============================================================================

export interface TranscriptSegment {
  id: string | number;
  text: string;
  start: number;
  end: number;
}

export interface RedactedTranscriptResult {
  textRaw: string;
  textRedacted: string;
  segments: Array<TranscriptSegment & { textRedacted: string }>;
  summary: RedactionSummary;
  piiDetected: boolean;
}

/**
 * Redact PII from a transcript with segments
 */
export function redactTranscript(
  segments: TranscriptSegment[]
): RedactedTranscriptResult {
  const allPII: Map<PIIType, number> = new Map();
  const fieldsRedacted: string[] = [];

  const redactedSegments = segments.map((segment) => {
    const result = redactPII(segment.text);
    
    // Aggregate PII counts
    for (const type of result.summary.piiTypes) {
      allPII.set(type, (allPII.get(type) || 0) + 1);
    }
    
    return {
      ...segment,
      textRedacted: result.redactedText,
    };
  });

  // Build full text
  const textRaw = segments.map((s) => s.text).join(" ");
  const textRedacted = redactedSegments.map((s) => s.textRedacted).join(" ");

  // Build summary
  for (const [type, count] of allPII) {
    fieldsRedacted.push(`${type} (${count})`);
  }

  return {
    textRaw,
    textRedacted,
    segments: redactedSegments,
    piiDetected: allPII.size > 0,
    summary: {
      fieldsRedacted,
      piiTypes: Array.from(allPII.keys()),
    },
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create a hash of the original text for verification
 */
export async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate that redacted text doesn't contain known PII patterns
 */
export function validateRedaction(redactedText: string): boolean {
  return !containsPII(redactedText);
}

