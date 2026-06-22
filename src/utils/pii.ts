/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PIIDetectResult {
  redactedText: string;
  detectedItems: Array<{
    type: 'EMAIL' | 'PHONE' | 'CREDIT_CARD' | 'API_KEY';
    original: string;
    replacement: string;
  }>;
}

/**
 * Enterprise client-side PII Masking utility
 * Masks emails, credit cards, telephone numbers, and auth keys before dispatches to LLM endpoints.
 */
export function redactPII(text: string): PIIDetectResult {
  let redactedText = text;
  const detectedItems: PIIDetectResult['detectedItems'] = [];

  // 1. Email Redaction
  const emailRegex = /([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g;
  let emailCount = 1;
  redactedText = redactedText.replace(emailRegex, (match) => {
    const replacement = `[CONFIDENTIAL_EMAIL_${emailCount++}]`;
    detectedItems.push({ type: 'EMAIL', original: match, replacement });
    return replacement;
  });

  // 2. Credit Card Redaction (standard 13 to 19 digit formats with or without hyphens)
  const creditCardRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|[56][0-9]{15}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g;
  const creditCardHyphenRegex = /\b(?:\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4})\b/g;
  
  redactedText = redactedText.replace(creditCardRegex, (match) => {
    const replacement = `[REDACTED_CREDIT_CARD]`;
    detectedItems.push({ type: 'CREDIT_CARD', original: match, replacement });
    return replacement;
  });

  redactedText = redactedText.replace(creditCardHyphenRegex, (match) => {
    const replacement = `[REDACTED_CREDIT_CARD]`;
    detectedItems.push({ type: 'CREDIT_CARD', original: match, replacement });
    return replacement;
  });

  // 3. Telephone Format Redaction
  const phoneRegex = /(\+?\d{1,3}[-.s]?)?\(?\d{3}\)?[-.s]?\d{3}[-.s]?\d{4}\b/g;
  redactedText = redactedText.replace(phoneRegex, (match) => {
    // Avoid redacting simple server logs or numbers like v4.9.4 or 2026-04-12
    if (match.includes('.') && !match.includes('-') && match.length < 10) return match;
    const replacement = `[REDACTED_PHONE]`;
    detectedItems.push({ type: 'PHONE', original: match, replacement });
    return replacement;
  });

  // 4. API Key or Secret Header Redaction
  const secretKeyRegex = /(?:api[_-]?key|secret|password|access[_-]?token|bearer)\s*[:=]\s*["']?([a-zA-Z0-9_\-]{8,})["']?/gi;
  redactedText = redactedText.replace(secretKeyRegex, (match, prefixValue) => {
    const replacementStr = match.replace(prefixValue, 'xxxxxxxx-REDACTED-xxxxxxxx');
    detectedItems.push({ type: 'API_KEY', original: match, replacement: replacementStr });
    return replacementStr;
  });

  return {
    redactedText,
    detectedItems
  };
}
