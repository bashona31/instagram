import { CSVRow, TransactionRecord } from "@/types";
import { sanitizeCSVInput } from "./validation";

export function parseCSV(content: string): CSVRow[] {
  const lines = content.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const first = lines[0].toLowerCase();
  const hasHeader = first.includes("address") || first.includes("wallet");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const parts = line.split(/[,;\t]+/).map((p) => sanitizeCSVInput(p.trim()));
    return { address: parts[0] || "", amount: parts[1] || "" };
  }).filter((row) => row.address.length > 0);
}

export function generateCSVExport(transactions: TransactionRecord[]): string {
  const headers = ["Recipient", "Amount", "Status", "Hash", "Gas Used", "Error", "Timestamp"];
  const rows = transactions.map((tx) => [
    tx.recipient, tx.amount, tx.status, tx.hash || "", tx.gasUsed || "", tx.error || "", new Date(tx.timestamp).toISOString(),
  ]);
  return [headers, ...rows].map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateSampleCSV(): string {
  return `address,amount\n0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28,1.5\n0x53d284357ec70cE289D6D64134DfAc8E511c8a3D,2.0\n0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B,0.75`;
}
