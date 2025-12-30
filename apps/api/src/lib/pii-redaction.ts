/**
 * PII Redaction Pipeline
 * Detects and redacts PII from event payloads before storing in event_log
 * Supports regex-based detection and optional OpenAI-based advanced detection
 */

import { logger } from "./logger";

export type PIIType = "email" | "phone" | "ssn" | "credit_card" | "address" | "ip_address" | "driver_license" | "name" | "bank_account" | "geo" | "device_id";

export interface PIIRedactionResult {
  redactedPayload: any;
  piiTags: PIIType[];
  piiDetected: boolean;
  redactionSummary: {
    fieldsRedacted: string[];
    piiTypes: PIIType[];
  };
}

// ============================================================================
// PII PATTERNS (Regex-based detection)
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

/**
 * Detect and redact PII from text
 */
function redactText(text: string): { redactedText: string; piiTypes: PIIType[] } {
  let redactedText = text;
  const foundPII: Set<PIIType> = new Set();

  for (const { type, pattern, replacement } of PII_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      foundPII.add(type);
      redactedText = redactedText.replace(pattern, replacement);
    }
    // Reset regex lastIndex
    pattern.lastIndex = 0;
  }

  return {
    redactedText,
    piiTypes: Array.from(foundPII),
  };
}

/**
 * Detect PII types in text without redacting
 */
function detectPIITypes(text: string): PIIType[] {
  const types: Set<PIIType> = new Set();

  for (const { type, pattern } of PII_PATTERNS) {
    if (pattern.test(text)) {
      types.add(type);
    }
    pattern.lastIndex = 0;
  }

  return Array.from(types);
}

/**
 * Deep redaction of JSON payloads
 * Recursively processes objects and arrays to detect and redact PII
 */
export function redactPayloadDeep(payload: any): PIIRedactionResult {
  const allPIITypes: Set<PIIType> = new Set();
  const fieldsRedacted: string[] = [];

  function processValue(value: any, path: string = ""): any {
    if (value === null || value === undefined) {
      return value;
    }

    // Process strings
    if (typeof value === "string") {
      if (value.length === 0) {
        return value;
      }

      // Use regex-based detection
      const result = redactText(value);
      
      if (result.piiTypes.length > 0) {
        // Track PII types found
        for (const piiType of result.piiTypes) {
          allPIITypes.add(piiType);
        }
        
        // Track which fields were redacted
        if (path) {
          fieldsRedacted.push(`${path}: ${result.piiTypes.join(", ")}`);
        } else {
          fieldsRedacted.push(...result.piiTypes);
        }
        
        return result.redactedText;
      }

      return value;
    }

    // Process arrays
    if (Array.isArray(value)) {
      return value.map((item, index) => processValue(item, path ? `${path}[${index}]` : `[${index}]`));
    }

    // Process objects
    if (typeof value === "object") {
      const redacted: any = {};
      
      for (const [key, val] of Object.entries(value)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check field name for sensitive patterns
        const lowerKey = key.toLowerCase();
        const sensitiveFieldPatterns = [
          "password", "passwordhash", "token", "secret", "apikey", "ssn", 
          "creditcard", "cardnumber", "cvv", "email", "phone", "address",
          "socialsecurity", "driverslicense", "license", "ipaddress"
        ];
        
        if (sensitiveFieldPatterns.some(pattern => lowerKey.includes(pattern))) {
          // Redact entire field if it's a string
          if (typeof val === "string" && val.length > 0) {
            const result = redactText(val);
            if (result.piiTypes.length > 0) {
              for (const piiType of result.piiTypes) {
                allPIITypes.add(piiType);
              }
              fieldsRedacted.push(`${currentPath}: ${result.piiTypes.join(", ")}`);
              redacted[key] = result.redactedText;
            } else {
              // Even if no PII detected, redact sensitive field names
              redacted[key] = "[REDACTED]";
              fieldsRedacted.push(`${currentPath}: sensitive_field`);
            }
          } else {
            redacted[key] = "[REDACTED]";
            fieldsRedacted.push(`${currentPath}: sensitive_field`);
          }
        } else {
          // Recursively process nested values
          redacted[key] = processValue(val, currentPath);
        }
      }
      
      return redacted;
    }

    // Return primitives as-is
    return value;
  }

  const redactedPayload = processValue(payload);
  const piiTags = Array.from(allPIITypes);

  return {
    redactedPayload,
    piiTags,
    piiDetected: piiTags.length > 0,
    redactionSummary: {
      fieldsRedacted,
      piiTypes: piiTags,
    },
  };
}

/**
 * Detect PII types in a payload without redacting
 * Useful for tagging events with PII metadata
 */
export function detectPayloadPII(payload: any): PIIType[] {
  const detectedTypes: Set<PIIType> = new Set();

  function scanValue(value: any): void {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === "string" && value.length > 0) {
      const types = detectPIITypes(value);
      for (const type of types) {
        detectedTypes.add(type);
      }
    } else if (Array.isArray(value)) {
      value.forEach(scanValue);
    } else if (typeof value === "object") {
      for (const val of Object.values(value)) {
        scanValue(val);
      }
    }
  }

  scanValue(payload);
  return Array.from(detectedTypes);
}

/**
 * Redact payload with OpenAI-based advanced detection (optional)
 * Falls back to regex-based detection if OpenAI is unavailable
 */
export async function redactPayloadWithAI(
  payload: any,
  options?: {
    useOpenAI?: boolean;
    openAIApiKey?: string;
  }
): Promise<PIIRedactionResult> {
  // For now, use regex-based detection
  // TODO: Add OpenAI-based detection for advanced PII types (names, context-aware detection)
  const result = redactPayloadDeep(payload);

  if (options?.useOpenAI && options?.openAIApiKey) {
    // TODO: Implement OpenAI-based PII detection
    // This would be useful for:
    // - Name detection (requires context)
    // - Bank account numbers (various formats)
    // - Device IDs (various formats)
    // - Geographic coordinates (lat/long)
    logger.debug("OpenAI-based PII detection not yet implemented, using regex-based detection");
  }

  return result;
}

/**
 * Create PII tags array for event headers
 * Format: ["email", "phone", "ssn"]
 */
export function createPIITags(piiTypes: PIIType[]): string[] {
  return piiTypes.map(type => type);
}

/**
 * Validate that redacted payload doesn't contain PII
 * Returns true if validation passes (no PII found)
 */
export function validateRedaction(redactedPayload: any): boolean {
  const detected = detectPayloadPII(redactedPayload);
  return detected.length === 0;
}
