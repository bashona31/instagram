import { NetworkConfig } from "@/types";

export const DAC_NETWORK: NetworkConfig = {
  chainId: 21894,
  chainIdHex: "0x5586",
  networkName: "DAC Testnet",
  currencySymbol: "DACC",
  rpcUrl: "https://rpctest.dachain.tech",
  explorerUrl: "https://exptest.dachain.tech",
};

// Bulk Sender Contract Address on DAC Testnet
// Set this after deploying BulkSender.sol to DAC Testnet
// If empty, the app uses inline contract deployment approach
export const BULK_SENDER_CONTRACT = "";

export const MAX_BATCH_SIZE = 200;
export const MAX_RETRY_ATTEMPTS = 3;
export const GAS_LIMIT_NATIVE = 21000;
export const GAS_LIMIT_TOKEN = 65000;
