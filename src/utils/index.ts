export function truncateAddress(addr: string, chars = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
}

export function formatBalance(bal: string, dec = 4): string {
  const n = parseFloat(bal);
  if (isNaN(n) || n === 0) return "0";
  return n.toFixed(dec).replace(/\.?0+$/, "");
}

export function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export function isValidAmount(amt: string): boolean {
  const n = parseFloat(amt);
  return !isNaN(n) && n > 0 && isFinite(n);
}

export function getExplorerTxUrl(hash: string): string {
  return `https://exptest.dachain.tech/tx/${hash}`;
}

export function getExplorerAddrUrl(addr: string): string {
  return `https://exptest.dachain.tech/address/${addr}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export function parseRecipients(text: string): { address: string; amount: string; isValid: boolean; isDuplicate: boolean; error?: string; id: string }[] {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const seen = new Set<string>();
  return lines.map((line, i) => {
    const parts = line.split(/[,\s\t]+/).filter(Boolean);
    const address = (parts[0] || "").replace(/^[=+\-@]/, "").trim();
    const amount = (parts[1] || "").trim();
    const key = address.toLowerCase();
    const isDuplicate = seen.has(key);
    seen.add(key);
    const addrValid = isValidAddress(address);
    const amtValid = isValidAmount(amount);
    let error: string | undefined;
    if (!addrValid) error = "Invalid address";
    else if (!amtValid) error = "Invalid amount";
    else if (isDuplicate) error = "Duplicate";
    return { id: `r-${i}`, address, amount, isValid: addrValid && amtValid && !isDuplicate, isDuplicate, error };
  });
}

export function generateCSV(txs: any[]): string {
  const hdr = "Recipient,Amount,Status,Hash,Error,Timestamp\n";
  const rows = txs.map(t => `"${t.recipient}","${t.amount}","${t.status}","${t.hash||""}","${t.error||""}","${new Date(t.timestamp).toISOString()}"`).join("\n");
  return hdr + rows;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
