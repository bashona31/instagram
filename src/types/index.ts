// ============================================================
// Type Definitions for DAC Bulk Sender
// ============================================================

/** Supported wallet providers */
export type WalletProvider = "metamask" | "walletconnect";

/** Network configuration */
export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  networkName: string;
  currencySymbol: string;
  rpcUrl: string;
  explorerUrl: string;
}

/** Wallet connection state */
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  chainId: number | null;
  isCorrectNetwork: boolean;
  provider: WalletProvider | null;
}

/** Individual recipient entry */
export interface Recipient {
  id: string;
  address: string;
  amount: string;
  isValid: boolean;
  isDuplicate: boolean;
  error?: string;
}

/** Transaction status enum */
export enum TransactionStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
  RETRYING = "retrying",
  CANCELLED = "cancelled",
}

/** Individual transaction record */
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

/** Bulk send mode */
export type SendMode = "native" | "erc20";

/** Bulk send configuration */
export interface BulkSendConfig {
  mode: SendMode;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  recipients: Recipient[];
  useContract: boolean;
}

/** Queue state */
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

/** Analytics data */
export interface AnalyticsData {
  totalWallets: number;
  totalAmountSent: string;
  successfulTxs: number;
  failedTxs: number;
  totalGasUsed: string;
  averageGasPerTx: string;
}

/** CSV parsed row */
export interface CSVRow {
  address: string;
  amount: string;
}

/** Toast notification type */
export type ToastType = "success" | "error" | "loading" | "info";

/** Theme mode */
export type ThemeMode = "dark" | "light";
