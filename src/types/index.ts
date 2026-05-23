export type WalletProvider = "metamask" | "walletconnect";

export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  networkName: string;
  currencySymbol: string;
  rpcUrl: string;
  explorerUrl: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  chainId: number | null;
  isCorrectNetwork: boolean;
  provider: WalletProvider | null;
}

export interface Recipient {
  id: string;
  address: string;
  amount: string;
  isValid: boolean;
  isDuplicate: boolean;
  error?: string;
}

export enum TransactionStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
  RETRYING = "retrying",
  CANCELLED = "cancelled",
}

export interface TransactionRecord {
  id: string;
  recipient: string;
  amount: string;
  status: TransactionStatus;
  hash?: string;
  error?: string;
  gasUsed?: string;
  retryCount: number;
  timestamp: number;
}

export type SendMode = "native" | "erc20";

export interface BulkSendConfig {
  mode: SendMode;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  recipients: Recipient[];
}

export interface QueueState {
  isRunning: boolean;
  isPaused: boolean;
  totalTransactions: number;
  completedTransactions: number;
  successCount: number;
  failedCount: number;
  currentBatch: number;
  totalBatches: number;
  estimatedGas: string;
  totalAmountSent: string;
  totalGasUsed: string;
  transactions: TransactionRecord[];
}

export interface CSVRow {
  address: string;
  amount: string;
}

export type ThemeMode = "dark" | "light";
