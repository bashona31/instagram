// ============================================================
// Validation Utilities
// ============================================================

import { Recipient, CSVRow } from "@/types";

/**
 * Validate an Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate an amount string (positive number)
 */
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Sanitize CSV input to prevent injection
 */
export function sanitizeCSVInput(input: string): string {
  // Remove potential formula injection characters
  return input.replace(/^[=+\-@\t\r]/, "").trim();
}

/**
 * Parse and validate recipients from raw text input
 * Supports formats: address,amount or address amount
 */
export function parseRecipientsFromText(text: string): Recipient[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const recipients: Recipient[] = [];
  const seenAddresses = new Set<string>();

  lines.forEach((line, index) => {
    // Support comma, space, or tab delimiters
    const parts = line.split(/[,\s\t]+/).filter(Boolean);

    if (parts.length < 2) {
      recipients.push({
        id: `manual-${index}`,
        address: parts[0] || "",
        amount: "",
        isValid: false,
        isDuplicate: false,
        error: "Invalid format. Use: address,amount",
      });
      return;
    }

    const address = sanitizeCSVInput(parts[0]);
    const amount = sanitizeCSVInput(parts[1]);
    const normalizedAddress = address.toLowerCase();

    const isDuplicate = seenAddresses.has(normalizedAddress);
    seenAddresses.add(normalizedAddress);

    const addressValid = isValidAddress(address);
    const amountValid = isValidAmount(amount);

    let error: string | undefined;
    if (!addressValid) error = "Invalid address";
    else if (!amountValid) error = "Invalid amount";
    else if (isDuplicate) error = "Duplicate address";

    recipients.push({
      id: `manual-${index}`,
      address,
      amount,
      isValid: addressValid && amountValid && !isDuplicate,
      isDuplicate,
      error,
    });
  });

  return recipients;
}

/**
 * Parse recipients from CSV data
 */
export function parseRecipientsFromCSV(data: CSVRow[]): Recipient[] {
  const recipients: Recipient[] = [];
  const seenAddresses = new Set<string>();

  data.forEach((row, index) => {
    const address = sanitizeCSVInput(row.address || "");
    const amount = sanitizeCSVInput(row.amount || "");
    const normalizedAddress = address.toLowerCase();

    const isDuplicate = seenAddresses.has(normalizedAddress);
    seenAddresses.add(normalizedAddress);

    const addressValid = isValidAddress(address);
    const amountValid = isValidAmount(amount);

    let error: string | undefined;
    if (!addressValid) error = "Invalid address";
    else if (!amountValid) error = "Invalid amount";
    else if (isDuplicate) error = "Duplicate address";

    recipients.push({
      id: `csv-${index}`,
      address,
      amount,
      isValid: addressValid && amountValid && !isDuplicate,
      isDuplicate,
      error,
    });
  });

  return recipients;
}

/**
 * Filter valid recipients only
 */
export function getValidRecipients(recipients: Recipient[]): Recipient[] {
  return recipients.filter((r) => r.isValid);
}

/**
 * Calculate total amount from recipients
 */
export function calculateTotalAmount(recipients: Recipient[]): string {
  const total = recipients
    .filter((r) => r.isValid)
    .reduce((sum, r) => sum + parseFloat(r.amount), 0);
  return total.toFixed(18).replace(/\.?0+$/, "");
}
