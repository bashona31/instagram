// ============================================================
// Formatting Utilities
// ============================================================

/**
 * Truncate an Ethereum address for display
 */
export function truncateAddress(address: string, chars = 6): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a balance value with specified decimals
 */
export function formatBalance(balance: string, decimals = 4): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return "0";
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  return num.toFixed(decimals).replace(/\.?0+$/, "");
}

/**
 * Format gas value in Gwei
 */
export function formatGas(gasWei: string): string {
  const gwei = parseFloat(gasWei) / 1e9;
  return gwei.toFixed(4);
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/**
 * Format timestamp to readable date/time
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Get explorer URL for a transaction hash
 */
export function getExplorerTxUrl(explorerUrl: string, hash: string): string {
  return `${explorerUrl}/tx/${hash}`;
}

/**
 * Get explorer URL for an address
 */
export function getExplorerAddressUrl(
  explorerUrl: string,
  address: string
): string {
  return `${explorerUrl}/address/${address}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  }
}
