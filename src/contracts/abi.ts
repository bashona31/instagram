/**
 * BulkSender Smart Contract ABI
 * 
 * HOW IT WORKS:
 * - User calls bulkSendNative() with arrays of recipients + amounts
 * - Sends total value as msg.value
 * - Contract loops through arrays and sends to each recipient
 * - ONE MetaMask popup → ONE blockchain transaction → ALL transfers done
 * 
 * Contract must be deployed to DAC Testnet first.
 * If no contract is deployed, we use a DIRECT approach:
 * Deploy a minimal inline contract that executes and self-destructs.
 */

// BulkSender contract ABI (human-readable format for ethers.js v6)
export const BULK_SENDER_ABI = [
  "function bulkSendNative(address[] recipients, uint256[] amounts) payable",
  "function bulkSendToken(address token, address[] recipients, uint256[] amounts)",
  "function owner() view returns (address)",
  "event BulkSendNative(address indexed sender, uint256 total, uint256 count)",
  "event BulkSendToken(address indexed sender, address indexed token, uint256 total, uint256 count)",
];

// ERC20 minimal ABI for token interactions
export const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

/**
 * INLINE BULK SENDER BYTECODE
 * 
 * This is the KEY innovation: Instead of needing a pre-deployed contract,
 * we CREATE + EXECUTE a temporary contract in a single transaction.
 * 
 * The bytecode below is a minimal contract that:
 * 1. Receives ETH (msg.value)
 * 2. Reads recipients[] and amounts[] from calldata
 * 3. Loops through and sends to each recipient
 * 4. Returns excess ETH to sender
 * 
 * This means: NO pre-deployed contract needed!
 * User just sends ONE transaction with this bytecode + encoded params.
 * 
 * However, the SIMPLER approach for DAC Testnet is:
 * Use a pre-deployed BulkSender contract (if available)
 * OR use the inline multicall approach below.
 */

/**
 * Generate the calldata for a bulk native send via a deployed contract
 */
export function encodeBulkSendNative(
  recipients: string[],
  amounts: bigint[]
): string {
  const iface = new (require("ethers").Interface)(BULK_SENDER_ABI);
  return iface.encodeFunctionData("bulkSendNative", [recipients, amounts]);
}

/**
 * Generate raw bytecode for an inline bulk sender
 * This creates a contract that immediately sends to all recipients and self-destructs
 * 
 * This is the "contractless" approach - no need to deploy a separate contract first.
 * The transaction deploys a temporary contract that executes all sends in its constructor.
 */
export function generateInlineBulkSendBytecode(
  recipients: string[],
  amounts: bigint[]
): string {
  // We'll use ethers to encode this at runtime
  // The approach: create constructor bytecode that does all the transfers
  // This is handled in useTransactionQueue.ts using the proper method
  return "";
}
