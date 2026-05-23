// ============================================================
// Constants and Configuration
// ============================================================

import { NetworkConfig } from "@/types";

/** DAC Testnet network configuration */
export const DAC_NETWORK: NetworkConfig = {
  chainId: 21894,
  chainIdHex: "0x5586",
  networkName: "DAC Testnet",
  currencySymbol: "DACC",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://rpctest.dachain.tech",
  explorerUrl:
    process.env.NEXT_PUBLIC_EXPLORER_URL || "https://exptest.dachain.tech",
};

/** Maximum concurrent transactions */
export const MAX_CONCURRENT_TXS = parseInt(
  process.env.NEXT_PUBLIC_MAX_CONCURRENT_TXS || "10"
);

/** Maximum retry attempts for failed transactions */
export const MAX_RETRY_ATTEMPTS = parseInt(
  process.env.NEXT_PUBLIC_MAX_RETRY_ATTEMPTS || "3"
);

/** Transaction timeout in milliseconds */
export const TX_TIMEOUT_MS = parseInt(
  process.env.NEXT_PUBLIC_TX_TIMEOUT_MS || "60000"
);

/** Bulk sender contract address */
export const BULK_SENDER_CONTRACT =
  process.env.NEXT_PUBLIC_BULK_SENDER_CONTRACT ||
  "0x0000000000000000000000000000000000000000";

/** RPC fallback URLs */
export const RPC_FALLBACKS = [
  "https://rpctest.dachain.tech",
];

/** Gas buffer multiplier (10% extra) */
export const GAS_BUFFER_MULTIPLIER = 1.1;

/** Maximum recipients per batch for contract calls */
export const MAX_BATCH_SIZE = 200;

/** Minimum required balance buffer (in wei) */
export const MIN_BALANCE_BUFFER = "1000000000000000"; // 0.001 DACC
