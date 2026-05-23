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
export const GAS_LIMIT_NATIVE = 21000;
export const GAS_LIMIT_TOKEN = 65000;
