import { Recipient, CSVRow } from "@/types";

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

export function sanitizeCSVInput(input: string): string {
  return input.replace(/^[=+\-@\t\r]/, "").trim();
}

export function parseRecipientsFromText(text: string): Recipient[] {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const recipients: Recipient[] = [];
  const seen = new Set<string>();

  lines.forEach((line, i) => {
    const parts = line.split(/[,\s\t]+/).filter(Boolean);
    if (parts.length < 2) {
      recipients.push({ id: `r-${i}`, address: parts[0] || "", amount: "", isValid: false, isDuplicate: false, error: "Invalid format" });
      return;
    }
    const address = sanitizeCSVInput(parts[0]);
    const amount = sanitizeCSVInput(parts[1]);
    const key = address.toLowerCase();
    const isDuplicate = seen.has(key);
    seen.add(key);
    const addressValid = isValidAddress(address);
    const amountValid = isValidAmount(amount);
    let error: string | undefined;
    if (!addressValid) error = "Invalid address";
    else if (!amountValid) error = "Invalid amount";
    else if (isDuplicate) error = "Duplicate";
    recipients.push({ id: `r-${i}`, address, amount, isValid: addressValid && amountValid && !isDuplicate, isDuplicate, error });
  });
  return recipients;
}

export function parseRecipientsFromCSV(data: CSVRow[]): Recipient[] {
  const recipients: Recipient[] = [];
  const seen = new Set<string>();

  data.forEach((row, i) => {
    const address = sanitizeCSVInput(row.address || "");
    const amount = sanitizeCSVInput(row.amount || "");
    const key = address.toLowerCase();
    const isDuplicate = seen.has(key);
    seen.add(key);
    const addressValid = isValidAddress(address);
    const amountValid = isValidAmount(amount);
    let error: string | undefined;
    if (!addressValid) error = "Invalid address";
    else if (!amountValid) error = "Invalid amount";
    else if (isDuplicate) error = "Duplicate";
    recipients.push({ id: `c-${i}`, address, amount, isValid: addressValid && amountValid && !isDuplicate, isDuplicate, error });
  });
  return recipients;
}

export function getValidRecipients(recipients: Recipient[]): Recipient[] {
  return recipients.filter((r) => r.isValid);
}

export function calculateTotalAmount(recipients: Recipient[]): string {
  const total = recipients.filter((r) => r.isValid).reduce((sum, r) => sum + parseFloat(r.amount), 0);
  if (total === 0) return "0";
  return total.toFixed(6).replace(/\.?0+$/, "");
}
