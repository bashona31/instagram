import { NetworkConfig } from "@/types";

export const DAC_NETWORK: NetworkConfig = {
  chainId: 21894,
  chainIdHex: "0x5586",
  networkName: "DAC Testnet",
  currencySymbol: "DACC",
  rpcUrl: "https://rpctest.dachain.tech",
  explorerUrl: "https://exptest.dachain.tech",
};

export const MAX_CONCURRENT_TXS = 10;
export const MAX_RETRY_ATTEMPTS = 3;
export const TX_TIMEOUT_MS = 60000;
export const BULK_SENDER_CONTRACT = "0x0000000000000000000000000000000000000000";
export const GAS_BUFFER_MULTIPLIER = 1.1;
export const MAX_BATCH_SIZE = 200;
